"use client";

import { useState } from "react";

export function UpdatePaymentButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function open() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) throw new Error(data.error ?? "Failed to open portal.");
      window.location.href = data.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setLoading(false);
    }
  }

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={open}
        disabled={loading}
        className="btn-primary"
      >
        {loading ? "Opening portal…" : "Update payment method"}
      </button>
      {error && (
        <p className="mt-2 text-[12px] text-red-700">{error}</p>
      )}
    </div>
  );
}
