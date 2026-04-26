import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { syncSubscriptionToUser } from "@/lib/stripe-sync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Stripe Checkout's success_url lands here. We synchronously read the
// session, mirror its subscription state into our DB, and only then
// redirect to /home. This avoids the race where the user's browser
// arrives at /home before the webhook has had a chance to update the
// DB — without this step, requireSubscribedUser sees an empty
// subscriptionStatus and bounces them back to /paywall.
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
    // Fall through to /home — the webhook will eventually catch up,
    // and if it doesn't the user will be paywalled and can retry.
  }

  return NextResponse.redirect(`${origin}/home`, { status: 302 });
}
