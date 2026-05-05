import { type Plan } from "@/lib/stripe";
import { PlanCheckoutButton } from "@/components/PaywallCTA";

// Shared plan-card markup for the web Stripe paywall. Used by both
// /paywall (the canonical paywall route) and /finish-setup (the
// post-onboarding web landing surface). Extracted so the two
// surfaces stay visually identical without duplicating ~60 lines
// of JSX.
//
// IMPORTANT: this component renders pricing and is allowed to —
// the iOS shell intercepts /paywall and /finish-setup before the
// WebView loads them and shows the native StoreKit paywall (see
// dopiq-ios/components/NativePaywall.tsx) instead, so this card
// only paints for mobile Safari + desktop browsers.
export function PaywallPlanCard({ plan }: { plan: Plan }) {
  const isHighlighted = plan.highlighted;
  return (
    <div
      className={`relative flex flex-col rounded-card border p-6 transition-all ${
        isHighlighted
          ? "border-brand bg-white shadow-cardHover md:scale-[1.03]"
          : "border-surface-border bg-white shadow-card"
      }`}
    >
      {isHighlighted && (
        <span className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 rounded-pill bg-brand px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-navy shadow-sm">
          Most Popular
        </span>
      )}

      <p className="font-heading text-[20px] font-bold tracking-tight text-ink">
        {plan.name}
      </p>
      <div className="mt-3 flex items-baseline gap-1">
        <span className="money text-[40px] text-navy">
          ${plan.priceUsd.toFixed(2)}
        </span>
        <span className="text-[14px] text-ink-muted">/mo</span>
      </div>
      <p className="mt-1 text-[12px] font-semibold uppercase tracking-widest text-ink-muted">
        {plan.simulationsLimit >= 999_999
          ? "Unlimited simulations"
          : `${plan.simulationsLimit} simulations / month`}
      </p>

      <ul className="mt-5 flex-1 space-y-2.5 text-[14px] text-ink">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-2.5">
            <span className="mt-0.5 inline-flex h-5 w-5 flex-none items-center justify-center rounded-full bg-brand-light text-brand">
              <svg viewBox="0 0 20 20" className="h-3 w-3" aria-hidden>
                <path
                  fill="currentColor"
                  d="M7.7 13.3 4.4 10l-1.4 1.4 4.7 4.7 10-10-1.4-1.4z"
                />
              </svg>
            </span>
            <span>{f}</span>
          </li>
        ))}
      </ul>

      <div className="mt-6">
        <PlanCheckoutButton
          plan={plan.id}
          label={plan.ctaLabel}
          variant={isHighlighted ? "primary" : "navy"}
        />
        <p className="mt-2 text-center text-[12px] text-ink-muted">
          7-day free trial — cancel anytime
        </p>
      </div>
    </div>
  );
}
