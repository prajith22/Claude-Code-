"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useSavingsStore } from "@/lib/savings-store";
import { Coin, Flame } from "@/components/icons";

type Summary = {
  todaySaved: number;
  currentStreak: number;
  longestStreak: number;
  streakStatus: "active" | "at_risk" | "broken" | "none";
};

function todayDateStr(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function localMidnightISO(): string {
  // The user's local-day cutoff, expressed as a UTC instant. Server
  // sums Urge rows with createdAt >= this, giving a true daily reset
  // that matches the user's wall clock.
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function formatMoney(n: number): string {
  if (n >= 1000) {
    // 1.2k, 12.4k
    return `$${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k`;
  }
  return `$${Math.round(n).toLocaleString("en-US")}`;
}

/**
 * Persistent savings + streak chip rendered on every gated page.
 * Polls on mount + whenever savings-store.version bumps (called by
 * checkout / place-bet code paths after a successful simulation).
 */
export function SavingsHeader() {
  const { status } = useSession();
  const version = useSavingsStore((s) => s.version);
  const [summary, setSummary] = useState<Summary | null>(null);

  useEffect(() => {
    if (status !== "authenticated") return;
    let cancelled = false;
    const params = new URLSearchParams({
      today: todayDateStr(),
      since: localMidnightISO(),
    });
    fetch(`/api/savings/me?${params.toString()}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d: Summary | null) => {
        if (!cancelled && d) setSummary(d);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [status, version]);

  if (status !== "authenticated") return null;

  const saved = summary?.todaySaved ?? 0;
  const streak = summary?.currentStreak ?? 0;
  const atRisk = summary?.streakStatus === "at_risk";

  return (
    <Link
      href="/home"
      aria-label={`Saved today: ${formatMoney(saved)}. ${streak} day streak.`}
      className="inline-flex items-center gap-2 text-[12px] font-bold"
    >
      <SavingsTicker amount={saved} />
      <StreakChip streak={streak} atRisk={atRisk} />
    </Link>
  );
}

function SavingsTicker({ amount }: { amount: number }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-pill bg-[#E8F5E9] px-3 py-1.5">
      <Coin size={13} className="text-[#2E7D32]" />
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={amount}
          initial={{ y: -8, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 8, opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="font-mono tabular-nums text-[#2E7D32]"
        >
          {formatMoney(amount)}
        </motion.span>
      </AnimatePresence>
      <span className="hidden text-[10px] font-semibold uppercase tracking-wider text-[#2E7D32]/70 sm:inline">
        today
      </span>
    </span>
  );
}

function StreakChip({ streak, atRisk }: { streak: number; atRisk: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-pill bg-[#FFF3E0] px-3 py-1.5">
      <Flame
        size={13}
        className={
          streak === 0
            ? "text-[#E65100]/40"
            : atRisk
              ? "text-[#E65100]/70"
              : "text-[#E65100]"
        }
      />
      <span className="font-mono tabular-nums text-[#E65100]">{streak}</span>
      <span className="hidden text-[10px] font-semibold uppercase tracking-wider text-[#E65100]/70 sm:inline">
        day{streak === 1 ? "" : "s"}
      </span>
    </span>
  );
}
