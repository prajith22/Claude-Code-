import Link from "next/link";
import { requireOnboardedSubscribedUser } from "@/lib/session-guards";
import { trialDaysRemaining } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { formatUSD } from "@/lib/utils";

export default async function HomePage() {
  const user = await requireOnboardedSubscribedUser();
  const wallet = await prisma.fakeWallet.findUnique({ where: { userId: user.id } });
  const trialLeft = trialDaysRemaining(user.trialStartDate);
  const showTrial = user.subscriptionStatus === "trialing" && trialLeft > 0;
  const firstName = user.name?.split(" ")[0] ?? "there";

  return (
    <div className="space-y-5 pb-4">
      {/* Hero card */}
      <div className="card-navy px-6 py-8 md:px-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[13px] font-medium text-brand uppercase tracking-widest">
              Welcome back
            </p>
            <h1 className="mt-1 text-[30px] font-bold leading-tight tracking-tight text-white md:text-[36px]">
              Hey, {firstName}.
            </h1>
            <p className="mt-1 text-[15px] text-white/60">
              Spend it all. Keep it all.
            </p>
          </div>
          {showTrial && (
            <span className="flex-none rounded-pill bg-white/10 px-3 py-1.5 text-[12px] font-semibold text-white/80 whitespace-nowrap">
              {trialLeft}d left
            </span>
          )}
        </div>

        <div className="mt-8 border-t border-white/10 pt-6">
          <p className="text-[12px] font-semibold uppercase tracking-widest text-white/40">
            Fake wallet
          </p>
          <p className="mt-1 text-[42px] font-bold tracking-tight text-brand money md:text-[52px]">
            {formatUSD(wallet?.balance ?? 0)}
          </p>
          <p className="mt-1 text-[12px] text-white/40">Simulated balance · never real</p>
        </div>
      </div>

      {/* 2×2 simulator grid */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <SimCard href="/shop"    emoji="🛍️" label="Shop"    desc="Fake checkout" />
        <SimCard href="/food"    emoji="🍔" label="Food"    desc="Order in" />
        <SimCard href="/bet"     emoji="🎰" label="Bet"     desc="Fake money only" />
        <SimCard href="/tracker" emoji="📊" label="Tracker" desc="Real spending" real />
      </div>
    </div>
  );
}

function SimCard({
  href, emoji, label, desc, real,
}: {
  href: string; emoji: string; label: string; desc: string; real?: boolean;
}) {
  return (
    <Link
      href={href}
      className="group card-navy flex flex-col gap-3 p-4 transition-all duration-150 hover:scale-[1.02] hover:shadow-navyHover md:p-5"
    >
      <span className="text-[32px] leading-none">{emoji}</span>
      <div>
        <div className="flex items-center gap-2">
          <p className="text-[16px] font-bold text-white">{label}</p>
          {real && (
            <span className="rounded-pill bg-brand px-2 py-0.5 text-[10px] font-bold text-navy">
              REAL
            </span>
          )}
        </div>
        <p className="mt-0.5 text-[12px] text-white/50">{desc}</p>
      </div>
      <span className="mt-auto text-brand opacity-0 transition-opacity duration-150 group-hover:opacity-100 text-lg">
        →
      </span>
    </Link>
  );
}

/* inline tailwind arbitrary value shorthand */
declare module "react" {
  interface HTMLAttributes<T> extends AriaAttributes, DOMAttributes<T> {
    className?: string;
  }
}
