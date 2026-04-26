"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { SlipSelection } from "@/lib/bet-slip-store";
import { cn, formatOdds, formatUSD } from "@/lib/utils";

type LegOutcome = { key: string; result: "won" | "lost" };
type Resolution = { status: "won" | "lost" | "push"; legs: LegOutcome[] };

type Ticket = {
  id: string;
  selections: SlipSelection[];
  stake: number;
  combinedOdds: number;
  potentialReturn: number;
  status: "pending" | "won" | "lost" | "push";
  placedAt: string;
  resolveAt: string;
  resolvedAt: string | null;
  resolution: Resolution | null;
};

type TicketsResponse = { tickets: Ticket[] };

function formatTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function statusPill(status: Ticket["status"]) {
  switch (status) {
    case "won":
      return { label: "Won", cls: "bg-brand text-white" };
    case "lost":
      return { label: "Lost", cls: "bg-red-100 text-red-700" };
    case "push":
      return { label: "Push", cls: "bg-surface-alt text-ink" };
    default:
      return { label: "Pending", cls: "bg-amber-100 text-amber-800" };
  }
}

export default function BetTicketsPage() {
  const [data, setData] = useState<TicketsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/bets/me")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d: TicketsResponse) => {
        if (!cancelled) setData(d);
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Couldn't load tickets.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const summary = computeSummary(data?.tickets ?? []);

  return (
    <div className="space-y-6 pb-6 pt-2">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-[26px] font-bold tracking-tight">My tickets</h1>
          <p className="mt-0.5 text-sm text-ink-muted">
            Every bet, with the outcome it would&rsquo;ve had.
          </p>
        </div>
        <Link
          href="/bet"
          className="flex-none rounded-pill border border-surface-border bg-white px-3 py-1.5 text-[12px] font-bold text-ink shadow-sm transition hover:bg-surface-alt"
        >
          ← Back to Bet
        </Link>
      </header>

      {/* Lifetime P&L */}
      {summary.resolved > 0 && (
        <section className="card-navy p-5">
          <p className="text-[11px] font-bold uppercase tracking-widest text-white/50">
            Lifetime simulated P&amp;L
          </p>
          <div className="mt-2 flex flex-wrap items-baseline gap-x-6 gap-y-2">
            <div>
              <p
                className={cn(
                  "money text-[36px] leading-none",
                  summary.netCents >= 0 ? "text-brand" : "text-red-400",
                )}
              >
                {summary.netCents >= 0 ? "+" : "−"}
                {formatUSD(Math.abs(summary.netCents) / 100)}
              </p>
              <p className="mt-1 text-[12px] text-white/60">
                {summary.netCents >= 0
                  ? "you'd be up — if this were real money"
                  : "you'd be down — if this were real money"}
              </p>
            </div>
            <div className="space-y-0.5 text-[13px] text-white/80">
              <p>
                <span className="font-bold text-white">{summary.wins}</span>{" "}
                won ·{" "}
                <span className="font-bold text-white">{summary.losses}</span>{" "}
                lost
              </p>
              <p className="text-white/50">
                {summary.resolved} ticket{summary.resolved === 1 ? "" : "s"}{" "}
                resolved
              </p>
            </div>
          </div>
        </section>
      )}

      {error && (
        <div className="card border border-red-200 bg-red-50 p-4 text-[14px] font-medium text-red-700">
          {error}
        </div>
      )}

      {data === null && !error && <LoadingSkeleton />}

      {data && data.tickets.length === 0 && (
        <div className="card flex flex-col items-center gap-3 px-6 py-14 text-center">
          <span className="text-5xl" aria-hidden>
            🎟️
          </span>
          <p className="text-[17px] font-bold">No tickets yet.</p>
          <p className="text-sm text-ink-muted">
            Place a simulated bet to see how it would play out.
          </p>
          <Link href="/bet" className="btn-primary mt-2">
            Browse games
          </Link>
        </div>
      )}

      {data && data.tickets.length > 0 && (
        <ul className="space-y-3">
          {data.tickets.map((t) => (
            <li key={t.id}>
              <TicketCard ticket={t} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function TicketCard({ ticket }: { ticket: Ticket }) {
  const pill = statusPill(ticket.status);
  const isParlay = ticket.selections.length >= 2;
  const pending = ticket.status === "pending";
  const won = ticket.status === "won";
  const resolutionByKey = new Map(
    ticket.resolution?.legs.map((l) => [l.key, l.result]) ?? [],
  );

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={cn(
        "card overflow-hidden",
        won && "border-brand shadow-cardHover",
      )}
    >
      <header className="flex items-center justify-between gap-3 border-b border-surface-border bg-surface-alt px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "rounded-pill px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest",
              pill.cls,
            )}
          >
            {pill.label}
          </span>
          {isParlay && (
            <span className="text-[11px] font-bold uppercase tracking-widest text-ink-muted">
              Parlay · {ticket.selections.length} legs
            </span>
          )}
        </div>
        <span className="font-mono text-[13px] font-bold text-ink">
          {formatOdds(ticket.combinedOdds)}
        </span>
      </header>

      <div className="px-4 py-3">
        <ul className="space-y-1.5">
          {ticket.selections.map((s) => {
            const result = resolutionByKey.get(s.key);
            return (
              <li
                key={s.key}
                className="flex items-start justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-bold text-ink">
                    {s.label}
                  </p>
                  <p className="mt-0.5 text-[11px] text-ink-muted">
                    {s.sport} · {s.matchup}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="font-mono text-[12px] font-bold text-ink">
                    {formatOdds(s.odds)}
                  </span>
                  {result && (
                    <span
                      className={cn(
                        "flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold",
                        result === "won"
                          ? "bg-brand text-white"
                          : "bg-red-100 text-red-700",
                      )}
                      aria-label={result === "won" ? "Won" : "Lost"}
                    >
                      {result === "won" ? "✓" : "✗"}
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-surface-border bg-white px-4 py-3 text-[13px]">
        <div className="flex items-baseline gap-3">
          <span className="text-ink-muted">Stake</span>
          <span className="font-mono font-bold text-ink">
            {formatUSD(ticket.stake)}
          </span>
        </div>
        {pending ? (
          <span className="text-[12px] text-amber-700">
            Resolves {formatTime(ticket.resolveAt)}
          </span>
        ) : won ? (
          <span className="font-mono font-bold text-brand">
            +{formatUSD(ticket.potentialReturn - ticket.stake)} would&rsquo;ve been yours
          </span>
        ) : ticket.status === "lost" ? (
          <span className="font-mono font-bold text-red-700">
            −{formatUSD(ticket.stake)} dodged
          </span>
        ) : (
          <span className="font-mono text-ink-muted">Push</span>
        )}
      </div>
    </motion.article>
  );
}

function LoadingSkeleton() {
  return (
    <ul className="space-y-3">
      {[0, 1, 2].map((i) => (
        <li
          key={i}
          className="card h-[140px] animate-pulse bg-surface-alt"
        />
      ))}
    </ul>
  );
}

function computeSummary(tickets: Ticket[]) {
  let wins = 0;
  let losses = 0;
  let resolved = 0;
  let netCents = 0;
  for (const t of tickets) {
    if (t.status === "pending") continue;
    resolved += 1;
    if (t.status === "won") {
      wins += 1;
      netCents += Math.round((t.potentialReturn - t.stake) * 100);
    } else if (t.status === "lost") {
      losses += 1;
      netCents -= Math.round(t.stake * 100);
    }
    // push = no change
  }
  return { wins, losses, resolved, netCents };
}
