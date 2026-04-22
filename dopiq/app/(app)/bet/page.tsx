import Link from "next/link";
import games from "@/data/games.json";
import type { Game } from "@/types";
import { requireOnboardedSubscribedUser } from "@/lib/session-guards";
import { prisma } from "@/lib/prisma";
import { formatOdds, formatUSD } from "@/lib/utils";

export default async function BetPage() {
  const user = await requireOnboardedSubscribedUser();
  const wallet = await prisma.fakeWallet.findUnique({
    where: { userId: user.id },
  });
  const all = games as Game[];
  const nfl = all.filter((g) => g.sport === "NFL");
  const nba = all.filter((g) => g.sport === "NBA");

  return (
    <div className="space-y-6 pb-4">
      <header className="flex items-center justify-between pt-2">
        <div>
          <h1 className="text-[26px] font-bold tracking-tight">Bet</h1>
          <p className="mt-0.5 text-sm text-ink-muted">Fake money only. Never real.</p>
        </div>
        <Link
          href="/bet/history"
          className="rounded-pill border border-surface-border bg-white px-4 py-2 text-[13px] font-semibold text-ink-muted transition hover:bg-surface-alt"
        >
          History
        </Link>
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

      <SportSection title="NFL" games={nfl} />
      <SportSection title="NBA" games={nba} />
    </div>
  );
}

function SportSection({ title, games }: { title: string; games: Game[] }) {
  if (games.length === 0) return null;
  return (
    <section>
      <div className="mb-3 flex items-center gap-2">
        <h2 className="text-[17px] font-bold tracking-tight">{title}</h2>
        {/* live indicator */}
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-brand" />
        </span>
        <span className="text-[11px] font-semibold uppercase tracking-wide text-brand">
          Live
        </span>
      </div>
      <ul className="space-y-3">
        {games.map((g) => (
          <GameCard key={g.id} game={g} />
        ))}
      </ul>
    </section>
  );
}

function GameCard({ game: g }: { game: Game }) {
  const homeIsFavorite = g.odds.moneylineHome < 0;
  return (
    <li>
      <Link
        href={`/bet/${g.id}`}
        className="card group block p-4 transition-all duration-150 hover:scale-[1.01] hover:shadow-cardHover active:scale-[0.995]"
      >
        <p className="text-[11px] font-semibold uppercase tracking-widest text-ink-muted">
          {g.sport} ·{" "}
          {new Date(g.startsAt).toLocaleString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
          })}
        </p>

        <div className="mt-3 space-y-2">
          {/* Away team */}
          <div className="flex items-center justify-between">
            <span className="text-[16px] font-bold text-ink">{g.awayTeam}</span>
            <span
              className={
                "text-[15px] font-bold money " +
                (g.odds.moneylineAway > 0 ? "text-brand" : "text-ink")
              }
            >
              {formatOdds(g.odds.moneylineAway)}
            </span>
          </div>
          {/* Home team */}
          <div className="flex items-center justify-between">
            <span className="text-[16px] font-bold text-ink">{g.homeTeam}</span>
            <span
              className={
                "text-[15px] font-bold money " +
                (g.odds.moneylineHome > 0 ? "text-brand" : "text-ink")
              }
            >
              {formatOdds(g.odds.moneylineHome)}
            </span>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <span className="pill">Moneyline</span>
          <span className="pill">Spread</span>
          <span className="pill">Total {g.odds.total}</span>
          <span className="ml-auto text-brand opacity-0 transition-opacity group-hover:opacity-100 text-lg">
            →
          </span>
        </div>
      </Link>
    </li>
  );
}
