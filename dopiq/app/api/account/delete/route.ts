import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Permanently delete the signed-in user's account.
 *
 * Order is critical: Stripe FIRST so we can guarantee no future
 * charges hit a customer whose DB row is already gone. Only after a
 * clean Stripe response do we delete the DB rows.
 *
 * Cascade behaviour: prisma.user.delete cascades Account + Session
 * via the onDelete: Cascade relations in schema.prisma. We still
 * delete Urge and BetTicket explicitly inside the same transaction
 * so the operation is atomic and the intent is unambiguous.
 */
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, stripeSubscriptionId: true },
  });
  if (!user) {
    return NextResponse.json({ error: "Account not found." }, { status: 404 });
  }

  // 1. Cancel the Stripe subscription immediately (no period-end
  //    grace) so the user is never charged again. If Stripe says the
  //    sub is already gone, that's fine — we're trying to reach the
  //    same end state. Anything else is a real failure: we return 502
  //    and leave the DB intact so the user can retry from a clean
  //    state instead of being orphaned in Stripe.
  if (user.stripeSubscriptionId) {
    try {
      await stripe.subscriptions.cancel(user.stripeSubscriptionId);
    } catch (err) {
      const stripeErr = err as Stripe.errors.StripeError;
      const benign =
        stripeErr?.code === "resource_missing" ||
        /canceled|cancelled/i.test(stripeErr?.message ?? "");
      if (!benign) {
        const message =
          stripeErr?.message ?? "Couldn’t cancel your subscription.";
        console.error("[account.delete] stripe cancel failed:", err);
        return NextResponse.json(
          { error: `Stripe error: ${message}. Nothing was deleted.` },
          { status: 502 },
        );
      }
    }
  }

  // 2. Delete the user's data. Single transaction so a partial
  //    failure doesn't leave dangling Urges / Tickets.
  try {
    await prisma.$transaction([
      prisma.urge.deleteMany({ where: { userId: user.id } }),
      prisma.betTicket.deleteMany({ where: { userId: user.id } }),
      prisma.user.delete({ where: { id: user.id } }),
    ]);
  } catch (err) {
    console.error("[account.delete] db delete failed:", err);
    return NextResponse.json(
      {
        error:
          "Subscription was canceled, but your account couldn’t be removed. Try again or contact support.",
      },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
