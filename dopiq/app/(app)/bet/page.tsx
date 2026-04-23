import { requireOnboardedSubscribedUser } from "@/lib/session-guards";
import { BetGamesList } from "@/components/BetGamesList";

export default async function BetPage() {
  await requireOnboardedSubscribedUser();

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
        <p className="mt-0.5 text-sm text-ink-muted">
          Pick a game, pick a bet — just for the thrill.
        </p>
      </header>

      <BetGamesList />
    </div>
  );
}
