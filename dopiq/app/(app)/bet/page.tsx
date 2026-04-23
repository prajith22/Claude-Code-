import { requireOnboardedSubscribedUser } from "@/lib/session-guards";
import { prisma } from "@/lib/prisma";
import { formatUSD } from "@/lib/utils";
import { BetGamesList } from "@/components/BetGamesList";

export default async function BetPage() {
  const user = await requireOnboardedSubscribedUser();
  const wallet = await prisma.fakeWallet.findUnique({
    where: { userId: user.id },
  });

  return (
    <div className="space-y-6 pb-4">
      <header className="pt-2">
        <div className="flex items-center gap-2">
          <h1 className="text-[26px] font-bold tracking-tight">Bet</h1>
          {/* Live odds indicator */}
          <span className="inline-flex items-center gap-1.5 rounded-pill bg-brand-light px-2.5 py-1">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-brand" />
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wide text-brand">
              Live odds
            </span>
          </span>
        </div>
        <p className="mt-0.5 text-sm text-ink-muted">Fake money only. Never real.</p>
      </header>

      {/* Dark navy wallet card */}
      <div className="card-navy px-6 py-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-white/40">
              Fake wallet
            </p>
            <p className="mt-1 text-[38px] font-bold tracking-tight text-brand money">
              {formatUSD(wallet?.balance ?? 0)}
            </p>
            <p className="mt-0.5 text-[12px] text-white/40">
              Simulated balance · never real
            </p>
          </div>
          <span className="rounded-pill bg-white/10 px-3 py-1.5 text-[11px] font-bold text-white/70">
            SIMULATED
          </span>
        </div>
      </div>

      <BetGamesList />
    </div>
  );
}
