"use client";

// Rendered ONLY by app/paywall/page.tsx and app/finish-setup/page.tsx
// when the request comes from the Dopiq iOS WebView (isIOSWebView()
// returns true). This is a fallback — under normal operation the
// iOS shell intercepts /paywall and /finish-setup URL navigations
// in dopiq-ios/App.tsx and presents the native StoreKit paywall
// before this page ever paints. If the interceptor misses (e.g.,
// some redirect path that bypasses onShouldStartLoadWithRequest),
// THIS screen is what the user sees — and crucially:
//
//   - NO PaywallPlanCard
//   - NO Stripe checkout button
//   - NO pricing display
//   - NO "Start Free Trial" / "Subscribe" CTAs
//   - NO target="_blank" link to a paid surface
//
// Apple's reviewer is the audience here. They check whether iOS
// builds expose any non-IAP purchase path; this screen contains
// none. The two affordances are:
//
//   1. A "Reload" button that calls window.location.reload(). The
//      reload often re-fires the iOS interceptor and lands the user
//      on the native paywall.
//   2. A useEffect on mount that postMessages the iOS shell asking
//      it to show the native paywall. The shell already has a
//      JSON-envelope onMessage protocol; the shell can choose to
//      handle this as a follow-up if needed. Present-day shells
//      ignore unknown types per the protocol, so this is forward-
//      safe.
import { useEffect } from "react";

export function IOSPaywallFallback() {
  useEffect(() => {
    // Nudge the native shell — if it has handler logic for this
    // type it'll show the StoreKit paywall; if not, this is a
    // no-op (the shell drops unknown postMessage types).
    type RNWebView = { postMessage: (msg: string) => void };
    const w = (typeof window !== "undefined" ? window : undefined) as
      | (Window & { ReactNativeWebView?: RNWebView })
      | undefined;
    w?.ReactNativeWebView?.postMessage(
      JSON.stringify({ type: "show_paywall" }),
    );
  }, []);

  function reload() {
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  }

  return (
    <main className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col items-center justify-center bg-[#FAFAF8] px-6 py-12 text-center safe-top">
      <div className="flex items-center gap-3">
        <svg width="44" height="44" viewBox="0 0 44 44" fill="none" aria-hidden>
          <rect width="44" height="44" rx="10" fill="#00C853" />
          <path
            d="M10 10 L10 34 L18 34 Q30 34 30 22 Q30 10 18 10 Z"
            fill="white"
          />
          <line
            x1="10"
            y1="22"
            x2="27"
            y2="22"
            stroke="#00C853"
            strokeWidth="2.5"
          />
        </svg>
        <span className="font-heading text-[28px] font-extrabold leading-none text-[#0A0F1E]">
          dopiq
        </span>
      </div>

      <h1 className="mt-10 font-heading text-[28px] font-bold leading-tight tracking-tight text-[#0A0F1E] md:text-[32px]">
        Returning to Dopiq…
      </h1>
      <p className="mt-3 max-w-sm font-sans text-[16px] leading-relaxed text-ink-muted">
        If you&rsquo;re seeing this screen, please return to the Dopiq app to
        choose your plan.
      </p>

      <button
        type="button"
        onClick={reload}
        className="mt-9 flex h-14 w-full max-w-xs items-center justify-center rounded-pill bg-[#00C853] font-heading text-[15px] font-bold text-white shadow-[0_2px_12px_rgba(0,200,83,0.3)] transition-opacity active:opacity-90"
      >
        Reload
      </button>
    </main>
  );
}
