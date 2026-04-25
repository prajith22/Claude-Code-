import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe, PLANS, planFromPriceId } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const signature = req.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !secret) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const body = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, secret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const updateFromSubscription = async (sub: Stripe.Subscription) => {
    const customerId =
      typeof sub.customer === "string" ? sub.customer : sub.customer.id;
    const user = await prisma.user.findFirst({
      where: { stripeCustomerId: customerId },
    });
    if (!user) return;

    // Determine the active plan from whichever line item Stripe is billing.
    const item = sub.items.data[0];
    const priceId = item?.price?.id ?? null;
    const planId =
      (sub.metadata?.plan as keyof typeof PLANS | undefined) ??
      planFromPriceId(priceId);
    const plan = planId ? PLANS[planId] : null;

    const data: Record<string, unknown> = {
      stripeSubscriptionId: sub.id,
      subscriptionStatus: sub.status,
    };

    if (plan) {
      data.plan = plan.id;
      data.simulationsLimit = plan.simulationsLimit;
      // Fresh subscription / upgrade resets the cycle so the new cap
      // applies immediately rather than catching up to old usage.
      data.simulationsUsed = 0;
      data.billingCycleStart = new Date();
    }

    await prisma.user.update({ where: { id: user.id }, data });
  };

  switch (event.type) {
    case "checkout.session.completed": {
      const s = event.data.object as Stripe.Checkout.Session;
      if (s.subscription) {
        const sub = await stripe.subscriptions.retrieve(s.subscription as string);
        await updateFromSubscription(sub);
      }
      break;
    }
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      await updateFromSubscription(event.data.object as Stripe.Subscription);
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
