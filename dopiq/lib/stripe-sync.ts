import type Stripe from "stripe";
import { PLANS, planFromPriceId } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

/**
 * Mirrors a Stripe subscription's state onto the matching User row.
 * Used by both the webhook and the post-checkout redirect handler so
 * the user lands on /home with the correct subscriptionStatus even
 * when the webhook hasn't been delivered yet.
 *
 * Safe to call repeatedly: the second call is idempotent.
 */
export async function syncSubscriptionToUser(sub: Stripe.Subscription) {
  const customerId =
    typeof sub.customer === "string" ? sub.customer : sub.customer.id;
  const user = await prisma.user.findFirst({
    where: { stripeCustomerId: customerId },
  });
  if (!user) return null;

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
    // Reset usage on new subscription / upgrade so the new cap applies
    // immediately. Skipped on plain status changes (e.g. trialing -> active)
    // because the plan is the same; we still update billingCycleStart only
    // when the plan changes vs. the user's current plan.
    if (user.plan !== plan.id) {
      data.simulationsUsed = 0;
      data.billingCycleStart = new Date();
    }
  }

  await prisma.user.update({ where: { id: user.id }, data });
  return user.id;
}
