"use client";

import Link from "next/link";

// IMPORTANT — App Store Review Guideline 3.1.1 compliance:
//
// Rendered in place of the /signup form when the request is from
// the iOS WebView. The iOS app cannot host a sign-up surface
// because account creation is gated by the web-only Stripe
// purchase flow, and Apple disallows pushing users toward
// off-app purchase from inside an iOS app.
//
// The two paths offered here are:
//   1. Sign in to an existing account (/signin, in-WebView).
//   2. A "learn more on the web" link that opens dopiqapp.com in
//      Safari View Controller. The link is intentionally
//      generic — it opens the marketing site, not /signup or
//      /paywall, so it doesn't read as a purchase hand-off.
//
// MUST NOT contain:
//   - Any prices, plan names, or trial copy
//   - "Sign up" / "Create account" / "Subscribe" / "Get started"
//     CTAs
//   - Any link that goes directly to /signup or /paywall on the
//     web

const LEARN_MORE_URL = "https://dopiqapp.com";

export function IOSSignInOnlyScreen() {
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
        Dopiq accounts are created on the web. If you already have an
        account, sign in below. If you&rsquo;re new to Dopiq, visit
        dopiqapp.com to get started.
      </p>

      {/* Primary CTA — stays inside the WebView. */}
      <Link
        href="/signin"
        className="mt-9 flex h-14 w-full max-w-xs items-center justify-center rounded-pill bg-[#00C853] font-heading text-[15px] font-bold text-white shadow-[0_2px_12px_rgba(0,200,83,0.3)] transition-opacity active:opacity-90"
      >
        Sign in
      </Link>

      {/* Secondary "learn more" link. target="_blank" + the iOS
          shell's onOpenWindow handler routes this to Safari View
          Controller — keeps the user inside the app sheet, never
          deep-links into /signup or /paywall. */}
      <a
        href={LEARN_MORE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-6 font-sans text-[13px] text-ink-muted underline-offset-2 hover:underline"
      >
        Learn more at dopiqapp.com
      </a>
    </main>
  );
}
