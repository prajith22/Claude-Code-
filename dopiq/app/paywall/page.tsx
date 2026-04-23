import { redirect } from "next/navigation";
import { requireUser } from "@/lib/session-guards";
import { computeAccessState, trialDaysRemaining } from "@/lib/access";
import { PaywallCTA } from "@/components/PaywallCTA";

export default async function PaywallPage() {
  const user = await requireUser();
  const state = computeAccessState({
    subscriptionStatus: user.subscriptionStatus,
    trialStartDate: user.trialStartDate,
  });
  if (state === "active") redirect("/home");

  const daysLeft = trialDaysRemaining(user.trialStartDate);

  return (
    <main className="mx-auto flex min-h-[100dvh] max-w-md flex-col px-6 pt-10 pb-8 safe-top">
      <div className="flex-1">
        <span className="pill">
          {state === "trialing" ? `${daysLeft} days left in trial` : "Trial ended"}
        </span>
        <h1 className="mt-5 text-[32px] font-semibold leading-tight tracking-tight text-ink">
          Keep the dopamine.
          <br />
          Keep your money.
        </h1>
        <p className="mt-4 text-[16px] text-ink-muted">
          Dopiq is $3.99 a month — less than one impulse purchase you didn&apos;t
          make.
        </p>

        <div className="mt-8 card p-5">
          <div className="flex items-baseline gap-2">
            <span className="text-[40px] font-semibold tracking-tight text-ink">
              $3.99
            </span>
            <span className="text-ink-muted">/ month</span>
          </div>
          <ul className="mt-5 space-y-3 text-[15px] text-ink">
            <Bullet>Unlimited fake shopping, food, and betting sims</Bullet>
            <Bullet>Live NFL, NBA, MLB &amp; NHL odds and player props</Bullet>
            <Bullet>Real spending tracker with weekly trends</Bullet>
            <Bullet>Cancel in two taps, keep your data</Bullet>
          </ul>
        </div>
      </div>

      <PaywallCTA />
    </main>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-1 inline-flex h-5 w-5 flex-none items-center justify-center rounded-full bg-brand-light text-brand">
        <svg viewBox="0 0 20 20" className="h-3 w-3" aria-hidden="true">
          <path
            fill="currentColor"
            d="M7.7 13.3 4.4 10l-1.4 1.4 4.7 4.7 10-10-1.4-1.4z"
          />
        </svg>
      </span>
      <span>{children}</span>
    </li>
  );
}
