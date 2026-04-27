"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import {
  PREDICTION_MARKETS,
  CATEGORY_STYLES,
  type PredictionMarket,
} from "@/data/prediction-markets";
import {
  buildPredictionSelection,
  slipKey,
  useBetSlipStore,
} from "@/lib/bet-slip-store";
import { cn, formatOdds } from "@/lib/utils";
import { Flame } from "@/components/icons";

export function PredictionMarketsList() {
  return (
    <section>
      <header>
        <h2 className="font-heading text-[20px] font-extrabold tracking-tight text-ink">
          🔮 Prediction Markets
        </h2>
        <p className="mt-0.5 text-[13px] text-ink-muted">
          Bet on anything. Fake money only.
        </p>
      </header>

      <ul className="mt-4 space-y-3">
        {PREDICTION_MARKETS.map((market, i) => (
          <li key={market.id}>
            <PredictionCard market={market} index={i} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function PredictionCardImpl({
  market,
  index,
}: {
  market: PredictionMarket;
  index: number;
}) {
  const toggle = useBetSlipStore((s) => s.toggle);
  // Subscribe to per-card booleans so a change to selections only
  // re-renders the cards whose state actually flipped (instead of all
  // 15 every time something is added or removed from the slip).
  const yesActive = useBetSlipStore((s) =>
    s.selections.some(
      (sel) => sel.key === slipKey(market.id, "prediction", "yes"),
    ),
  );
  const noActive = useBetSlipStore((s) =>
    s.selections.some(
      (sel) => sel.key === slipKey(market.id, "prediction", "no"),
    ),
  );

  function pick(side: "yes" | "no") {
    toggle(buildPredictionSelection(market, side));
  }

  const cat = CATEGORY_STYLES[market.category];

  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.35,
        delay: Math.min(index, 6) * 0.03,
        ease: "easeOut",
      }}
      // Slightly lighter than the brand navy so prediction cards
      // visually peel off from sport game cards (which sit on white).
      className="overflow-hidden rounded-card bg-[#1A2744] p-5 shadow-cardHover"
    >
      <div className="flex items-start justify-between gap-3">
        <span
          className="rounded-pill px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-widest"
          style={{ backgroundColor: cat.bg, color: cat.fg }}
        >
          {market.category}
        </span>
      </div>

      <h3 className="mt-3 font-heading text-[18px] font-extrabold leading-snug text-white">
        {market.question}
      </h3>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <OutcomeButton
          label="Yes"
          odds={market.yesOdds}
          active={yesActive}
          onClick={() => pick("yes")}
        />
        <OutcomeButton
          label="No"
          odds={market.noOdds}
          active={noActive}
          onClick={() => pick("no")}
        />
      </div>

      <div className="mt-4 flex items-center gap-1.5 text-[11px] text-white/55">
        <Flame size={11} />
        {market.peopleBetting.toLocaleString("en-US")} betting
      </div>
    </motion.article>
  );
}

// Memo'd alongside the per-card boolean subscriptions above — together
// they cut a slip change from "re-render all 15 cards" to "re-render
// only the card whose state actually flipped."
const PredictionCard = memo(PredictionCardImpl);

function OutcomeButton({
  label,
  odds,
  active,
  onClick,
}: {
  label: string;
  odds: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1 rounded-xl border-2 px-3 py-3 transition-all duration-150 active:scale-[0.98]",
        active
          ? "border-brand bg-brand-light/20 shadow-[0_0_0_2px_rgba(0,200,83,0.25)]"
          : "border-white/10 bg-white/5 hover:bg-white/10",
      )}
    >
      <span className="text-[13px] font-bold uppercase tracking-widest text-white/70">
        {label}
      </span>
      <span
        className={cn(
          "money text-[18px] leading-none",
          odds > 0 ? "text-brand" : "text-brand-vivid",
        )}
      >
        {formatOdds(odds)}
      </span>
    </button>
  );
}
