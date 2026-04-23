"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Game } from "@/types";
import { formatOdds } from "@/lib/utils";

type OddsData = { nfl: Game[]; nba: Game[] };

export function BetGamesList() {
  const [data, setData] = useState<OddsData | null>(null);
  const [error, setError] = useState<string | null>(null);

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
        if (!cancelled) setError("Couldn't load live odds. Try again in a moment.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <div className="card p-5 text-center">
        <p className="text-[14px] text-red-700">{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <>
        <SkeletonSection />
        <SkeletonSection />
      </>
    );
  }

  return (
    <>
      <SportSection title="NFL" games={data.nfl} />
      <SportSection title="NBA" games={data.nba} />
    </>
  );
}

function SkeletonSection() {
  return (
    <section>
      <div className="mb-3 flex items-center gap-2">
        <div className="h-5 w-12 animate-pulse rounded bg-surface-alt" />
        <div className="h-2 w-2 rounded-full bg-surface-alt" />
        <div className="h-3 w-8 animate-pulse rounded bg-surface-alt" />
      </div>
      <ul className="space-y-3">
        {[0, 1, 2].map((i) => (
          <li
            key={i}
            className="card h-[132px] animate-pulse bg-surface-alt"
          />
        ))}
      </ul>
    </section>
  );
}

function SportSection({ title, games }: { title: string; games: Game[] }) {
  return (
    <section>
      <div className="mb-3 flex items-center gap-2">
        <h2 className="text-[17px] font-bold tracking-tight">{title}</h2>
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-brand" />
        </span>
        <span className="text-[11px] font-semibold uppercase tracking-wide text-brand">
          Live
        </span>
      </div>
      {games.length === 0 ? (
        <div className="card p-6 text-center">
          <p className="text-[14px] text-ink-muted">
            No {title} games scheduled right now — check back soon.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {games.map((g) => (
            <GameCard key={g.id} game={g} />
          ))}
        </ul>
      )}
    </section>
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
