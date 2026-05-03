import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { syncSubscriptionToUser } from "@/lib/stripe-sync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Stripe Checkout's success_url lands here. We synchronously read the
// session, mirror its subscription state into our DB, and only then
// redirect to /finish-setup?success=1. The intermediate sync avoids
// the race where the user's browser arrives at the destination before
// the webhook has had a chance to update the DB — without this step,
// requireSubscribedUser would see an empty subscriptionStatus and
// bounce them back to /paywall.
//
// We hand off to /finish-setup?success=1 (rather than /home directly)
// because mobile-Safari users who paid for the iOS app via the web
// flow need an explicit "switch back to the iOS app" prompt;
// /finish-setup renders that variant when ?success=1 is present.
// Web users who paid see the same page and continue normally — the
// success copy reads naturally for both audiences.
export async function GET(req: Request) {
  const origin =
    process.env.NEXTAUTH_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    new URL(req.url).origin;

  const url = new URL(req.url);
  const sessionId = url.searchParams.get("session_id");
  if (!sessionId) {
    return NextResponse.redirect(`${origin}/paywall`, { status: 302 });
  }

  try {
    const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["subscription"],
    });
    const sub = checkoutSession.subscription;
    if (sub && typeof sub !== "string") {
      await syncSubscriptionToUser(sub);
    } else if (typeof sub === "string") {
      const fullSub = await stripe.subscriptions.retrieve(sub);
      await syncSubscriptionToUser(fullSub);
    }
  } catch (err) {
    console.error("[stripe.checkout.success] sync failed:", err);
    // Fall through to /finish-setup?success=1 — the webhook will
    // eventually catch up, and if it doesn't the user will be
    // paywalled and can retry.
  }

  return NextResponse.redirect(
    `${origin}/finish-setup?success=1`,
    { status: 302 },
  );
}
