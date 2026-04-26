"use client";

import { useMemo } from "react";
import {
  buildSelection,
  useBetSlipStore,
} from "@/lib/bet-slip-store";
import {
  FEATURED_PARLAYS,
  type FeaturedParlay,
  type ParlayWatermark,
} from "@/lib/featured-parlays";
import { getGameById } from "@/lib/odds";
import { cn, combineAmericanOdds, formatOdds } from "@/lib/utils";
import { Flame } from "@/components/icons";

type ResolvedParlay = {
  parlay: FeaturedParlay;
  legs: ReturnType<typeof buildSelection>[];
  combinedOdds: number;
};

export function FeaturedParlays() {
  const addMany = useBetSlipStore((s) => s.addMany);

  const resolved = useMemo<ResolvedParlay[]>(
    () =>
      FEATURED_PARLAYS.map((p) => {
        const legs = p.legs
          .map((l) => {
            const g = getGameById(l.gameId);
            return g ? buildSelection(g, l.type, l.side) : null;
          })
          .filter((x): x is NonNullable<typeof x> => x !== null);
        return {
          parlay: p,
          legs,
          combinedOdds: combineAmericanOdds(legs.map((l) => l.odds)),
        };
      }),
    [],
  );

  function placeParlay(legs: ReturnType<typeof buildSelection>[]) {
    addMany(legs);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  return (
    <section>
      <div className="mb-3 flex items-center gap-2">
        <h2 className="font-heading text-[18px] font-extrabold tracking-tight text-ink">
          Featured parlays
        </h2>
        <span className="flex items-center gap-1 rounded-pill bg-ink px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-widest text-white">
          <Flame size={10} />
          Hot today
        </span>
      </div>

      <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 md:mx-0 md:px-0">
        {resolved.map(({ parlay, legs, combinedOdds }) => (
          <ParlayCard
            key={parlay.id}
            parlay={parlay}
            legs={legs}
            combinedOdds={combinedOdds}
            onPlace={() => placeParlay(legs)}
          />
        ))}
      </div>
    </section>
  );
}

function ParlayCard({
  parlay,
  legs,
  combinedOdds,
  onPlace,
}: {
  parlay: FeaturedParlay;
  legs: ReturnType<typeof buildSelection>[];
  combinedOdds: number;
  onPlace: () => void;
}) {
  return (
    <article
      className={cn(
        "relative flex w-[280px] flex-none snap-start flex-col overflow-hidden rounded-card border border-brand/40 bg-navy p-4 shadow-navy",
      )}
    >
      <SportWatermark kind={parlay.watermark} />

      <div className="relative">
        <h3 className="font-heading text-[17px] font-extrabold leading-tight text-white">
          {parlay.name}
        </h3>
        <p className="mt-0.5 text-[11px] font-medium text-white/60">
          {parlay.subtitle}
        </p>
      </div>

      <ul className="relative mt-3 flex-1 space-y-1 text-[12px] leading-snug text-white/85">
        {legs.slice(0, 4).map((leg, i) => (
          <li key={i} className="flex items-baseline gap-1.5">
            <span aria-hidden className="flex-none text-brand">
              ·
            </span>
            <span className="line-clamp-1">{leg.label}</span>
          </li>
        ))}
      </ul>

      <div className="relative mt-3 flex items-center justify-between border-t border-white/10 pt-2.5">
        <div className="flex items-baseline gap-1.5">
          <span className="font-mono text-[22px] font-extrabold text-brand">
            {formatOdds(combinedOdds)}
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-widest text-white/40">
            odds
          </span>
        </div>
        <span className="flex items-center gap-1 text-[10px] text-white/60">
          <Flame size={10} />
          {parlay.peopleBetting.toLocaleString("en-US")}
        </span>
      </div>

      <button
        type="button"
        onClick={onPlace}
        className="relative mt-3 w-full rounded-pill bg-brand px-3 py-2 text-[13px] font-bold text-navy transition-all duration-150 active:scale-[0.97] hover:bg-brand-dark"
      >
        Place Parlay
      </button>
    </article>
  );
}

function SportWatermark({ kind }: { kind: ParlayWatermark }) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute -right-6 -top-6 h-40 w-40 opacity-[0.10]"
    >
      {kind === "basketball" && <BasketballWatermark />}
      {kind === "football" && <FootballWatermark />}
      {kind === "soccer" && <SoccerWatermark />}
      {kind === "hockey" && <HockeyWatermark />}
    </div>
  );
}

function BasketballWatermark() {
  return (
    <svg
      viewBox="0 0 160 160"
      fill="none"
      className="h-full w-full"
      stroke="#ffffff"
      strokeWidth="3"
    >
      <circle cx="80" cy="80" r="70" />
      <path d="M10 80h140M80 10v140M30 30l100 100M30 130l100-100" />
    </svg>
  );
}

function FootballWatermark() {
  return (
    <svg
      viewBox="0 0 160 160"
      fill="none"
      className="h-full w-full"
      stroke="#ffffff"
      strokeWidth="3"
    >
      <ellipse cx="80" cy="80" rx="66" ry="36" transform="rotate(-35 80 80)" />
      <path d="M62 62l36 36M70 58l20 20M68 98l20 20" />
    </svg>
  );
}

function SoccerWatermark() {
  return (
    <svg
      viewBox="0 0 160 160"
      fill="none"
      className="h-full w-full"
      stroke="#ffffff"
      strokeWidth="3"
    >
      <circle cx="80" cy="80" r="70" />
      <polygon points="80,45 108,65 98,98 62,98 52,65" />
      <path d="M80 45V15M108 65l28-10M98 98l22 22M62 98L40 120M52 65L24 55" />
    </svg>
  );
}

function HockeyWatermark() {
  return (
    <svg
      viewBox="0 0 160 160"
      fill="none"
      className="h-full w-full"
      stroke="#ffffff"
      strokeWidth="3"
    >
      <ellipse cx="80" cy="90" rx="56" ry="18" />
      <ellipse cx="80" cy="72" rx="56" ry="18" />
      <path d="M24 72v18M136 72v18" />
    </svg>
  );
}
