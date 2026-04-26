import Link from "next/link";
import { requireSubscribedUser } from "@/lib/session-guards";
import { BetGamesList } from "@/components/BetGamesList";
import { BetSlipPanel } from "@/components/BetSlipPanel";
import { FeaturedParlays } from "@/components/FeaturedParlays";

export default async function BetPage() {
  await requireSubscribedUser();

  return (
    <div className="pb-nav-action space-y-6 lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-10 lg:space-y-0 lg:pb-10">
      {/* Main column */}
      <div className="space-y-6">
        <header className="flex items-start justify-between gap-3 pt-2">
          <div>
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
            <p className="mt-0.5 text-sm text-ink-muted">
              Pick a game, pick a bet — just for the thrill.
            </p>
          </div>
          <Link
            href="/bet/tickets"
            className="flex-none rounded-pill border border-surface-border bg-white px-3 py-1.5 text-[12px] font-bold text-ink shadow-sm transition hover:bg-surface-alt"
          >
            My tickets →
          </Link>
        </header>

        {/* Featured parlays strip */}
        <FeaturedParlays />

        {/* Sport tabs + game cards */}
        <BetGamesList />
      </div>

      {/* Bet slip — desktop rail + mobile bottom sheet */}
      <BetSlipPanel />
    </div>
  );
}
