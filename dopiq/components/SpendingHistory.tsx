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
      <div className="card flex flex-col items-center gap-2 px-6 py-10 text-center">
        <p className="text-[17px] font-semibold">No history yet.</p>
        <p className="text-sm text-ink-muted">
          Log your first expense above to see trends.
        </p>
      </div>
    );
  }

  return (
    <section>
      <h2 className="mb-3 text-[17px] font-semibold">History</h2>
      <ul className="space-y-2">
        {entries.map((e) => (
          <li key={e.id} className="card flex items-center gap-3 p-3">
            <span
              aria-hidden
              className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-surface-alt text-lg"
            >
              {ICONS[e.category] ?? "•"}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-[15px] font-medium">
                  {e.note ?? e.category}
                </p>
                <p className="text-[15px] font-semibold">
                  {formatUSD(e.amount)}
                </p>
              </div>
              <p className="text-xs text-ink-muted">
                {e.category} · {formatDate(e.date)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => remove(e.id)}
              disabled={deletingId === e.id}
              className="flex-none text-xs text-ink-muted hover:text-ink disabled:opacity-50"
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
