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
    <div className="space-y-6">
      <header className="flex items-center justify-between pt-2">
        <div>
          <h1 className="text-[24px] font-semibold tracking-tight">Bet</h1>
          <p className="text-sm text-ink-muted">
            Fake money only. Never real.
          </p>
        </div>
        <Link
          href="/bet/history"
          className="text-sm font-medium text-ink-muted hover:text-ink"
        >
          History
        </Link>
      </header>

      <div className="card flex items-center justify-between px-4 py-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">
            Fake wallet
          </p>
          <p className="mt-1 text-[28px] font-semibold tracking-tight">
            {formatUSD(wallet?.balance ?? 0)}
          </p>
        </div>
        <span className="pill">Simulated</span>
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
      <h2 className="mb-3 text-[17px] font-semibold">{title}</h2>
      <ul className="space-y-3">
        {games.map((g) => (
          <li key={g.id}>
            <Link
              href={`/bet/${g.id}`}
              className="card block p-4 transition hover:shadow-cardHover active:scale-[0.995]"
            >
              <p className="text-xs text-ink-muted">
                {new Date(g.startsAt).toLocaleString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </p>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-[15px] font-semibold">{g.awayTeam}</span>
                <span className="text-[13px] text-ink-muted">
                  {formatOdds(g.odds.moneylineAway)}
                </span>
              </div>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-[15px] font-semibold">{g.homeTeam}</span>
                <span className="text-[13px] text-ink-muted">
                  {formatOdds(g.odds.moneylineHome)}
                </span>
              </div>
              <div className="mt-3 flex items-center gap-2 text-xs text-ink-muted">
                <span className="pill">ML</span>
                <span className="pill">Spread</span>
                <span className="pill">Total {g.odds.total}</span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
