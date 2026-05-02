"use client";

import { signOut } from "next-auth/react";

// IMPORTANT — App Store Review Guideline 3.1.1 compliance:
//
// This screen is rendered ONLY inside the iOS WebView in place of
// the Stripe paywall. It must not display:
//   - Any prices ($3.99, $6.99, $12.99)
//   - Any plan names presented as purchase options
//   - Any "Subscribe" / "Start trial" CTA
//   - Any "Choose a plan" or pricing comparison language
//   - Any payment-related copy at all
//
// The compliance pattern is "tell users to set up their account on
// the web, with no in-app pricing surface". The web app's existing
// Stripe paywall continues to handle the actual purchase.
//
// If you find yourself adding a price or a Subscribe button here,
// stop — it belongs on /finish-setup or /paywall (web only), never
// inside this component.

const FINISH_SETUP_URL = "https://dopiqapp.com/finish-setup";

export function IOSSetupScreen() {
  return (
    <main className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col items-center justify-center bg-[#FAFAF8] px-6 py-12 text-center safe-top">
      {/* Wordmark */}
      <div className="flex items-center gap-3">
        <svg
          width="44"
          height="44"
          viewBox="0 0 44 44"
          fill="none"
          aria-hidden
        >
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
        Welcome to Dopiq
      </h1>

      <p className="mt-3 max-w-sm font-sans text-[16px] leading-relaxed text-ink-muted">
        Your account is almost ready. Finish setting up your account on the
        web, then come back here and sign in.
      </p>

      {/* Primary CTA — opens dopiqapp.com/finish-setup in mobile Safari.
          The iOS shell's onShouldStartLoadWithRequest interceptor catches
          the URL pattern and routes it through Linking.openURL so it
          never loads inside the WebView. target="_blank" is harmless on
          web; on iOS the interceptor takes precedence. */}
      <a
        href={FINISH_SETUP_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-9 flex h-14 w-full max-w-xs items-center justify-center rounded-pill bg-[#00C853] font-heading text-[15px] font-bold text-white shadow-[0_2px_12px_rgba(0,200,83,0.3)] transition-opacity active:opacity-90"
      >
        Continue setup on the web
      </a>

      {/* Secondary "I already finished" affordance. Sign-out with
          callbackUrl=/signin so the user can sign back in and have
          their freshly-active subscription state pulled into the
          session. */}
      <button
        type="button"
        onClick={() => signOut({ callbackUrl: "/signin" })}
        className="mt-6 font-sans text-[13px] text-ink-muted underline-offset-2 hover:underline"
      >
        Already finished setup? Sign out and sign back in to refresh.
      </button>
    </main>
  );
}
