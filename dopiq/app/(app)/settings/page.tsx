import Link from "next/link";
import { requireUser } from "@/lib/session-guards";
import { stripe, PLANS, planFromPriceId, type PlanId } from "@/lib/stripe";
import { SettingsControls } from "@/components/SettingsControls";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  // Settings page is reachable even when status drifts to past_due, so we
  // only require a logged-in user — not an active sub.
  const user = await requireUser();

  let currentPlan: PlanId | null = null;
  let status: string | null = user.subscriptionStatus ?? null;
  let nextBillingAt: number | null = null;
  let cancelAtPeriodEnd = false;
  let stripeError: string | null = null;

  if (user.stripeSubscriptionId) {
    try {
      const sub = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
      status = sub.status;
      cancelAtPeriodEnd = sub.cancel_at_period_end;
      nextBillingAt = sub.current_period_end;
      const priceId = sub.items.data[0]?.price?.id ?? null;
      currentPlan =
        (sub.metadata?.plan as PlanId | undefined) ??
        planFromPriceId(priceId) ??
        (user.plan as PlanId | null);
    } catch (e) {
      stripeError = e instanceof Error ? e.message : "Failed to load subscription.";
      currentPlan = (user.plan as PlanId | null) ?? null;
    }
  }

  return (
    <div className="space-y-8 pb-4 pt-4">
      <header>
        <Link
          href="/home"
          className="text-[13px] font-semibold text-ink-muted hover:text-ink"
        >
          ← Back
        </Link>
        <h1 className="mt-3 font-heading text-[34px] font-bold leading-tight tracking-tight text-ink md:text-[42px]">
          Settings
        </h1>
      </header>

      <SettingsControls
        currentPlan={currentPlan}
        status={status}
        nextBillingAt={nextBillingAt}
        cancelAtPeriodEnd={cancelAtPeriodEnd}
        hasSubscription={!!user.stripeSubscriptionId}
        stripeError={stripeError}
        plans={Object.values(PLANS).map((p) => ({
          id: p.id,
          name: p.name,
          priceUsd: p.priceUsd,
          simulationsLimit: p.simulationsLimit,
        }))}
      />
    </div>
  );
}
