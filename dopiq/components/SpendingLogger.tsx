"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";

const CATEGORIES = ["Shopping", "Food", "Gambling", "Other"] as const;

const CATEGORY_EMOJIS: Record<string, string> = {
  Shopping: "🛍️",
  Food: "🍴",
  Gambling: "🎲",
  Other: "•",
};

export function SpendingLogger() {
  const router = useRouter();
  const today = new Date().toISOString().slice(0, 10);
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("Shopping");
  const [date, setDate] = useState(today);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const n = Number.parseFloat(amount);
    if (!Number.isFinite(n) || n <= 0) {
      setError("Enter an amount greater than zero.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/spending", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ amount: n, category, date, note }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed");
      setAmount("");
      setNote("");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="card space-y-5 p-5">
      <h2 className="text-[17px] font-bold tracking-tight">Log an expense</h2>

      {/* Amount */}
      <div>
        <label htmlFor="amount" className="text-[13px] font-semibold uppercase tracking-wide text-ink-muted">
          Amount
        </label>
        <div className="mt-2 flex items-center gap-2">
          <span className="text-[20px] font-semibold text-ink-muted">$</span>
          <input
            id="amount"
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="input text-[20px] font-bold"
            required
          />
        </div>
      </div>

      {/* Category */}
      <div>
        <p className="text-[13px] font-semibold uppercase tracking-wide text-ink-muted">
          Category
        </p>
        <div className="mt-2 grid grid-cols-4 gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className={cn(
                "flex flex-col items-center gap-1 rounded-2xl border px-2 py-3 text-[11px] font-bold uppercase tracking-wide transition-all duration-150",
                category === c
                  ? "border-brand bg-brand-light text-brand shadow-sm"
                  : "border-surface-border bg-white text-ink-muted hover:bg-surface-alt",
              )}
            >
              <span className="text-xl">{CATEGORY_EMOJIS[c]}</span>
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Date */}
      <div>
        <label htmlFor="date" className="text-[13px] font-semibold uppercase tracking-wide text-ink-muted">
          Date
        </label>
        <input
          id="date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="input mt-2"
          required
        />
      </div>

      {/* Note */}
      <div>
        <label htmlFor="note" className="text-[13px] font-semibold uppercase tracking-wide text-ink-muted">
          Note{" "}
          <span className="normal-case text-ink-muted font-normal">(optional)</span>
        </label>
        <input
          id="note"
          type="text"
          placeholder="Coffee after class"
          value={note}
          maxLength={280}
          onChange={(e) => setNote(e.target.value)}
          className="input mt-2"
        />
      </div>

      {error && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="btn-primary w-full text-[16px]"
      >
        {submitting ? "Saving…" : "Log expense"}
      </button>
    </form>
  );
}
