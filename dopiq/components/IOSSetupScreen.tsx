"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";

// IMPORTANT — App Store Review Guideline 3.1.1 compliance:
//
// This screen is rendered ONLY inside the iOS WebView in place of
// the Stripe paywall. It is a sign-in-only gate for users whose
// session doesn't carry an active subscription — the iOS app must
// not surface ANY purchase, signup, or "go to web to subscribe"
// path. It must not display:
//   - Any prices ($3.99, $6.99, $12.99)
//   - Any plan names presented as purchase options
//   - Any "Subscribe" / "Start trial" / "Get started" CTA
//   - Any "Continue setup on the web" or "Finish setup" copy
//   - Any "Choose a plan" or pricing comparison language
//   - Any payment-related copy at all
//
// The two paths offered here are:
//   1. Sign in to an existing subscription (/signin, in-WebView).
//   2. Sign out, in case the wrong account is signed in.
//
// New users — and reviewers with an active demo account — never
// reach this screen: the /paywall page redirects active-access
// users to /home before this component renders, so reviewers
// (isReviewer = true → computeAccessState "active") and paying
// subscribers go straight to the home tab.
//
// If you find yourself adding any pricing surface or "subscribe
// on the web" CTA here, stop — that's the rejection vector Apple
// flagged. The web /paywall handles purchases for web users only.

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
        Sign in to continue
      </h1>

      <p className="mt-3 max-w-sm font-sans text-[16px] leading-relaxed text-ink-muted">
        This Dopiq account doesn&rsquo;t have access yet. If you&rsquo;ve
        subscribed on the web, sign in below. If not, visit dopiqapp.com to
        learn more about Dopiq.
      </p>

      {/* Primary CTA — stays inside the WebView so the user lands on
          /signin without leaving the app. */}
      <Link
        href="/signin"
        className="mt-9 flex h-14 w-full max-w-xs items-center justify-center rounded-pill bg-[#00C853] font-heading text-[15px] font-bold text-white shadow-[0_2px_12px_rgba(0,200,83,0.3)] transition-opacity active:opacity-90"
      >
        Sign in
      </Link>

      {/* Secondary "wrong account" escape hatch. Lets the user sign
          out so they can try another account on /signin. No purchase
          path; the active subscription has to come from the web. */}
      <button
        type="button"
        onClick={() => signOut({ callbackUrl: "/signin" })}
        className="mt-6 font-sans text-[13px] text-ink-muted underline-offset-2 hover:underline"
      >
        Sign out
      </button>
    </main>
  );
}
