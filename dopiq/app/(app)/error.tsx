"use client";

import { useEffect } from "react";
import Link from "next/link";

/**
 * Error boundary scoped to the authenticated (app)/ route group.
 * Catches any thrown error from a server component or hung Prisma
 * fetch in /home, /shop, /food, /bet, /tickets, /settings, etc.
 * Without this, a Supabase pool exhaustion or transient DB error
 * after the layout flushed (TopNav already painted) would leave
 * the WebView showing the logo briefly and then a permanent
 * white body.
 *
 * Slightly warmer copy than the root error.tsx because the user
 * is signed in here — we reassure them their streak / savings
 * data is safe on the server even though this page didn't render.
 */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[dopiq (app)/error.tsx] digest:", error.digest, error);
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
          Tap below to retry — your streak and savings are still safe.
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
