"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const RESEND_COOLDOWN_SEC = 60;

export function VerifyEmailScreen() {
  const params = useSearchParams();
  const email = params.get("email") ?? "";

  const [cooldown, setCooldown] = useState(0);
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<
    | { kind: "idle" }
    | { kind: "sent" }
    | { kind: "error"; message: string }
  >({ kind: "idle" });

  // 1Hz countdown timer while a cooldown is active. Cleared on
  // unmount or when it reaches zero.
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = window.setInterval(() => {
      setCooldown((c) => Math.max(0, c - 1));
    }, 1000);
    return () => window.clearInterval(t);
  }, [cooldown]);

  async function onResend() {
    if (sending || cooldown > 0) return;
    if (!email) {
      setStatus({
        kind: "error",
        message: "We don't know which email to resend to. Sign up again.",
      });
      return;
    }
    setSending(true);
    setStatus({ kind: "idle" });
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        throw new Error(data.error ?? "Couldn't resend the email.");
      }
      setStatus({ kind: "sent" });
      setCooldown(RESEND_COOLDOWN_SEC);
    } catch (e) {
      setStatus({
        kind: "error",
        message: e instanceof Error ? e.message : "Couldn't resend the email.",
      });
    } finally {
      setSending(false);
    }
  }

  const buttonDisabled = sending || cooldown > 0;
  const buttonLabel = sending
    ? "Sending…"
    : cooldown > 0
      ? `Resend in ${cooldown}s`
      : "Resend verification email";

  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col items-center justify-center px-5 py-10 text-center">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        {/* Brand wordmark */}
        <span className="font-heading text-[28px] font-extrabold tracking-tight text-brand">
          dopiq
        </span>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.05, duration: 0.4, ease: "easeOut" }}
        className="mt-8 flex h-16 w-16 items-center justify-center rounded-full bg-[#E8F5E9] text-brand"
      >
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
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="m3 7 9 6 9-6" />
        </svg>
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4, ease: "easeOut" }}
        className="mt-6 font-heading text-[24px] font-bold leading-tight tracking-tight text-[#0A0F1E]"
      >
        Check your inbox
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4, ease: "easeOut" }}
        className="mt-3 text-[15px] leading-relaxed text-ink-muted"
      >
        We sent a verification link to{" "}
        {email ? (
          <span className="font-semibold text-[#0A0F1E]">{email}</span>
        ) : (
          <span className="font-semibold text-[#0A0F1E]">your inbox</span>
        )}
        . Click the link to activate your account.
      </motion.p>

      <motion.button
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.22, duration: 0.4, ease: "easeOut" }}
        whileTap={{ scale: 0.98 }}
        type="button"
        onClick={onResend}
        disabled={buttonDisabled}
        className="mt-7 h-12 w-full rounded-pill bg-[#0A0F1E] px-5 font-heading text-[15px] font-bold text-white transition-opacity disabled:opacity-50"
      >
        {buttonLabel}
      </motion.button>

      {status.kind === "sent" && (
        <p className="mt-3 text-[13px] font-medium text-brand">
          Sent! Check your inbox.
        </p>
      )}
      {status.kind === "error" && (
        <p className="mt-3 rounded-xl bg-red-50 px-4 py-2 text-[12px] font-medium text-red-700">
          {status.message}
        </p>
      )}

      <p className="mt-5 text-[12px] text-ink-faint">
        The link expires in 24 hours.
      </p>

      <p className="mt-8 text-[13px] text-ink-muted">
        Already verified?{" "}
        <Link href="/signin" className="font-semibold text-ink underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
