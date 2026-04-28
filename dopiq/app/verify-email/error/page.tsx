import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Verification link expired — Dopiq",
};

export default function VerifyEmailErrorPage() {
  return (
    <main className="min-h-[100dvh] bg-[#FAFAF8]">
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col items-center justify-center px-5 py-10 text-center">
        <span className="font-heading text-[28px] font-extrabold tracking-tight text-brand">
          dopiq
        </span>

        <div className="mt-8 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-600">
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4M12 16h.01" />
          </svg>
        </div>

        <h1 className="mt-6 font-heading text-[24px] font-bold leading-tight tracking-tight text-[#0A0F1E]">
          Verification link invalid or expired
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-ink-muted">
          This link may have already been used, or your account is more than
          24 hours old. You can sign up again to receive a new link.
        </p>

        <Link
          href="/signup"
          className="mt-7 inline-flex h-12 w-full items-center justify-center rounded-pill bg-[#0A0F1E] px-5 font-heading text-[15px] font-bold text-white"
        >
          Try signing up again
        </Link>

        <p className="mt-5 text-[13px] text-ink-muted">
          Already verified?{" "}
          <Link href="/signin" className="font-semibold text-ink underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
