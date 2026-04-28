"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";
import { Lock, Card, Bolt } from "@/components/icons";

const fadeRight = {
  hidden: { opacity: 0, x: 24 },
  show: { opacity: 1, x: 0 },
};

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

const OAUTH_ERROR_MESSAGES: Record<string, string> = {
  AccessDenied: "Google blocked the sign-in. Try again.",
  Verification: "Verification link expired. Try again.",
  OAuthSignin: "Couldn’t reach Google. Try again.",
  OAuthCallback: "Google sign-in didn’t complete. Try again.",
  OAuthCreateAccount: "Couldn’t create your account. Try again.",
  Callback: "Sign-in failed. Try again.",
  Default: "Sign-in failed. Try again.",
};

// Maps the messages thrown from authorize() back to a single friendly
// hint per failure mode. Keep keys in sync with lib/auth.ts.
const CREDENTIALS_ERROR_MAP: Array<{ match: string; message: string }> = [
  { match: "Missing email or password", message: "Enter your email and password." },
  { match: "No account with that email", message: "No account with that email. Sign up?" },
  { match: "Try signing in with Google", message: "This email signed up with Google. Use the Google button." },
  { match: "Wrong password", message: "Wrong password. Try again." },
];

function mapCredentialsError(raw: string | undefined | null): string {
  if (!raw) return "Sign-in failed. Try again.";
  for (const { match, message } of CREDENTIALS_ERROR_MAP) {
    if (raw.includes(match)) return message;
  }
  return raw;
}

export function SignInForm() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") ?? "/home";
  const oauthErrorParam = params.get("error");
  const oauthErrorMessage = oauthErrorParam
    ? OAUTH_ERROR_MESSAGES[oauthErrorParam] ?? OAUTH_ERROR_MESSAGES.Default
    : null;
  // ?deleted=1 — set by the post-account-delete redirect.
  const deletedNotice = params.get("deleted")
    ? "Your account has been deleted."
    : null;

  const [googleLoading, setGoogleLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [credSubmitting, setCredSubmitting] = useState(false);
  const [credError, setCredError] = useState<string | null>(null);

  async function onCredentialsSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (credSubmitting) return;
    setCredError(null);
    setCredSubmitting(true);
    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (res?.error) {
        setCredError(mapCredentialsError(res.error));
        setCredSubmitting(false);
        return;
      }
      router.push(callbackUrl);
    } catch (err) {
      setCredError(
        err instanceof Error ? err.message : "Sign-in failed. Try again.",
      );
      setCredSubmitting(false);
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
        Sign in to Dopiq
      </motion.h1>
      <motion.p
        variants={fadeUp}
        transition={{ duration: 0.4, delay: 0.15, ease: "easeOut" }}
        className="mt-2 text-[15px] text-ink-muted"
      >
        Use Google or your email — whichever you signed up with.
      </motion.p>

      {deletedNotice && (
        <motion.div
          variants={fadeUp}
          transition={{ duration: 0.4, delay: 0.18, ease: "easeOut" }}
          className="mt-5 rounded-card border border-surface-border bg-surface-alt px-4 py-3 text-center text-[13px] font-medium text-ink"
        >
          {deletedNotice}
        </motion.div>
      )}

      {/* Trial banner */}
      <motion.div
        variants={fadeUp}
        transition={{ duration: 0.4, delay: 0.22, ease: "easeOut" }}
        className="mt-7 rounded-pill bg-brand px-4 py-2.5 text-center text-[13px] font-bold text-white shadow-[0_2px_12px_rgba(0,200,83,0.3)]"
      >
        7 days free — no charge until your trial ends
      </motion.div>

      {/* Google button */}
      <motion.button
        variants={fadeUp}
        transition={{ duration: 0.4, delay: 0.3, ease: "easeOut" }}
        whileHover={{ y: -2, boxShadow: "0 8px 24px rgba(10,15,30,0.12)" }}
        whileTap={{ y: 0, scale: 0.99 }}
        type="button"
        disabled={googleLoading}
        onClick={() => {
          setGoogleLoading(true);
          signIn("google", { callbackUrl });
        }}
        className="mt-4 flex h-14 w-full items-center justify-center gap-3 rounded-pill border border-surface-border bg-white text-[15px] font-bold text-ink transition-colors duration-150 hover:bg-surface-alt disabled:opacity-60"
      >
        <GoogleMark />
        <span>{googleLoading ? "Opening Google…" : "Continue with Google"}</span>
      </motion.button>

      {oauthErrorMessage && (
        <p className="mt-3 rounded-xl bg-red-50 px-4 py-2 text-center text-[12px] font-medium text-red-700">
          {oauthErrorMessage}
        </p>
      )}

      {/* "or" divider */}
      <motion.div
        variants={fadeUp}
        transition={{ duration: 0.4, delay: 0.34, ease: "easeOut" }}
        className="mt-6 flex items-center gap-3"
        aria-hidden
      >
        <div className="h-px flex-1 bg-surface-border" />
        <span className="text-[11px] font-semibold uppercase tracking-widest text-ink-muted">
          or
        </span>
        <div className="h-px flex-1 bg-surface-border" />
      </motion.div>

      {/* Email + password form */}
      <motion.form
        variants={fadeUp}
        transition={{ duration: 0.4, delay: 0.4, ease: "easeOut" }}
        onSubmit={onCredentialsSubmit}
        className="mt-5 space-y-3"
      >
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="input"
        />
        <input
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="input"
        />
        <motion.button
          whileHover={{ y: -1 }}
          whileTap={{ y: 0, scale: 0.99 }}
          type="submit"
          disabled={credSubmitting}
          className="btn-navy mt-1 h-12 w-full"
        >
          {credSubmitting ? "Signing in…" : "Sign in"}
        </motion.button>

        {credError && (
          <p className="rounded-xl bg-red-50 px-4 py-2 text-center text-[12px] font-medium text-red-700">
            {credError}
          </p>
        )}
      </motion.form>

      <motion.p
        variants={fadeUp}
        transition={{ duration: 0.4, delay: 0.46, ease: "easeOut" }}
        className="mt-5 text-center text-[13px] text-ink-muted"
      >
        New here?{" "}
        <Link href="/signup" className="font-semibold text-ink underline">
          Create an account
        </Link>
      </motion.p>

      {/* Trust badges */}
      <motion.div
        variants={fadeUp}
        transition={{ duration: 0.4, delay: 0.52, ease: "easeOut" }}
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
        transition={{ duration: 0.4, delay: 0.6, ease: "easeOut" }}
        className="mt-6 text-center text-[11px] text-ink-faint"
      >
        By continuing you agree to the{" "}
        <Link
          href="/terms"
          className="text-brand underline-offset-2 hover:underline"
        >
          terms
        </Link>{" "}
        and{" "}
        <Link
          href="/privacy"
          className="text-brand underline-offset-2 hover:underline"
        >
          privacy policy
        </Link>
        .
      </motion.p>
    </motion.div>
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
