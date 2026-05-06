"use client";

import { useEffect, useState } from "react";
import type { PlanId } from "@/lib/stripe";

// Last-line defense against an iOS WebView ever reaching a Stripe
// checkout. The page-level isIOSWebView() check in /paywall and
// /finish-setup already redirects iOS callers to a no-pricing
// surface; the native shell intercepts the URL before that even
// renders. This client-side check is the third gate: even if the
// page slipped through and a PaywallPlanCard was rendered on iOS,
// the button below paints disabled with non-purchase copy and the
// onClick early-returns instead of POSTing to /api/stripe/checkout.
//
// We can't call lib/is-ios-webview here — that helper reads the
// request UA via next/headers and only works in server components.
// Mirror the same UA marker check on the client.
const WEBVIEW_UA_MARKER = "DopiqIOSApp";

function detectIOSWebView(): boolean {
  if (typeof navigator === "undefined") return false;
  return navigator.userAgent.includes(WEBVIEW_UA_MARKER);
}

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
  // Resolve the iOS check once on mount to avoid SSR hydration
  // mismatches — server-rendered output stays uniform regardless
  // of the request UA, then the client flips the button into the
  // disabled "Use the app to subscribe" state if the runtime is
  // the iOS WebView.
  const [isIOS, setIsIOS] = useState(false);
  useEffect(() => {
    setIsIOS(detectIOSWebView());
  }, []);

  async function start() {
    // Hard guard — never POST to Stripe checkout from inside the
    // iOS WebView. Apple disallows non-IAP purchase paths in iOS
    // apps; even if every other guard fails, this stops the
    // request before it leaves the device.
    if (detectIOSWebView()) return;
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
        disabled={loading || isIOS}
        className={`${buttonClass} w-full`}
        aria-disabled={isIOS || loading}
      >
        {isIOS
          ? "Use the app to subscribe"
          : loading
            ? "Opening Stripe…"
            : label}
      </button>
      {error && (
        <p className="mt-2 text-center text-[11px] text-red-700">{error}</p>
      )}
    </div>
  );
}
