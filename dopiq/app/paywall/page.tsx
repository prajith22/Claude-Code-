import Link from "next/link";
import { requireUser } from "@/lib/session-guards";
import { computeAccessState, isTrialActive, trialDaysRemaining } from "@/lib/access";
import { PLANS, type Plan } from "@/lib/stripe";
import { PlanCheckoutButton } from "@/components/PaywallCTA";

export default async function PaywallPage() {
  const user = await requireUser();
  const state = computeAccessState(user);
  const trialing = state === "trial" && isTrialActive(user);
  const daysLeft = trialDaysRemaining(user);

  const headline = trialing ? "Start your free month" : "Your free trial has ended";
  const subhead = trialing
    ? "No charge for 30 days. Cancel anytime."
    : "Choose a plan to keep simulating.";

  const order: Plan[] = [PLANS.lite, PLANS.plus, PLANS.pro];

  return (
    <main className="mx-auto flex min-h-[100dvh] max-w-5xl flex-col px-6 pt-10 pb-12 safe-top">
      {/* Hero */}
      <header className="text-center">
        <Link href="/home" className="inline-flex items-center gap-3">
          <svg width="44" height="44" viewBox="0 0 44 44" fill="none" aria-hidden>
            <rect width="44" height="44" rx="10" fill="#00C853" />
            <path d="M10 10 L10 34 L18 34 Q30 34 30 22 Q30 10 18 10 Z" fill="white" />
            <line x1="10" y1="22" x2="27" y2="22" stroke="#00C853" strokeWidth="2.5" />
          </svg>
          <span className="font-heading text-[28px] font-extrabold leading-none text-ink">
            dopiq
          </span>
        </Link>
        {trialing && daysLeft > 0 && (
          <p className="mt-4">
            <span className="pill">{daysLeft} days left in trial</span>
          </p>
        )}
        <h1 className="mt-5 font-heading text-[34px] font-bold leading-tight tracking-tight text-ink md:text-[42px]">
          {headline}
        </h1>
        <p className="mx-auto mt-3 max-w-md text-[16px] text-ink-muted">
          {subhead}
        </p>
      </header>

      {/* Three pricing cards */}
      <section className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-3">
        {order.map((plan) => (
          <PlanCard key={plan.id} plan={plan} />
        ))}
      </section>

      {/* Footer */}
      <footer className="mt-10 text-center">
        <p className="text-[14px] text-ink-muted">
          Already have an account?{" "}
          <Link href="/signin" className="font-semibold text-ink underline">
            Sign in
          </Link>
        </p>
        <p className="mx-auto mt-3 max-w-md text-[12px] text-ink-faint">
          All plans include a 30-day free trial. No credit card required to start.
        </p>
      </footer>
    </main>
  );
}

function PlanCard({ plan }: { plan: Plan }) {
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
      </div>
    </div>
  );
}
