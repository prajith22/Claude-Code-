"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatDate, formatUSD } from "@/lib/utils";
import type { SpendingEntry } from "@/types";

const ICONS: Record<string, string> = {
  Shopping: "🛍️",
  Food: "🍴",
  Gambling: "🎲",
  Other: "•",
};

const PILL_COLORS: Record<string, string> = {
  Shopping: "bg-blue-50 text-blue-700",
  Food: "bg-orange-50 text-orange-700",
  Gambling: "bg-purple-50 text-purple-700",
  Other: "bg-surface-alt text-ink-muted",
};

export function SpendingHistory({ entries }: { entries: SpendingEntry[] }) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function remove(id: string) {
    setDeletingId(id);
    try {
      await fetch(`/api/spending?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      router.refresh();
    } finally {
      setDeletingId(null);
    }
  }

  if (entries.length === 0) {
    return (
      <div className="card flex flex-col items-center gap-2 px-6 py-12 text-center">
        <span className="text-4xl">📋</span>
        <p className="text-[17px] font-bold">No history yet.</p>
        <p className="text-sm text-ink-muted">
          Log your first expense above to start tracking.
        </p>
      </div>
    );
  }

  return (
    <section>
      <h2 className="mb-3 text-[17px] font-bold tracking-tight">History</h2>
      <ul className="space-y-2">
        {entries.map((e) => (
          <li key={e.id} className="card flex items-center gap-3 p-4">
            <span
              aria-hidden
              className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-surface-alt text-xl"
            >
              {ICONS[e.category] ?? "•"}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-[15px] font-bold text-ink">
                  {e.note ?? e.category}
                </p>
                <p className="flex-none text-[16px] font-bold text-navy money">
                  {formatUSD(e.amount)}
                </p>
              </div>
              <div className="mt-1 flex items-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${PILL_COLORS[e.category] ?? PILL_COLORS.Other}`}
                >
                  {e.category}
                </span>
                <span className="text-[11px] text-ink-muted">
                  {formatDate(e.date)}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => remove(e.id)}
              disabled={deletingId === e.id}
              className="flex-none text-xs text-ink-muted transition hover:text-ink disabled:opacity-50"
              aria-label="Delete entry"
            >
              {deletingId === e.id ? "…" : "✕"}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
