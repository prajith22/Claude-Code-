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
          subscriptionSource={user.subscriptionSource ?? null}
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
  subscriptionSource,
  isReviewer,
  isIOSWebView,
}: {
  stripeSubscriptionId: string | null;
  userPlan: PlanId | null;
  userSubscriptionStatus: string | null;
  subscriptionSource: string | null;
  isReviewer: boolean;
  isIOSWebView: boolean;
}) {
  // Default to the User row's own values. For an IAP-sourced user
  // these are the source of truth (their subscription is governed
  // by Apple — there's no Stripe object to retrieve), and for a
  // Stripe user they're a fallback if the Stripe call below fails.
  let currentPlan: PlanId | null = userPlan;
  let status: string | null = userSubscriptionStatus;
  let nextBillingAt: number | null = null;
  let cancelAtPeriodEnd = false;
  let stripeError: string | null = null;

  // Only round-trip Stripe for Stripe-managed subscriptions. IAP
  // users have stripeSubscriptionId === null on purpose; calling
  // stripe.subscriptions.retrieve there would 4xx and put the user
  // on the "No plan selected" fallback even though their User row
  // says they're active. Source-agnostic: subscriptionStatus is
  // what computeAccessState reads, and that's what we should
  // surface in the UI too.
  if (subscriptionSource === "stripe" && stripeSubscriptionId) {
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

  // hasSubscription is now source-agnostic: a user is subscribed
  // when their subscriptionStatus is one of the access-granting
  // states, regardless of payment processor. This unblocks IAP
  // users (stripeSubscriptionId=null) from rendering as "no
  // active subscription".
  const hasSubscription = status === "active" || status === "trialing";

  return (
    <SettingsControls
      currentPlan={currentPlan}
      status={status}
      nextBillingAt={nextBillingAt}
      cancelAtPeriodEnd={cancelAtPeriodEnd}
      hasSubscription={hasSubscription}
      subscriptionSource={subscriptionSource}
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
