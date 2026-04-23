"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Game } from "@/types";
import { cn, formatOdds } from "@/lib/utils";

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

type OddsData = Record<SportKey, Game[]>;

const SPORTS: { key: SportKey; label: string }[] = [
  { key: "nfl", label: "NFL" },
  { key: "nba", label: "NBA" },
  { key: "mlb", label: "MLB" },
  { key: "nhl", label: "NHL" },
  { key: "ncaaf", label: "CFB" },
  { key: "ncaab", label: "CBB" },
  { key: "mls", label: "MLS" },
  { key: "boxing", label: "Boxing" },
  { key: "ufc", label: "UFC" },
  { key: "golf", label: "Golf" },
];

const DEFAULT_SPORT: SportKey = "nfl";

export function BetGamesList() {
  const [data, setData] = useState<OddsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<SportKey>(DEFAULT_SPORT);
  const userPickedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/odds")
      .then((r) => {
        if (!r.ok) throw new Error("Request failed");
        return r.json();
      })
      .then((d: OddsData) => {
        if (!cancelled) setData(d);
      })
      .catch(() => {
        if (!cancelled)
          setError("Couldn't load live odds. Try again in a moment.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Auto-switch default away from NFL if NFL has no games and user
  // hasn't picked a tab yet. Falls back to the first sport with games.
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

  const activeLabel = SPORTS.find((s) => s.key === selected)?.label ?? "";
  const games = data?.[selected] ?? [];

  return (
    <section>
      {/* Sport selector */}
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0">
        {SPORTS.map((s) => (
          <SportTab
            key={s.key}
            label={s.label}
            active={selected === s.key}
            onClick={() => pick(s.key)}
          />
        ))}
      </div>

      {/* Games area */}
      <div className="mt-5">
        {error ? (
          <div className="card p-5 text-center">
            <p className="text-[14px] text-red-700">{error}</p>
          </div>
        ) : !data ? (
          <LoadingSkeleton />
        ) : games.length === 0 ? (
          <EmptyState label={activeLabel} />
        ) : (
          <ul className="space-y-3">
            {games.map((g) => (
              <GameCard key={g.id} game={g} />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function SportTab({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex-none whitespace-nowrap rounded-pill px-4 py-2 text-[13px] font-semibold transition-all duration-150",
        active
          ? "bg-navy text-white shadow-navy"
          : "border border-surface-border bg-white text-ink-muted hover:bg-surface-alt",
      )}
    >
      {label}
    </button>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="card p-8 text-center">
      <p className="text-[14px] text-ink-muted">
        No {label} games scheduled right now — check back soon.
      </p>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <ul className="space-y-3">
      {[0, 1, 2].map((i) => (
        <li key={i} className="card h-[132px] animate-pulse bg-surface-alt" />
      ))}
    </ul>
  );
}

function GameCard({ game: g }: { game: Game }) {
  return (
    <li>
      <Link
        href={`/bet/${encodeURIComponent(g.id)}`}
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
