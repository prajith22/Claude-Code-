"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Game } from "@/types";
import { cn, formatOdds, signed } from "@/lib/utils";
import { TeamLogo } from "@/components/TeamLogo";
import {
  buildSelection,
  slipKey,
  useBetSlipStore,
  type BetSide,
  type BetType,
} from "@/lib/bet-slip-store";

type SportKey =
  | "nfl"
  | "nba"
  | "mlb"
  | "nhl"
  | "ncaaf"
  | "ncaab"
  | "mls"
  | "boxing"
  | "ufc"
  | "golf";

type SportMeta = {
  rawCount: number;
  kept: number;
  dropped: number;
  source: string;
  error: string | null;
  cacheAgeMin: number | null;
};

type OddsResponse = Record<SportKey, Game[]> & {
  _meta?: {
    apiKeyPresent: boolean;
    sports: Partial<Record<SportKey, SportMeta>>;
    fatalError?: string;
  };
};

const SPORTS: { key: SportKey; label: string; emoji: string }[] = [
  { key: "nfl", label: "NFL", emoji: "🏈" },
  { key: "nba", label: "NBA", emoji: "🏀" },
  { key: "mlb", label: "MLB", emoji: "⚾" },
  { key: "nhl", label: "NHL", emoji: "🏒" },
  { key: "ncaaf", label: "CFB", emoji: "🏈" },
  { key: "ncaab", label: "CBB", emoji: "🏀" },
  { key: "mls", label: "MLS", emoji: "⚽" },
  { key: "boxing", label: "Boxing", emoji: "🥊" },
  { key: "ufc", label: "UFC", emoji: "🥋" },
  { key: "golf", label: "Golf", emoji: "⛳" },
];

const DEFAULT_SPORT: SportKey = "nfl";

export function BetGamesList() {
  const [data, setData] = useState<OddsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<SportKey>(DEFAULT_SPORT);
  const userPickedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/odds")
      .then((r) => {
        if (!r.ok) throw new Error(`Request failed (HTTP ${r.status})`);
        return r.json();
      })
      .then((d: OddsResponse) => {
        if (!cancelled) setData(d);
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          const msg = e instanceof Error ? e.message : String(e);
          setError(msg || "Couldn't load games. Try again in a moment.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!data || userPickedRef.current) return;
    if ((data[DEFAULT_SPORT]?.length ?? 0) > 0) return;
    const firstNonEmpty = SPORTS.find((s) => (data[s.key]?.length ?? 0) > 0);
    if (firstNonEmpty) setSelected(firstNonEmpty.key);
  }, [data]);

  function pick(key: SportKey) {
    userPickedRef.current = true;
    setSelected(key);
  }

  const games = data?.[selected] ?? [];
  const liveGames = games.filter((g) => g.isLive);
  const upcomingGames = games.filter((g) => !g.isLive);
  const activeSport = SPORTS.find((s) => s.key === selected);

  return (
    <section>
      {/* Sport selector */}
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0">
        {SPORTS.map((s) => (
          <SportTab
            key={s.key}
            emoji={s.emoji}
            label={s.label}
            active={selected === s.key}
            onClick={() => pick(s.key)}
          />
        ))}
      </div>

      <div className="mt-5 space-y-6">
        {error ? (
          <ErrorCard message={error} />
        ) : !data ? (
          <LoadingSkeleton />
        ) : games.length === 0 ? (
          <EmptyCard label={activeSport?.label ?? ""} />
        ) : (
          <>
            {liveGames.length > 0 && (
              <section aria-label="Live games">
                <LiveSectionHeader count={liveGames.length} />
                <ul className="space-y-3">
                  {liveGames.map((g) => (
                    <li key={g.id}>
                      <GameCard game={g} />
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {upcomingGames.length > 0 && (
              <section aria-label="Upcoming games">
                {liveGames.length > 0 && (
                  <h3 className="mb-3 text-[12px] font-semibold uppercase tracking-widest text-ink-muted">
                    Upcoming
                  </h3>
                )}
                <ul className="space-y-3">
                  {upcomingGames.map((g) => (
                    <li key={g.id}>
                      <GameCard game={g} />
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </>
        )}
      </div>
    </section>
  );
}

function SportTab({
  emoji,
  label,
  active,
  onClick,
}: {
  emoji: string;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-none items-center gap-1.5 whitespace-nowrap rounded-pill px-4 py-2 text-[13px] font-semibold transition-all duration-150",
        active
          ? "bg-navy text-white shadow-navy"
          : "border border-surface-border bg-white text-ink-muted hover:bg-surface-alt",
      )}
    >
      <span className="text-[14px] leading-none" aria-hidden>
        {emoji}
      </span>
      <span>{label}</span>
    </button>
  );
}

function LiveSectionHeader({ count }: { count: number }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <span className="relative flex h-2.5 w-2.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
      </span>
      <h3 className="text-[12px] font-bold uppercase tracking-widest text-red-600">
        Live now
      </h3>
      <span className="rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-bold text-red-700">
        {count}
      </span>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <ul className="space-y-3">
      {[0, 1, 2].map((i) => (
        <li key={i} className="card h-[140px] animate-pulse bg-surface-alt" />
      ))}
    </ul>
  );
}

function EmptyCard({ label }: { label: string }) {
  return (
    <div className="card p-8 text-center">
      <p className="text-[14px] text-ink-muted">
        No {label} games scheduled right now — check back soon.
      </p>
    </div>
  );
}

function ErrorCard({ message }: { message: string }) {
  return (
    <div className="card p-6 text-center">
      <p className="text-[14px] font-bold text-red-700">{message}</p>
    </div>
  );
}

// --- Game card ---

function GameCard({ game: g }: { game: Game }) {
  const toggle = useBetSlipStore((s) => s.toggle);
  const selectionKeys = useBetSlipStore((s) =>
    s.selections.map((x) => x.key),
  );
  const selectionSet = new Set(selectionKeys);

  function isActive(type: BetType, side: BetSide) {
    return selectionSet.has(slipKey(g.id, type, side));
  }

  function pick(type: BetType, side: BetSide) {
    toggle(buildSelection(g, type, side));
  }

  const trending = g.peopleBetting > 10000;
  const timeLabel = new Date(g.startsAt).toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <article className="card overflow-hidden p-4">
      {/* Live strip (only for live games) */}
      {g.isLive && (
        <div className="-mx-4 -mt-4 mb-3 flex items-center justify-between gap-3 bg-red-50 px-4 py-2">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
            </span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-red-700">
              Live
            </span>
            {g.livePeriod && (
              <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-bold text-red-700">
                {g.livePeriod}
              </span>
            )}
          </div>
          {g.liveScore && (
            <span className="font-mono text-[12px] font-bold text-red-700">
              {g.liveScore}
            </span>
          )}
        </div>
      )}

      <div className="flex items-start gap-4">
        {/* Teams column — full card click target except for the odds cells */}
        <Link
          href={`/bet/${encodeURIComponent(g.id)}`}
          className="group flex min-w-0 flex-1 flex-col gap-2"
        >
          <TeamRow
            color={g.awayTeamColor}
            abbr={g.awayTeamAbbr}
            name={g.awayTeam}
          />
          <span className="pl-2 text-[10px] font-bold uppercase tracking-widest text-ink-muted">
            @
          </span>
          <TeamRow
            color={g.homeTeamColor}
            abbr={g.homeTeamAbbr}
            name={g.homeTeam}
          />
        </Link>

        {/* Odds grid */}
        <div className="flex-none">
          <div className="grid grid-cols-3 gap-1.5">
            <OddsColumnHeader>Spread</OddsColumnHeader>
            <OddsColumnHeader>Total</OddsColumnHeader>
            <OddsColumnHeader>ML</OddsColumnHeader>

            {/* Away row */}
            <OddsCell
              label={signed(g.odds.spreadAway)}
              odds={g.odds.spreadAwayOdds}
              active={isActive("spread", "away")}
              onClick={() => pick("spread", "away")}
            />
            <OddsCell
              label={`O ${g.odds.total}`}
              odds={g.odds.overOdds}
              active={isActive("total", "over")}
              onClick={() => pick("total", "over")}
            />
            <OddsCell
              odds={g.odds.moneylineAway}
              active={isActive("moneyline", "away")}
              onClick={() => pick("moneyline", "away")}
            />

            {/* Home row */}
            <OddsCell
              label={signed(g.odds.spreadHome)}
              odds={g.odds.spreadHomeOdds}
              active={isActive("spread", "home")}
              onClick={() => pick("spread", "home")}
            />
            <OddsCell
              label={`U ${g.odds.total}`}
              odds={g.odds.underOdds}
              active={isActive("total", "under")}
              onClick={() => pick("total", "under")}
            />
            <OddsCell
              odds={g.odds.moneylineHome}
              active={isActive("moneyline", "home")}
              onClick={() => pick("moneyline", "home")}
            />
          </div>
          {g.isLive && (
            <p className="mt-2 text-right text-[10px] font-semibold uppercase tracking-widest text-red-600">
              Live odds
            </p>
          )}
        </div>
      </div>

      {/* Footer: game time + social proof */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-t border-surface-border pt-3">
        <span className="text-[12px] text-ink-muted">
          {g.isLive ? g.livePeriod ?? "In progress" : timeLabel}
        </span>
        <div className="flex items-center gap-2">
          {trending && (
            <span className="rounded-pill bg-brand-light px-2 py-0.5 text-[10px] font-bold text-brand">
              🔥 Trending
            </span>
          )}
          <span className="text-[12px] text-ink-muted">
            🔥 {g.peopleBetting.toLocaleString("en-US")} people placed this bet today
          </span>
        </div>
      </div>
    </article>
  );
}

function TeamRow({
  color,
  abbr,
  name,
}: {
  color: string;
  abbr: string;
  name: string;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <TeamLogo color={color} abbr={abbr} size={32} />
      <span className="truncate text-[15px] font-bold text-ink">{name}</span>
    </div>
  );
}

function OddsColumnHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="pb-0.5 text-center text-[9px] font-bold uppercase tracking-widest text-ink-muted">
      {children}
    </div>
  );
}

function OddsCell({
  label,
  odds,
  active,
  onClick,
}: {
  label?: string;
  odds: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick();
      }}
      className={cn(
        "flex min-w-[62px] flex-col items-center justify-center gap-0.5 rounded-lg border-2 px-2 py-1.5 transition-all duration-150",
        active
          ? "border-brand bg-navy-light shadow-[0_0_0_2px_rgba(0,200,83,0.25)]"
          : "border-transparent bg-navy hover:bg-navy-light",
      )}
    >
      {label && (
        <span className="text-[10px] font-semibold leading-none text-white/70">
          {label}
        </span>
      )}
      <span
        className={cn(
          "text-[13px] font-bold leading-none money",
          odds > 0 ? "text-brand" : "text-white",
        )}
      >
        {formatOdds(odds)}
      </span>
    </button>
  );
}

