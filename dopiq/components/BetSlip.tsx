"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Game, PlayerProp } from "@/types";
import { americanOddsToPayout, cn, formatOdds, formatUSD } from "@/lib/utils";

type BetMarket = "moneyline" | "spread" | "over_under";

type GameMarketSelection = {
  kind: "market";
  type: BetMarket;
  side: string;
  label: string;
  odds: number;
};

type PropSelection = {
  kind: "prop";
  marketKey: string;
  playerName: string;
  line: number;
  side: "over" | "under";
  label: string;
  odds: number;
};

type Selection = GameMarketSelection | PropSelection;

type Option = {
  primary: string;
  secondary: string;
  selection: GameMarketSelection;
};

type ResolvedBet = {
  result: "win" | "loss";
  payout: number;
  stakeLost: number;
  label: string;
  newBalance: number;
};

const SPORTS_WITH_PROPS = new Set<Game["sport"]>(["NFL", "NBA", "MLB", "NHL"]);

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
  const [resolved, setResolved] = useState<ResolvedBet | null>(null);
  const [props, setProps] = useState<PlayerProp[] | null>(null);

  const sportSupportsProps = SPORTS_WITH_PROPS.has(game.sport);

  useEffect(() => {
    if (!sportSupportsProps) {
      setProps([]);
      return;
    }
    let cancelled = false;
    const url = `/api/odds/props?gameId=${encodeURIComponent(
      game.id,
    )}&sport=${encodeURIComponent(game.sport)}`;
    fetch(url)
      .then((r) => (r.ok ? r.json() : { props: [] }))
      .then((data: { props?: PlayerProp[] }) => {
        if (!cancelled) setProps(data.props ?? []);
      })
      .catch(() => {
        if (!cancelled) setProps([]);
      });
    return () => {
      cancelled = true;
    };
  }, [game.id, game.sport, sportSupportsProps]);

  const stake = Number.parseFloat(amount || "0") || 0;
  const potential = selection ? americanOddsToPayout(stake, selection.odds) : 0;
  const totalReturn = stake + potential;

  const canPlace =
    !!selection && stake > 0 && stake <= walletBalance && !placing;

  async function place() {
    if (!selection) return;
    setPlacing(true);
    setError(null);
    try {
      const res = await fetch("/api/bet/simulate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          amount: stake,
          odds: selection.odds,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Couldn't place bet.");
      setResolved({
        result: data.result,
        payout: data.payout ?? 0,
        stakeLost: data.stakeLost ?? 0,
        label: selection.label,
        newBalance: data.newBalance ?? walletBalance,
      });
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setPlacing(false);
    }
  }

  function reset() {
    setResolved(null);
    setSelection(null);
    setError(null);
  }

  const moneyline: Option[] = [
    {
      primary: game.awayTeam,
      secondary: formatOdds(game.odds.moneylineAway),
      selection: {
        kind: "market",
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
        kind: "market",
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
        kind: "market",
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
        kind: "market",
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
        kind: "market",
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
        kind: "market",
        type: "over_under",
        side: "under",
        label: `Under ${game.odds.total}`,
        odds: game.odds.underOdds,
      },
    },
  ];

  // Result view replaces the entire slip once the bet has resolved.
  if (resolved) {
    return <ResultView resolved={resolved} onPlayAgain={reset} />;
  }

  const propsLoading = sportSupportsProps && props === null;
  const showPropsSection = sportSupportsProps && (propsLoading || (props && props.length > 0));

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

      {showPropsSection && (
        <PlayerPropsSection
          loading={propsLoading}
          props={props ?? []}
          selection={selection}
          onSelect={setSelection}
        />
      )}

      {/* Bet slip card */}
      <div className="card-navy p-5">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-white/40">
          Bet slip
        </p>
        {selection ? (
          <>
            <p className="mt-3 text-[17px] font-bold text-white">{selection.label}</p>
            <p className="mt-0.5 text-[13px] text-white/60">
              Odds {formatOdds(selection.odds)}
            </p>

            <label className="mt-5 block text-[12px] font-semibold uppercase tracking-widest text-white/40" htmlFor="stake">
              Amount
            </label>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-white/60">$</span>
              <input
                id="stake"
                type="number"
                min={1}
                step="1"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-[16px] font-semibold text-white placeholder:text-white/30 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30 transition-all duration-150"
              />
            </div>
            <div className="mt-3 flex gap-2">
              {[10, 25, 50, 100].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setAmount(String(v))}
                  className="rounded-full border border-white/20 px-3 py-1.5 text-[12px] font-semibold text-white/60 transition hover:border-brand hover:text-brand"
                >
                  ${v}
                </button>
              ))}
            </div>

            <div className="mt-5 space-y-2 border-t border-white/10 pt-4">
              <div className="flex justify-between text-[15px]">
                <span className="text-white/60">To win</span>
                <span className="font-bold text-brand money">{formatUSD(potential)}</span>
              </div>
              <div className="flex justify-between text-[15px]">
                <span className="text-white/60">Total return</span>
                <span className="font-bold text-white money">{formatUSD(totalReturn)}</span>
              </div>
            </div>

            {error && (
              <p className="mt-3 rounded-xl bg-red-900/40 px-4 py-2 text-sm text-red-300">
                {error}
              </p>
            )}
            {stake > walletBalance && (
              <p className="mt-3 rounded-xl bg-red-900/40 px-4 py-2 text-sm text-red-300">
                Not enough fake funds. Balance: {formatUSD(walletBalance)}
              </p>
            )}

            <button
              type="button"
              disabled={!canPlace}
              onClick={place}
              className="btn-primary mt-5 w-full"
            >
              {placing ? "Placing bet…" : `Place bet · ${formatUSD(stake)}`}
            </button>
            <p className="mt-2 text-center text-[11px] text-white/40">
              Simulated · No real money at risk
            </p>
          </>
        ) : (
          <p className="mt-3 text-[14px] text-white/50">
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
      <h3 className="mb-2 text-[12px] font-semibold uppercase tracking-widest text-ink-muted">
        {title}
      </h3>
      <div className="grid grid-cols-2 gap-2">
        {options.map((o) => {
          const active =
            !!selection &&
            selection.kind === "market" &&
            selection.type === o.selection.type &&
            selection.side === o.selection.side;
          return (
            <button
              key={`${o.selection.type}-${o.selection.side}`}
              type="button"
              onClick={() => onSelect(o.selection)}
              className={cn(
                "flex flex-col items-start rounded-2xl border p-3.5 text-left transition-all duration-150",
                active
                  ? "border-brand bg-brand-light shadow-sm"
                  : "border-surface-border bg-white hover:bg-surface-alt hover:shadow-card",
              )}
            >
              <span className="text-[13px] font-medium text-ink-muted line-clamp-1">
                {o.primary}
              </span>
              <span
                className={cn(
                  "mt-1 text-[17px] font-bold money",
                  active ? "text-brand" : o.selection.odds > 0 ? "text-brand" : "text-navy",
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

function PlayerPropsSection({
  loading,
  props,
  selection,
  onSelect,
}: {
  loading: boolean;
  props: PlayerProp[];
  selection: Selection | null;
  onSelect: (s: Selection) => void;
}) {
  return (
    <section>
      <div className="mb-2 flex items-center gap-2">
        <h3 className="text-[12px] font-semibold uppercase tracking-widest text-ink-muted">
          Player Props
        </h3>
        {!loading && props.length > 0 && (
          <span className="rounded-pill bg-brand-light px-2 py-0.5 text-[10px] font-bold text-brand">
            {props.length}
          </span>
        )}
      </div>
      {loading ? (
        <ul className="space-y-2">
          {[0, 1, 2].map((i) => (
            <li key={i} className="card h-[132px] animate-pulse bg-surface-alt" />
          ))}
        </ul>
      ) : (
        <ul className="space-y-2">
          {props.map((p) => (
            <PropCard
              key={`${p.marketKey}-${p.playerName}-${p.line}`}
              prop={p}
              selection={selection}
              onSelect={onSelect}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

function PropCard({
  prop,
  selection,
  onSelect,
}: {
  prop: PlayerProp;
  selection: Selection | null;
  onSelect: (s: Selection) => void;
}) {
  const matches = (side: "over" | "under") =>
    !!selection &&
    selection.kind === "prop" &&
    selection.marketKey === prop.marketKey &&
    selection.playerName === prop.playerName &&
    selection.line === prop.line &&
    selection.side === side;

  const pickSide = (side: "over" | "under"): PropSelection => ({
    kind: "prop",
    marketKey: prop.marketKey,
    playerName: prop.playerName,
    line: prop.line,
    side,
    label: `${prop.playerName} · ${side === "over" ? "Over" : "Under"} ${prop.line} ${prop.marketLabel}`,
    odds: side === "over" ? prop.overOdds : prop.underOdds,
  });

  return (
    <li className="card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-heading text-[16px] font-bold leading-tight text-ink">
            {prop.playerName}
          </p>
          <p className="mt-0.5 text-[12px] font-medium text-ink-muted">
            {prop.marketLabel}
          </p>
        </div>
        <p className="flex-none text-[28px] font-bold leading-none text-navy money">
          {prop.line}
        </p>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <PropSideButton
          label="Over"
          odds={prop.overOdds}
          active={matches("over")}
          onClick={() => onSelect(pickSide("over"))}
        />
        <PropSideButton
          label="Under"
          odds={prop.underOdds}
          active={matches("under")}
          onClick={() => onSelect(pickSide("under"))}
        />
      </div>
    </li>
  );
}

function PropSideButton({
  label,
  odds,
  active,
  onClick,
}: {
  label: "Over" | "Under";
  odds: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center justify-between rounded-2xl border px-3.5 py-3 text-left transition-all duration-150",
        active
          ? "border-brand bg-brand-light shadow-sm"
          : "border-surface-border bg-white hover:bg-surface-alt hover:shadow-card",
      )}
    >
      <span
        className={cn(
          "text-[13px] font-semibold",
          active ? "text-brand" : "text-ink-muted",
        )}
      >
        {label}
      </span>
      <span
        className={cn(
          "text-[15px] font-bold money",
          active ? "text-brand" : odds > 0 ? "text-brand" : "text-navy",
        )}
      >
        {formatOdds(odds)}
      </span>
    </button>
  );
}

function signed(n: number) {
  return n > 0 ? `+${n}` : `${n}`;
}

function ResultView({
  resolved,
  onPlayAgain,
}: {
  resolved: ResolvedBet;
  onPlayAgain: () => void;
}) {
  const won = resolved.result === "win";
  return (
    <div className="card-navy p-6 text-center">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-white/40">
        {won ? "Winner" : "Didn't hit"}
      </p>
      <p
        className={cn(
          "mt-3 text-[46px] font-extrabold tracking-tight money",
          won ? "text-brand" : "text-red-400",
        )}
      >
        {won ? "+" : "−"}
        {formatUSD(won ? resolved.payout : resolved.stakeLost)}
      </p>
      <p className="mt-2 text-[14px] text-white/70">{resolved.label}</p>

      <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4 text-[13px]">
        <span className="text-white/50">New balance</span>
        <span className="font-bold text-white money">
          {formatUSD(resolved.newBalance)}
        </span>
      </div>

      <button
        type="button"
        onClick={onPlayAgain}
        className="btn-primary mt-5 w-full"
      >
        Place another bet
      </button>
      <p className="mt-2 text-[11px] text-white/40">
        Simulated · No real money at risk
      </p>
    </div>
  );
}
