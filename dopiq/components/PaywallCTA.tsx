"use client";

import { useState } from "react";
import type { PlanId } from "@/lib/stripe";

export function PlanCheckoutButton({
  plan,
  label,
  variant = "primary",
}: {
  plan: PlanId;
  label: string;
  variant?: "primary" | "navy" | "secondary";
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      // Anonymous viewers can browse the paywall — when they click a plan
      // we bounce them through sign-in and back to /paywall to retry.
      if (res.status === 401) {
        window.location.href = "/signin?callbackUrl=/paywall";
        return;
      }
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) throw new Error(data.error ?? "Checkout failed.");
      window.location.href = data.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setLoading(false);
    }
  }

  const buttonClass =
    variant === "navy"
      ? "btn-navy"
      : variant === "secondary"
      ? "btn-secondary"
      : "btn-primary";

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={start}
        disabled={loading}
        className={`${buttonClass} w-full`}
      >
        {loading ? "Opening Stripe…" : label}
      </button>
      {error && (
        <p className="mt-2 text-center text-[11px] text-red-700">{error}</p>
      )}
    </div>
  );
}
