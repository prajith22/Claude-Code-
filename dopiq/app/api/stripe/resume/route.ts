import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Reverses an in-flight cancellation by flipping
 * cancel_at_period_end back to false. Subscription continues to
 * renew normally on the next billing date.
 *
 * Pairs with /api/stripe/cancel — same shape, same auth guard.
 */
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user?.stripeSubscriptionId) {
    return NextResponse.json(
      { error: "No subscription to resume." },
      { status: 400 },
    );
  }

  const sub = await stripe.subscriptions.update(user.stripeSubscriptionId, {
    cancel_at_period_end: false,
  });

  return NextResponse.json({
    cancelAt: sub.cancel_at,
    cancelAtPeriodEnd: sub.cancel_at_period_end,
  });
}
