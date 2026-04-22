"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function SimulateButton({ id }: { id: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function simulate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/bets/${id}/resolve`, { method: "POST" });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end">
      <button
        type="button"
        onClick={simulate}
        disabled={loading}
        className="rounded-full border border-surface-border bg-white px-3 py-1.5 text-xs font-semibold text-ink hover:bg-surface-alt disabled:opacity-50"
      >
        {loading ? "Simulating…" : "Simulate result"}
      </button>
      {error && <p className="mt-1 text-[11px] text-red-600">{error}</p>}
    </div>
  );
}
