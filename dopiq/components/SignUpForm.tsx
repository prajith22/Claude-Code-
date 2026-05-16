"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";
import { signIn } from "next-auth/react";
import { Lock, Card, Bolt } from "@/components/icons";

const fadeRight = {
  hidden: { opacity: 0, x: 24 },
  show: { opacity: 1, x: 0 },
};

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

export function SignUpForm({
  excludeGoogle = false,
}: {
  excludeGoogle?: boolean;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [appleLoading, setAppleLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setError(null);

    if (password !== confirm) {
      setError("Passwords don’t match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        throw new Error(data.error ?? "Couldn’t create your account.");
      }

      // Account created — the user is NOT signed in. Hand off to
      // /verify-email so they can check their inbox; sign-in only
      // happens after they click the link in the email.
      router.push(`/verify-email?email=${encodeURIComponent(email)}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setSubmitting(false);
    }
  }

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={fadeRight}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="w-full max-w-sm"
    >
      <motion.h1
        variants={fadeUp}
        transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
        className="font-heading text-[28px] font-bold tracking-tight text-ink"
      >
        Create your account
      </motion.h1>
      <motion.p
        variants={fadeUp}
        transition={{ duration: 0.4, delay: 0.15, ease: "easeOut" }}
        className="mt-2 text-[15px] text-ink-muted"
      >
        7 days free, then $3.99/month. Cancel anytime.
      </motion.p>

      {/* Apple button — above Google per Apple's HIG. Black surface,
          white logomark + text, full-width pill matching the
          Google button's footprint. */}
      <motion.button
        variants={fadeUp}
        transition={{ duration: 0.4, delay: 0.18, ease: "easeOut" }}
        whileHover={{ y: -2, boxShadow: "0 8px 24px rgba(0,0,0,0.18)" }}
        whileTap={{ y: 0, scale: 0.99 }}
        type="button"
        disabled={appleLoading}
        onClick={() => {
          setAppleLoading(true);
          signIn("apple", { callbackUrl: "/home" });
        }}
        className="mt-6 flex h-14 w-full items-center justify-center gap-3 rounded-pill bg-black text-[15px] font-bold text-white transition-colors duration-150 hover:bg-[#1A1A1A] disabled:opacity-60"
      >
        <AppleMark />
        <span>{appleLoading ? "Opening Apple…" : "Continue with Apple"}</span>
      </motion.button>

      {/* Google button — hidden inside the iOS WebView. Google's
          OAuth flow refuses embedded UAs and Apple Guideline 4
          flagged the kick-out-to-Safari workaround. iOS users
          sign up with Apple or email + password instead. */}
      {!excludeGoogle && (
        <motion.button
          variants={fadeUp}
          transition={{ duration: 0.4, delay: 0.2, ease: "easeOut" }}
          whileHover={{ y: -2, boxShadow: "0 8px 24px rgba(10,15,30,0.12)" }}
          whileTap={{ y: 0, scale: 0.99 }}
          type="button"
          disabled={googleLoading}
          onClick={() => {
            setGoogleLoading(true);
            signIn("google", { callbackUrl: "/home" });
          }}
          className="mt-3 flex h-14 w-full items-center justify-center gap-3 rounded-pill border border-surface-border bg-white text-[15px] font-bold text-ink transition-colors duration-150 hover:bg-surface-alt disabled:opacity-60"
        >
          <GoogleMark />
          <span>
            {googleLoading ? "Opening Google…" : "Continue with Google"}
          </span>
        </motion.button>
      )}

      {/* "or" divider */}
      <motion.div
        variants={fadeUp}
        transition={{ duration: 0.4, delay: 0.22, ease: "easeOut" }}
        className="mt-6 flex items-center gap-3"
        aria-hidden
      >
        <div className="h-px flex-1 bg-surface-border" />
        <span className="text-[11px] font-semibold uppercase tracking-widest text-ink-muted">
          or
        </span>
        <div className="h-px flex-1 bg-surface-border" />
      </motion.div>

      <motion.form
        variants={fadeUp}
        transition={{ duration: 0.4, delay: 0.26, ease: "easeOut" }}
        onSubmit={onSubmit}
        className="mt-5 space-y-3"
      >
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="input input-glass"
        />
        <input
          type="password"
          required
          autoComplete="new-password"
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password (8+ characters)"
          className="input input-glass"
        />
        <input
          type="password"
          required
          autoComplete="new-password"
          minLength={8}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Confirm password"
          className="input input-glass"
        />

        <motion.button
          whileHover={{ y: -1 }}
          whileTap={{ y: 0, scale: 0.99 }}
          type="submit"
          disabled={submitting}
          className="btn-primary mt-2 h-12 w-full"
        >
          {submitting ? "Creating your account…" : "Create account"}
        </motion.button>

        {error && (
          <p className="rounded-xl bg-red-50 px-4 py-2 text-center text-[12px] font-medium text-red-700">
            {error}
          </p>
        )}
      </motion.form>

      <motion.div
        variants={fadeUp}
        transition={{ duration: 0.4, delay: 0.32, ease: "easeOut" }}
        className="mt-5 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-[12px] text-ink-muted"
      >
        <span className="inline-flex items-center gap-1.5">
          <Lock size={12} />
          No spam ever
        </span>
        <span aria-hidden className="text-ink-faint">·</span>
        <span className="inline-flex items-center gap-1.5">
          <Card size={12} />
          Cancel anytime
        </span>
        <span aria-hidden className="text-ink-faint">·</span>
        <span className="inline-flex items-center gap-1.5">
          <Bolt size={12} />
          Free for 7 days
        </span>
      </motion.div>

      <motion.p
        variants={fadeUp}
        transition={{ duration: 0.4, delay: 0.4, ease: "easeOut" }}
        className="mt-6 text-center text-[13px] text-ink-muted"
      >
        Already have an account?{" "}
        <Link href="/signin" className="font-semibold text-ink underline">
          Sign in
        </Link>
      </motion.p>
    </motion.div>
  );
}

function AppleMark() {
  return (
    <svg
      width="18"
      height="22"
      viewBox="0 0 14 17"
      fill="white"
      aria-hidden="true"
    >
      <path d="M11.624 9.025c-.013-2.179 1.778-3.225 1.86-3.275-1.013-1.48-2.59-1.683-3.149-1.706-1.34-.135-2.617.789-3.296.789-.69 0-1.732-.768-2.85-.747-1.466.022-2.819.852-3.572 2.166-1.524 2.642-.39 6.553 1.099 8.701.726 1.052 1.59 2.232 2.722 2.19 1.094-.045 1.508-.708 2.83-.708 1.31 0 1.7.708 2.85.683 1.18-.022 1.928-1.07 2.65-2.123.835-1.219 1.18-2.398 1.198-2.46-.025-.012-2.298-.882-2.322-3.51zm-2.166-6.45c.605-.733 1.012-1.75.9-2.762-.87.036-1.92.58-2.546 1.314-.561.65-1.052 1.685-.92 2.678.97.075 1.96-.494 2.566-1.23z" />
    </svg>
  );
}

function GoogleMark() {
  return (
    <svg width="20" height="20" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.264h2.908c1.702-1.567 2.684-3.874 2.684-6.62z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.263c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A9 9 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A9 9 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A9 9 0 0 0 .957 4.962L3.964 7.294C4.672 5.167 6.656 3.58 9 3.58z"
      />
    </svg>
  );
}
