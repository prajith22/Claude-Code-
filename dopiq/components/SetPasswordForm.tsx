"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

const MIN_PASSWORD_LEN = 8;

export function SetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!token) {
    return (
      <div className="w-full max-w-sm text-center">
        <h1 className="font-heading text-[28px] font-bold tracking-tight text-ink">
          Link missing
        </h1>
        <p className="mt-2 text-[15px] text-ink-muted">
          This page needs a setup link from your email. Open the link in
          your inbox, or head back to sign in.
        </p>
        <Link
          href="/signin"
          className="btn-navy mt-6 inline-flex h-12 w-full items-center justify-center"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setError(null);

    if (password.length < MIN_PASSWORD_LEN) {
      setError(`Password must be at least ${MIN_PASSWORD_LEN} characters.`);
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/password-setup/complete", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
      };
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Couldn't set your password. Try again.");
        setSubmitting(false);
        return;
      }
      // Auto-sign-in cookie was set server-side on the response.
      router.push("/home");
    } catch {
      setError("Couldn't set your password. Try again.");
      setSubmitting(false);
    }
  }

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={fadeUp}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="w-full max-w-sm"
    >
      <h1 className="font-heading text-[28px] font-bold tracking-tight text-ink">
        Set your password
      </h1>
      <p className="mt-2 text-[15px] text-ink-muted">
        Choose a password to add email login to your Dopiq account. Your
        Google login will still work on the web.
      </p>

      <form onSubmit={onSubmit} className="mt-7 space-y-3">
        <div className="relative">
          <input
            type={show ? "text" : "password"}
            required
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="New password"
            className="input pr-16"
          />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] font-bold text-ink-muted"
            aria-label={show ? "Hide password" : "Show password"}
          >
            {show ? "Hide" : "Show"}
          </button>
        </div>
        <input
          type={show ? "text" : "password"}
          required
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Confirm password"
          className="input"
        />
        <motion.button
          whileHover={{ y: -1 }}
          whileTap={{ y: 0, scale: 0.99 }}
          type="submit"
          disabled={submitting}
          className="btn-navy mt-1 h-12 w-full"
        >
          {submitting ? "Setting password…" : "Set password & sign in"}
        </motion.button>

        {error && (
          <p className="rounded-xl bg-red-50 px-4 py-2 text-center text-[12px] font-medium text-red-700">
            {error}
          </p>
        )}
      </form>

      <p className="mt-5 text-center text-[13px] text-ink-muted">
        Changed your mind?{" "}
        <Link href="/signin" className="font-semibold text-ink underline">
          Back to sign in
        </Link>
      </p>
    </motion.div>
  );
}
