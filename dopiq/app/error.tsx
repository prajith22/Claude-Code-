"use client";

import { useEffect } from "react";
import Link from "next/link";

/**
 * Root error boundary. Catches any thrown error from a server
 * component during render or any unhandled client error that
 * bubbles up past more-specific error.tsx files (e.g.
 * app/(app)/error.tsx). Without this file, streaming SSR errors
 * after a layout has already flushed leave the WebView in a
 * half-rendered state — the iOS shell saw the dopiq logo flash
 * from the layout, then the page body never finished and the
 * screen went white.
 *
 * Stays a single component because the marketing surface (/signin,
 * /paywall, /verify-email, /) doesn't have a logged-in user yet,
 * so we don't need to reassure them about streaks / savings the
 * way the (app)/error.tsx variant does.
 */
export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the digest so device logs / Safari Web Inspector / Vercel
    // logs can be cross-referenced. Never surface the raw error or
    // stack to the user.
    console.error("[dopiq error.tsx] digest:", error.digest, error);
  }, [error]);

  return (
    <main
      className="flex min-h-[100dvh] items-center justify-center px-6 safe-top safe-bottom"
      style={{ backgroundColor: "#F5F0E6" }}
    >
      <div className="w-full max-w-sm text-center">
        <DopiqMark />
        <h1 className="mt-6 font-heading text-[26px] font-extrabold leading-tight tracking-tight text-ink">
          Something went sideways.
        </h1>
        <p className="mt-2 text-[14px] leading-relaxed text-ink-muted">
          Give it another shot — we&rsquo;ll be right here.
        </p>
        <button
          type="button"
          onClick={reset}
          className="btn-primary mt-6 w-full"
        >
          Try again
        </button>
        <Link
          href="/home"
          className="mt-3 inline-block text-[13px] font-semibold text-ink-muted underline-offset-4 hover:text-ink hover:underline"
        >
          Go home
        </Link>
      </div>
    </main>
  );
}

function DopiqMark() {
  return (
    <svg
      width="56"
      height="56"
      viewBox="0 0 44 44"
      fill="none"
      aria-hidden
      className="mx-auto"
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
  );
}
