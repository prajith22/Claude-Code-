"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Game } from "@/types";
import { americanOddsToPayout, cn, formatOdds, formatUSD } from "@/lib/utils";

type BetMarket = "moneyline" | "spread" | "over_under";

type Selection = {
  type: BetMarket;
  side: string;
  label: string;
  odds: number;
};

type Option = {
  primary: string;
  secondary: string;
  selection: Selection;
};

export function BetSlip({
  game,
  walletBalance,
}: {
  game: Game;
  walletBalance: number;
}) {
  const router = useRouter();
  const [selection, setSelection] = useState<Selection | null>(null);
  const [amount, setAmount] = useState<string>("10");
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stake = Number.parseFloat(amount || "0") || 0;
  const potential = selection ? americanOddsToPayout(stake, selection.odds) : 0;
  const total = stake + potential;

  const canPlace =
    !!selection && stake > 0 && stake <= walletBalance && !placing;

  async function place() {
    if (!selection) return;
    setPlacing(true);
    setError(null);
    try {
      const res = await fetch("/api/bets", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          gameId: game.id,
          gameLabel: `${game.awayTeam} @ ${game.homeTeam}`,
          betType: selection.type,
          amount: stake,
          odds: selection.odds,
          selectionLabel: selection.label,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Couldn't place bet.");
      router.push("/bet/history");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setPlacing(false);
    }
  }

  const moneyline: Option[] = [
    {
      primary: game.awayTeam,
      secondary: formatOdds(game.odds.moneylineAway),
      selection: {
        type: "moneyline",
        side: "away",
        label: `${game.awayTeam} ML`,
        odds: game.odds.moneylineAway,
      },
    },
    {
      primary: game.homeTeam,
      secondary: formatOdds(game.odds.moneylineHome),
      selection: {
        type: "moneyline",
        side: "home",
        label: `${game.homeTeam} ML`,
        odds: game.odds.moneylineHome,
      },
    },
  ];
  const spread: Option[] = [
    {
      primary: `${game.awayTeam} ${signed(game.odds.spreadAway)}`,
      secondary: formatOdds(game.odds.spreadAwayOdds),
      selection: {
        type: "spread",
        side: "away",
        label: `${game.awayTeam} ${signed(game.odds.spreadAway)}`,
        odds: game.odds.spreadAwayOdds,
      },
    },
    {
      primary: `${game.homeTeam} ${signed(game.odds.spreadHome)}`,
      secondary: formatOdds(game.odds.spreadHomeOdds),
      selection: {
        type: "spread",
        side: "home",
        label: `${game.homeTeam} ${signed(game.odds.spreadHome)}`,
        odds: game.odds.spreadHomeOdds,
      },
    },
  ];
  const totals: Option[] = [
    {
      primary: `Over ${game.odds.total}`,
      secondary: formatOdds(game.odds.overOdds),
      selection: {
        type: "over_under",
        side: "over",
        label: `Over ${game.odds.total}`,
        odds: game.odds.overOdds,
      },
    },
    {
      primary: `Under ${game.odds.total}`,
      secondary: formatOdds(game.odds.underOdds),
      selection: {
        type: "over_under",
        side: "under",
        label: `Under ${game.odds.total}`,
        odds: game.odds.underOdds,
      },
    },
  ];

  return (
    <div className="space-y-5">
      <MarketRow
        title="Moneyline"
        options={moneyline}
        selection={selection}
        onSelect={setSelection}
      />
      <MarketRow
        title="Spread"
        options={spread}
        selection={selection}
        onSelect={setSelection}
      />
      <MarketRow
        title="Over / Under"
        options={totals}
        selection={selection}
        onSelect={setSelection}
      />

      <div className="card p-4">
        <p className="text-[13px] font-semibold uppercase tracking-wide text-ink-muted">
          Bet slip
        </p>
        {selection ? (
          <>
            <p className="mt-2 text-[15px] font-medium">{selection.label}</p>
            <p className="text-sm text-ink-muted">
              Odds {formatOdds(selection.odds)}
            </p>

            <label
              className="mt-4 block text-sm font-medium"
              htmlFor="stake"
            >
              Amount
            </label>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-ink-muted">$</span>
              <input
                id="stake"
                type="number"
                min={1}
                step="1"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="input"
              />
            </div>
            <div className="mt-2 flex gap-2 text-xs">
              {[10, 25, 50, 100].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setAmount(String(v))}
                  className="rounded-full border border-surface-border px-3 py-1 font-medium text-ink-muted hover:text-ink"
                >
                  ${v}
                </button>
              ))}
            </div>

            <div className="mt-4 space-y-1 text-[15px]">
              <div className="flex justify-between">
                <span className="text-ink-muted">To win</span>
                <span className="font-medium">{formatUSD(potential)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-muted">Total return</span>
                <span className="font-semibold">{formatUSD(total)}</span>
              </div>
            </div>

            {error && (
              <p className="mt-3 rounded-xl bg-red-50 px-4 py-2 text-sm text-red-700">
                {error}
              </p>
            )}
            {stake > walletBalance && (
              <p className="mt-3 rounded-xl bg-red-50 px-4 py-2 text-sm text-red-700">
                Not enough fake funds. Balance: {formatUSD(walletBalance)}
              </p>
            )}

            <button
              type="button"
              disabled={!canPlace}
              onClick={place}
              className="btn-primary mt-4 w-full"
            >
              {placing
                ? "Placing bet…"
                : `Place bet · ${formatUSD(stake)}`}
            </button>
            <p className="mt-2 text-center text-xs text-ink-muted">
              Simulated. No real money is at risk.
            </p>
          </>
        ) : (
          <p className="mt-2 text-sm text-ink-muted">
            Pick a market above to build your bet.
          </p>
        )}
      </div>
    </div>
  );
}

function MarketRow({
  title,
  options,
  selection,
  onSelect,
}: {
  title: string;
  options: Option[];
  selection: Selection | null;
  onSelect: (s: Selection) => void;
}) {
  return (
    <section>
      <h3 className="mb-2 text-[13px] font-semibold uppercase tracking-wide text-ink-muted">
        {title}
      </h3>
      <div className="grid grid-cols-2 gap-2">
        {options.map((o) => {
          const active =
            !!selection &&
            selection.type === o.selection.type &&
            selection.side === o.selection.side;
          return (
            <button
              key={`${o.selection.type}-${o.selection.side}`}
              type="button"
              onClick={() => onSelect(o.selection)}
              className={cn(
                "flex flex-col items-start rounded-2xl border p-3 text-left transition",
                active
                  ? "border-brand bg-brand-light"
                  : "border-surface-border bg-white hover:bg-surface-alt",
              )}
            >
              <span className="text-[14px] font-medium text-ink">
                {o.primary}
              </span>
              <span
                className={cn(
                  "mt-1 text-[14px] font-semibold",
                  active ? "text-brand" : "text-ink",
                )}
              >
                {o.secondary}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function signed(n: number) {
  return n > 0 ? `+${n}` : `${n}`;
}
