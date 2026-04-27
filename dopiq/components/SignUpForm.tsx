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

export function SignUpForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

      // Sign the new user in immediately so /paywall has a session.
      const signInRes = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (signInRes?.error) {
        throw new Error(
          "Account created but sign-in failed. Try signing in manually.",
        );
      }
      router.push("/paywall");
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

      <motion.form
        variants={fadeUp}
        transition={{ duration: 0.4, delay: 0.22, ease: "easeOut" }}
        onSubmit={onSubmit}
        className="mt-6 space-y-3"
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
          autoComplete="new-password"
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password (8+ characters)"
          className="input"
        />
        <input
          type="password"
          required
          autoComplete="new-password"
          minLength={8}
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
