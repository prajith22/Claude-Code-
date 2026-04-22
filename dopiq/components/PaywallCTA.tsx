"use client";

import { useState } from "react";

export function PaywallCTA() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function subscribe() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST" });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        throw new Error(data.error ?? "Couldn't start checkout.");
      }
      window.location.href = data.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setLoading(false);
    }
  }

  return (
    <div className="pt-6">
      {error && (
        <p className="mb-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}
      <button
        type="button"
        onClick={subscribe}
        disabled={loading}
        className="btn-primary w-full"
      >
        {loading ? "Opening Stripe…" : "Subscribe Now"}
      </button>
      <p className="mt-3 text-center text-xs text-ink-muted">
        Secure checkout by Stripe. Cancel anytime from your account.
      </p>
    </div>
  );
}
