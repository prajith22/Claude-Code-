"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";

const CATEGORIES = ["Shopping", "Food", "Gambling", "Other"] as const;

export function SpendingLogger() {
  const router = useRouter();
  const today = new Date().toISOString().slice(0, 10);
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>(
    "Shopping",
  );
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
    <form onSubmit={submit} className="card space-y-4 p-4">
      <h2 className="text-[17px] font-semibold">Log an expense</h2>

      <div>
        <label htmlFor="amount" className="text-sm font-medium">
          Amount
        </label>
        <div className="mt-1 flex items-center gap-2">
          <span className="text-ink-muted">$</span>
          <input
            id="amount"
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="input"
            required
          />
        </div>
      </div>

      <div>
        <p className="text-sm font-medium">Category</p>
        <div className="mt-2 grid grid-cols-4 gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className={cn(
                "rounded-xl border px-2 py-2 text-xs font-semibold transition",
                category === c
                  ? "border-brand bg-brand-light text-brand"
                  : "border-surface-border bg-white text-ink hover:bg-surface-alt",
              )}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="date" className="text-sm font-medium">
          Date
        </label>
        <input
          id="date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="input mt-1"
          required
        />
      </div>

      <div>
        <label htmlFor="note" className="text-sm font-medium">
          Note <span className="text-ink-muted">(optional)</span>
        </label>
        <input
          id="note"
          type="text"
          placeholder="Coffee after class"
          value={note}
          maxLength={280}
          onChange={(e) => setNote(e.target.value)}
          className="input mt-1"
        />
      </div>

      {error && (
        <p className="rounded-xl bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="btn-primary w-full"
      >
        {submitting ? "Saving…" : "Log expense"}
      </button>
    </form>
  );
}
