import Link from "next/link";
import { Suspense } from "react";
import { requireUser } from "@/lib/session-guards";
import { isIOSWebView } from "@/lib/is-ios-webview";
import { stripe, PLANS, planFromPriceId, type PlanId } from "@/lib/stripe";
import { SettingsControls } from "@/components/SettingsControls";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  // Settings page is reachable even when status drifts to past_due, so we
  // only require a logged-in user — not an active sub.
  const user = await requireUser();

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

      {/* Stripe round-trip is the slow bit (~200-600ms). Streaming it
          behind Suspense lets the header + back button paint instantly
          while the body loads. */}
      <Suspense fallback={<SettingsSkeleton />}>
        <SettingsBody
          stripeSubscriptionId={user.stripeSubscriptionId}
          userPlan={(user.plan as PlanId | null) ?? null}
          userSubscriptionStatus={user.subscriptionStatus ?? null}
          isReviewer={user.isReviewer}
          isIOSWebView={isIOSWebView()}
        />
      </Suspense>
    </div>
  );
}

async function SettingsBody({
  stripeSubscriptionId,
  userPlan,
  userSubscriptionStatus,
  isReviewer,
  isIOSWebView,
}: {
  stripeSubscriptionId: string | null;
  userPlan: PlanId | null;
  userSubscriptionStatus: string | null;
  isReviewer: boolean;
  isIOSWebView: boolean;
}) {
  let currentPlan: PlanId | null = null;
  let status: string | null = userSubscriptionStatus;
  let nextBillingAt: number | null = null;
  let cancelAtPeriodEnd = false;
  let stripeError: string | null = null;

  if (stripeSubscriptionId) {
    try {
      const sub = await stripe.subscriptions.retrieve(stripeSubscriptionId);
      status = sub.status;
      cancelAtPeriodEnd = sub.cancel_at_period_end;
      nextBillingAt = sub.current_period_end;
      const priceId = sub.items.data[0]?.price?.id ?? null;
      currentPlan =
        (sub.metadata?.plan as PlanId | undefined) ??
        planFromPriceId(priceId) ??
        userPlan;
    } catch (e) {
      stripeError = e instanceof Error ? e.message : "Failed to load subscription.";
      currentPlan = userPlan;
    }
  }

  return (
    <SettingsControls
      currentPlan={currentPlan}
      status={status}
      nextBillingAt={nextBillingAt}
      cancelAtPeriodEnd={cancelAtPeriodEnd}
      hasSubscription={!!stripeSubscriptionId}
      stripeError={stripeError}
      plans={Object.values(PLANS).map((p) => ({
        id: p.id,
        name: p.name,
        priceUsd: p.priceUsd,
        simulationsLimit: p.simulationsLimit,
      }))}
      isReviewer={isReviewer}
      isIOSWebView={isIOSWebView}
    />
  );
}

function SettingsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-[160px] animate-pulse rounded-card border border-surface-border bg-surface-alt" />
      <div className="h-[120px] animate-pulse rounded-card border border-surface-border bg-surface-alt" />
      <div className="h-[200px] animate-pulse rounded-card border border-surface-border bg-surface-alt" />
    </div>
  );
}
