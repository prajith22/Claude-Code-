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
  const [data, setData] = useState<OddsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<SportKey>(DEFAULT_SPORT);
  const [refreshing, setRefreshing] = useState(false);
  const userPickedRef = useRef(false);

  function load(forceSport?: SportKey) {
    const url = forceSport ? `/api/odds?refresh=${forceSport}` : "/api/odds";
    if (forceSport) setRefreshing(true);
    let cancelled = false;
    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error(`Request failed (HTTP ${r.status})`);
        return r.json();
      })
      .then((d: OddsResponse) => {
        if (cancelled) return;
        setData(d);
        setError(null);
        setRefreshing(false);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        const msg = e instanceof Error ? e.message : String(e);
        setError(msg || "Couldn't load live odds. Try again in a moment.");
        setRefreshing(false);
      });
    return () => {
      cancelled = true;
    };
  }

  useEffect(() => {
    const cancel = load();
    return cancel;
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
  const meta = data?._meta;
  const sportMeta = meta?.sports[selected];
  const totalGames = data
    ? SPORTS.reduce((n, s) => n + (data[s.key]?.length ?? 0), 0)
    : 0;
  const noGamesAnywhere = data !== null && totalGames === 0;

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

      {/* Server-side warnings (API key missing, fatal error) */}
      {data && meta && !meta.apiKeyPresent && (
        <DiagnosticBanner
          title="Live odds disabled"
          detail="ODDS_API_KEY is not set on the server. Add it to .env.local (and redeploy), then hit retry."
          onRetry={() => load(selected)}
          retrying={refreshing}
        />
      )}
      {data && meta?.fatalError && (
        <DiagnosticBanner
          title="Odds pipeline crashed"
          detail={meta.fatalError}
          onRetry={() => load(selected)}
          retrying={refreshing}
        />
      )}

      {/* Games area */}
      <div className="mt-5">
        {error ? (
          <ErrorState message={error} onRetry={() => load(selected)} retrying={refreshing} />
        ) : !data ? (
          <LoadingSkeleton />
        ) : noGamesAnywhere && !sportMeta?.error ? (
          <div className="card p-8 text-center">
            <p className="text-[14px] text-ink-muted">
              No games available right now — check back soon.
            </p>
          </div>
        ) : games.length === 0 ? (
          <EmptySportState
            label={activeLabel}
            meta={sportMeta}
            onRetry={() => load(selected)}
            retrying={refreshing}
          />
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

function EmptySportState({
  label,
  meta,
  onRetry,
  retrying,
}: {
  label: string;
  meta?: SportMeta;
  onRetry: () => void;
  retrying: boolean;
}) {
  // Build a specific message based on what meta tells us.
  let title = `No ${label} games scheduled right now`;
  let detail: string | null = "Check back soon.";
  if (meta?.error) {
    title = `${label} odds unavailable`;
    detail = meta.error;
  } else if (meta && meta.rawCount > 0 && meta.kept === 0) {
    title = `${label} games returned but dropped by the transformer`;
    detail = `Upstream sent ${meta.rawCount} games; all ${meta.dropped} failed the h2h + spreads + totals requirement.`;
  } else if (meta?.source === "cache-stale-fallback") {
    title = `${label} odds are stale`;
    detail = `Using cached data (${meta.cacheAgeMin ?? "?"}m old) — upstream fetch failed.`;
  } else if (meta?.source === "cache-fresh" && meta.rawCount === 0) {
    title = `No ${label} games cached`;
    detail = `Last upstream fetch was ${meta.cacheAgeMin ?? "?"}m ago and returned 0 games. Try a forced refresh.`;
  }

  return (
    <div className="card p-6 text-center">
      <p className="text-[15px] font-bold text-ink">{title}</p>
      {detail && (
        <p className="mt-1 text-[13px] text-ink-muted">{detail}</p>
      )}
      {meta && (
        <p className="mt-3 font-mono text-[11px] text-ink-muted">
          source={meta.source} · raw={meta.rawCount} · kept={meta.kept} · dropped={meta.dropped}
          {meta.cacheAgeMin != null ? ` · cache=${meta.cacheAgeMin}m` : ""}
        </p>
      )}
      <button
        type="button"
        onClick={onRetry}
        disabled={retrying}
        className="btn-secondary mt-4"
      >
        {retrying ? "Refreshing…" : "Force refresh"}
      </button>
    </div>
  );
}

function ErrorState({
  message,
  onRetry,
  retrying,
}: {
  message: string;
  onRetry: () => void;
  retrying: boolean;
}) {
  return (
    <div className="card p-6 text-center">
      <p className="text-[14px] font-bold text-red-700">{message}</p>
      <p className="mt-1 text-[12px] text-ink-muted">
        Live odds come from The Odds API. A network hiccup or a missing
        ODDS_API_KEY will show this.
      </p>
      <button
        type="button"
        onClick={onRetry}
        disabled={retrying}
        className="btn-secondary mt-4"
      >
        {retrying ? "Retrying…" : "Retry"}
      </button>
    </div>
  );
}

function DiagnosticBanner({
  title,
  detail,
  onRetry,
  retrying,
}: {
  title: string;
  detail: string;
  onRetry: () => void;
  retrying: boolean;
}) {
  return (
    <div className="mt-4 rounded-card border border-red-200 bg-red-50 p-4">
      <p className="text-[13px] font-bold text-red-700">{title}</p>
      <p className="mt-1 text-[12px] text-red-700/80">{detail}</p>
      <button
        type="button"
        onClick={onRetry}
        disabled={retrying}
        className="mt-3 rounded-pill border border-red-300 bg-white px-3 py-1 text-[12px] font-semibold text-red-700 hover:bg-red-100 disabled:opacity-60"
      >
        {retrying ? "Retrying…" : "Retry"}
      </button>
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
