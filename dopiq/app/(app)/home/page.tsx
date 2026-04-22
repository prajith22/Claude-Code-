import Link from "next/link";
import { requireOnboardedSubscribedUser } from "@/lib/session-guards";
import { trialDaysRemaining } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { formatUSD } from "@/lib/utils";

export default async function HomePage() {
  const user = await requireOnboardedSubscribedUser();
  const wallet = await prisma.fakeWallet.findUnique({
    where: { userId: user.id },
  });
  const trialLeft = trialDaysRemaining(user.trialStartDate);
  const showTrial =
    user.subscriptionStatus === "trialing" && trialLeft > 0 && trialLeft <= 30;

  const firstName = user.name?.split(" ")[0] ?? "there";

  return (
    <div className="space-y-6">
      <div className="pt-2">
        <p className="text-sm text-ink-muted">Hey, {firstName}</p>
        <h1 className="mt-1 text-[28px] font-semibold leading-tight tracking-tight">
          Get the hit, keep the bank account.
        </h1>
      </div>

      {showTrial && (
        <div className="rounded-2xl border border-surface-border bg-surface-alt px-4 py-3 text-sm">
          <span className="font-semibold text-ink">
            {trialLeft} {trialLeft === 1 ? "day" : "days"} left in trial
          </span>
          <span className="text-ink-muted"> · $3.99/mo after</span>
        </div>
      )}

      <div className="card flex items-center justify-between px-4 py-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">
            Fake wallet
          </p>
          <p className="mt-1 text-[24px] font-semibold tracking-tight">
            {formatUSD(wallet?.balance ?? 0)}
          </p>
        </div>
        <Link href="/bet" className="btn-secondary px-4 py-2 text-sm">
          Place a bet
        </Link>
      </div>

      <div className="space-y-3">
        <FeatureCard
          href="/shop"
          title="Shop"
          subtitle="Fake checkout, real dopamine."
          accent="Simulated"
        />
        <FeatureCard
          href="/food"
          title="Food"
          subtitle="Order in, watch the delivery, no delivery."
          accent="Simulated"
        />
        <FeatureCard
          href="/bet"
          title="Bet"
          subtitle="NFL & NBA odds with fake money only."
          accent="Simulated"
        />
        <FeatureCard
          href="/tracker"
          title="Tracker"
          subtitle="Log what you actually spent this week."
          accent="Real"
        />
      </div>
    </div>
  );
}

function FeatureCard({
  href,
  title,
  subtitle,
  accent,
}: {
  href: string;
  title: string;
  subtitle: string;
  accent: "Simulated" | "Real";
}) {
  return (
    <Link
      href={href}
      className="card flex items-center justify-between gap-4 px-4 py-4 transition hover:shadow-cardHover active:scale-[0.995]"
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-[17px] font-semibold text-ink">{title}</p>
          <span
            className={
              accent === "Simulated"
                ? "pill"
                : "inline-flex items-center rounded-full border border-brand/30 bg-brand-light px-3 py-1 text-xs font-medium text-brand"
            }
          >
            {accent}
          </span>
        </div>
        <p className="mt-1 text-[14px] text-ink-muted">{subtitle}</p>
      </div>
      <span className="flex-none text-ink-muted" aria-hidden="true">
        ›
      </span>
    </Link>
  );
}
