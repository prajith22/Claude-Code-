"use client";

import { useMemo } from "react";
import { formatUSD } from "@/lib/utils";
import type { SpendingEntry } from "@/types";

function startOfWeek(d: Date) {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  const day = copy.getDay();
  const diff = (day + 6) % 7;
  copy.setDate(copy.getDate() - diff);
  return copy;
}

export function WeeklySummary({ entries }: { entries: SpendingEntry[] }) {
  const { current, previous } = useMemo(() => {
    const now = new Date();
    const thisWeekStart = startOfWeek(now);
    const lastWeekStart = new Date(thisWeekStart);
    lastWeekStart.setDate(thisWeekStart.getDate() - 7);

    let current = 0;
    let previous = 0;
    for (const e of entries) {
      const t = new Date(e.date).getTime();
      if (t >= thisWeekStart.getTime()) current += e.amount;
      else if (
        t >= lastWeekStart.getTime() &&
        t < thisWeekStart.getTime()
      )
        previous += e.amount;
    }
    return { current, previous };
  }, [entries]);

  const delta = current - previous;
  const pct =
    previous > 0 ? Math.round((delta / previous) * 100) : current > 0 ? 100 : 0;
  const improved = delta <= 0;

  const message = improved
    ? current === 0 && previous === 0
      ? "Nothing logged yet — add one to see the trend."
      : "Nice. You’re pulling back. Keep that energy."
    : "You’re up this week. Small cuts add up — try a no-spend day.";

  return (
    <div className="card p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
        This week
      </p>
      <div className="mt-2 flex items-end justify-between gap-4">
        <p className="text-[32px] font-semibold tracking-tight">
          {formatUSD(current)}
        </p>
        <Arrow improved={improved} pct={pct} />
      </div>
      <p className="mt-1 text-sm text-ink-muted">
        Last week: {formatUSD(previous)}
      </p>
      <p className="mt-3 text-[14px] text-ink">{message}</p>
    </div>
  );
}

function Arrow({ improved, pct }: { improved: boolean; pct: number }) {
  const color = improved ? "text-brand" : "text-red-600";
  const bg = improved ? "bg-brand-light" : "bg-red-50";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${bg} ${color}`}
    >
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" aria-hidden>
        <path
          d={improved ? "M12 5v14M6 13l6 6 6-6" : "M12 19V5M6 11l6-6 6 6"}
          stroke="currentColor"
          strokeWidth={2.4}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {Math.abs(pct)}%
    </span>
  );
}
