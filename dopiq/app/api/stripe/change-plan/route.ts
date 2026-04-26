import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PLANS, stripe, type PlanId } from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as { plan?: PlanId } | null;
  const planId = body?.plan;
  if (!planId || !(planId in PLANS)) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }
  const plan = PLANS[planId];
  if (!plan.priceId) {
    return NextResponse.json(
      { error: `Stripe price ID for ${plan.name} is not configured.` },
      { status: 500 },
    );
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user?.stripeSubscriptionId) {
    return NextResponse.json(
      { error: "No active subscription to change." },
      { status: 400 },
    );
  }

  const sub = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
  const item = sub.items.data[0];
  if (!item) {
    return NextResponse.json(
      { error: "Subscription has no line items." },
      { status: 500 },
    );
  }

  const updated = await stripe.subscriptions.update(user.stripeSubscriptionId, {
    items: [{ id: item.id, price: plan.priceId }],
    proration_behavior: "create_prorations",
    metadata: { ...sub.metadata, plan: plan.id },
    cancel_at_period_end: false,
  });

  return NextResponse.json({ status: updated.status, plan: plan.id });
}
