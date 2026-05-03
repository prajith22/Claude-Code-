import Link from "next/link";
import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Support — Dopiq",
  description:
    "Get help with Dopiq. Contact us, find answers to common questions, and learn how to manage your subscription.",
};

const SUPPORT_EMAIL = "narendranprajith@gmail.com";

type Faq = { question: string; answer: ReactNode };

const FAQS: Faq[] = [
  {
    question: "How do I cancel my Dopiq subscription?",
    answer: (
      <>
        Open the Dopiq app or visit dopiqapp.com, sign in, and go to Settings.
        From there you can cancel your subscription, which will remain active
        until the end of your current billing period. You will not be charged
        again after cancellation.
      </>
    ),
  },
  {
    question: "How do I request a refund?",
    answer: (
      <>
        Refund requests are handled on a case-by-case basis. Email us at{" "}
        <SupportMailto /> with your account email and a short explanation, and
        we will review your request within 1–2 business days. App Store
        purchases follow Apple&rsquo;s refund policy and can also be requested
        through your Apple ID account settings.
      </>
    ),
  },
  {
    question: "Is my data private?",
    answer: (
      <>
        Yes. We never sell your data and never share it with advertisers. The
        simulation activity inside Dopiq stays tied to your account so we can
        show you your savings and streaks, but it is not used for anything
        else. See our{" "}
        <Link
          href="/privacy"
          className="text-brand underline-offset-2 hover:underline"
        >
          Privacy Policy
        </Link>{" "}
        for full details.
      </>
    ),
  },
  {
    question: "I forgot my password. What do I do?",
    answer: (
      <>
        Go to dopiqapp.com/signin and use the password reset flow there. If
        you signed up with Google or Apple, just use that same provider to
        sign back in — there is no separate password to reset.
      </>
    ),
  },
  {
    question:
      "The app is showing a blank screen or not loading. What can I do?",
    answer: (
      <>
        Try closing the app fully and reopening it. If you are signed in on
        the web at dopiqapp.com but the iOS app is not picking up your
        subscription, sign out of the iOS app and sign back in to refresh
        your session. If the issue persists, email us at <SupportMailto />{" "}
        with details and we will look into it.
      </>
    ),
  },
];

export default function SupportPage() {
  return (
    <main className="min-h-[100dvh] bg-[#FAFAF8] text-[#0A0F1E]">
      <div className="mx-auto w-full max-w-2xl px-5 py-8 sm:px-8 sm:py-10">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-[14px] text-ink-muted transition hover:text-ink"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden
          >
            <path
              d="M15 18l-6-6 6-6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Back to home
        </Link>

        {/* Wordmark — matches the brand mark on /privacy and /terms
            so the three legal/help surfaces feel like one family. */}
        <div className="mt-6 flex items-center gap-3">
          <svg
            width="36"
            height="36"
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
          <span className="font-heading text-[24px] font-extrabold leading-none text-[#0A0F1E]">
            dopiq
          </span>
        </div>

        <h1 className="mt-6 font-heading text-[28px] font-bold tracking-tight text-[#0A0F1E]">
          Support
        </h1>

        <p
          className="mt-3 font-sans text-[16px] text-[#0A0F1E]"
          style={{ lineHeight: 1.7 }}
        >
          Got a question or running into an issue? We are here to help. Email
          us anytime at <SupportMailto /> and we will get back to you within
          1–2 business days.
        </p>

        <h2 className="mt-10 font-heading text-[20px] font-bold text-[#0A0F1E]">
          Frequently Asked Questions
        </h2>

        <div className="mt-6 space-y-7">
          {FAQS.map((faq) => (
            <section key={faq.question}>
              <h3 className="font-heading text-[18px] font-bold text-[#0A0F1E]">
                {faq.question}
              </h3>
              <p
                className="mt-2 font-sans text-[16px] text-[#0A0F1E]"
                style={{ lineHeight: 1.7 }}
              >
                {faq.answer}
              </p>
            </section>
          ))}
        </div>

        <footer className="mt-12 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-[#E5E7EB] pt-6 text-[13px] text-ink-muted">
          <Link href="/" className="transition hover:text-ink">
            Home
          </Link>
          <span aria-hidden className="text-ink-faint">
            ·
          </span>
          <Link href="/terms" className="transition hover:text-ink">
            Terms
          </Link>
          <span aria-hidden className="text-ink-faint">
            ·
          </span>
          <Link href="/privacy" className="transition hover:text-ink">
            Privacy
          </Link>
        </footer>
      </div>
    </main>
  );
}

function SupportMailto() {
  return (
    <a
      href={`mailto:${SUPPORT_EMAIL}`}
      className="text-brand underline-offset-2 hover:underline"
    >
      {SUPPORT_EMAIL}
    </a>
  );
}
