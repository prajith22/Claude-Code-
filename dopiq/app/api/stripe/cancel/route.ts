import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user?.stripeSubscriptionId) {
    return NextResponse.json(
      { error: "No active subscription to cancel." },
      { status: 400 },
    );
  }

  // Cancel at end of current billing period — user keeps access until then.
  // The webhook will mirror cancel_at_period_end into our DB; final
  // status flip happens when Stripe fires customer.subscription.deleted.
  const sub = await stripe.subscriptions.update(user.stripeSubscriptionId, {
    cancel_at_period_end: true,
  });

  return NextResponse.json({
    cancelAt: sub.cancel_at,
    cancelAtPeriodEnd: sub.cancel_at_period_end,
  });
}
