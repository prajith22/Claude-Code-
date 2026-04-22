import Link from "next/link";
import { requireOnboardedSubscribedUser } from "@/lib/session-guards";
import { prisma } from "@/lib/prisma";
import { formatDate, formatOdds, formatUSD } from "@/lib/utils";
import { SimulateButton } from "@/components/SimulateButton";

export default async function BetHistoryPage() {
  const user = await requireOnboardedSubscribedUser();
  const [bets, wallet] = await Promise.all([
    prisma.bet.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.fakeWallet.findUnique({ where: { userId: user.id } }),
  ]);

  const pnl = bets.reduce((sum, b) => {
    if (b.status !== "resolved") return sum;
    return sum + (b.result === "win" ? b.potentialPayout : -b.amount);
  }, 0);

  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between pt-2">
        <div>
          <h1 className="text-[24px] font-semibold tracking-tight">Bet history</h1>
          <p className="text-sm text-ink-muted">
            All simulated. All fake money.
          </p>
        </div>
        <Link
          href="/bet"
          className="text-sm font-medium text-ink-muted hover:text-ink"
        >
          Games
        </Link>
      </header>

      <div className="card grid grid-cols-2 gap-3 p-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">
            Fake wallet
          </p>
          <p className="mt-1 text-[22px] font-semibold tracking-tight">
            {formatUSD(wallet?.balance ?? 0)}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">
            Total P&amp;L
          </p>
          <p
            className={
              "mt-1 text-[22px] font-semibold tracking-tight " +
              (pnl > 0 ? "text-brand" : pnl < 0 ? "text-red-600" : "text-ink")
            }
          >
            {pnl > 0 ? "+" : ""}
            {formatUSD(pnl)}
          </p>
        </div>
      </div>

      {bets.length === 0 ? (
        <div className="card flex flex-col items-center gap-3 px-6 py-12 text-center">
          <p className="text-[17px] font-semibold">No bets yet.</p>
          <p className="text-sm text-ink-muted">
            Pick a game and place a fake bet.
          </p>
          <Link href="/bet" className="btn-primary mt-2">
            Browse games
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {bets.map((b) => {
            const profit =
              b.status === "resolved"
                ? b.result === "win"
                  ? b.potentialPayout
                  : -b.amount
                : 0;
            return (
              <li key={b.id} className="card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs text-ink-muted">
                      {formatDate(b.createdAt)}
                    </p>
                    <p className="mt-1 line-clamp-1 text-[15px] font-semibold">
                      {b.game}
                    </p>
                    <p className="mt-0.5 text-sm text-ink-muted">
                      {describeBetType(b.betType)} · {formatOdds(b.odds)} ·{" "}
                      {formatUSD(b.amount)}
                    </p>
                  </div>
                  <div className="flex-none text-right">
                    {b.status === "open" ? (
                      <SimulateButton id={b.id} />
                    ) : (
                      <>
                        <p
                          className={
                            "text-[15px] font-semibold " +
                            (b.result === "win"
                              ? "text-brand"
                              : "text-red-600")
                          }
                        >
                          {b.result === "win" ? "Win" : "Loss"}
                        </p>
                        <p
                          className={
                            "text-sm " +
                            (profit > 0
                              ? "text-brand"
                              : profit < 0
                                ? "text-red-600"
                                : "text-ink-muted")
                          }
                        >
                          {profit > 0 ? "+" : ""}
                          {formatUSD(profit)}
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function describeBetType(raw: string) {
  const [type, label] = raw.split(":");
  const name =
    type === "moneyline"
      ? "Moneyline"
      : type === "spread"
        ? "Spread"
        : "Over/Under";
  return label ? `${name} · ${label}` : name;
}
