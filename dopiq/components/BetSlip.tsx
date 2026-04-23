"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
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

type PlacedBet = {
  label: string;
  odds: number;
  stake: number;
};

export function BetSlip({ game }: { game: Game }) {
  const router = useRouter();
  const [selection, setSelection] = useState<Selection | null>(null);
  const [amount, setAmount] = useState<string>("10");
  const [placed, setPlaced] = useState<PlacedBet | null>(null);

  const stake = Number.parseFloat(amount || "0") || 0;
  const potential = selection ? americanOddsToPayout(stake, selection.odds) : 0;
  const totalReturn = stake + potential;
  const canPlace = !!selection && stake > 0 && !placed;

  function place() {
    if (!selection || stake <= 0) return;
    setPlaced({
      label: selection.label,
      odds: selection.odds,
      stake,
    });
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

  if (placed) {
    return (
      <PlacedView
        placed={placed}
        onPlaceAnother={() => router.push("/bet")}
      />
    );
  }

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

      {/* Bet slip card */}
      <div className="card-navy p-5">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-white/40">
          Bet slip
        </p>
        {selection ? (
          <>
            <p className="mt-3 text-[17px] font-bold text-white">
              {selection.label}
            </p>
            <p className="mt-0.5 text-[13px] text-white/60">
              Odds {formatOdds(selection.odds)}
            </p>

            <label
              className="mt-5 block text-[12px] font-semibold uppercase tracking-widest text-white/40"
              htmlFor="stake"
            >
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
                <span className="font-bold text-brand money">
                  {formatUSD(potential)}
                </span>
              </div>
              <div className="flex justify-between text-[15px]">
                <span className="text-white/60">Total return</span>
                <span className="font-bold text-white money">
                  {formatUSD(totalReturn)}
                </span>
              </div>
            </div>

            <button
              type="button"
              disabled={!canPlace}
              onClick={place}
              className="btn-primary mt-5 w-full"
            >
              {`Place bet · ${formatUSD(stake)}`}
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
                  active
                    ? "text-brand"
                    : o.selection.odds > 0
                      ? "text-brand"
                      : "text-navy",
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

function PlacedView({
  placed,
  onPlaceAnother,
}: {
  placed: PlacedBet;
  onPlaceAnother: () => void;
}) {
  useEffect(() => {
    const colors = ["#00C853", "#00E676", "#e6f9ee", "#ffffff"];
    const duration = 1500;
    const end = Date.now() + duration;
    confetti({
      particleCount: 80,
      spread: 90,
      startVelocity: 45,
      origin: { x: 0.5, y: 0.35 },
      colors,
    });
    const frame = () => {
      confetti({
        particleCount: 6,
        angle: 60,
        spread: 80,
        origin: { x: 0, y: 0.6 },
        colors,
      });
      confetti({
        particleCount: 6,
        angle: 120,
        spread: 80,
        origin: { x: 1, y: 0.6 },
        colors,
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }, []);

  return (
    <div className="card-navy p-8 text-center">
      <motion.div
        initial={{ scale: 0.4, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 180, damping: 14 }}
        className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-brand text-navy shadow-lg"
      >
        <motion.svg viewBox="0 0 24 24" className="h-10 w-10" aria-hidden>
          <motion.path
            d="M5 12.5 10 17.5 19 7.5"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.6}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ delay: 0.2, duration: 0.5, ease: "easeOut" }}
          />
        </motion.svg>
      </motion.div>

      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.4 }}
        className="mt-6 text-[40px] font-extrabold leading-none tracking-tight text-white md:text-[48px]"
      >
        Bet Placed!
      </motion.h2>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.4 }}
        className="mx-auto mt-6 max-w-sm space-y-2 border-t border-white/10 pt-5"
      >
        <p className="text-[16px] font-bold text-white">{placed.label}</p>
        <div className="flex items-center justify-center gap-3 text-[13px]">
          <span className="text-white/60">Odds</span>
          <span className="font-bold text-white money">
            {formatOdds(placed.odds)}
          </span>
          <span className="text-white/30">·</span>
          <span className="text-white/60">Stake</span>
          <span className="font-bold text-white money">
            {formatUSD(placed.stake)}
          </span>
        </div>
      </motion.div>

      <p className="mt-5 text-[11px] text-white/40">
        Simulated · No real money at risk
      </p>

      <button
        type="button"
        onClick={onPlaceAnother}
        className="btn-primary mt-6 w-full"
      >
        Place another bet
      </button>
    </div>
  );
}
