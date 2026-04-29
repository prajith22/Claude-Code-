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
      // flex-1 + justify-center so the chip pair fills the gap
      // between the logo and avatar in the TopNav and the two pills
      // sit dead-center as a group with a consistent gap-3 between
      // them. Min-w-0 lets the truncate behavior at narrow widths
      // not blow out the parent flex layout. pl-3 nudges the
      // group a few pixels right of the geometric center so the
      // savings pill isn't visually crowding the dopiq logo.
      className="flex min-w-0 flex-1 items-center justify-center gap-3 pl-3 text-[12px] font-bold"
    >
      <SavingsTicker amount={saved} />
      <StreakChip streak={streak} atRisk={atRisk} />
    </Link>
  );
}

function SavingsTicker({ amount }: { amount: number }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-pill border border-[#1B5E20]/20 bg-white px-3 py-1.5">
      <Coin size={13} className="text-[#1B5E20]" />
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={amount}
          initial={{ y: -8, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 8, opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="font-mono tabular-nums text-[#1B5E20]"
        >
          {formatMoney(amount)}
        </motion.span>
      </AnimatePresence>
      <span className="hidden text-[10px] font-semibold uppercase tracking-wider text-[#1B5E20]/60 sm:inline">
        today
      </span>
    </span>
  );
}

function StreakChip({ streak, atRisk }: { streak: number; atRisk: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-pill border border-[#E8E4E0] bg-white px-3 py-1.5">
      <Flame
        size={13}
        className={
          streak === 0
            ? "text-[#1A1A1A]/40"
            : atRisk
              ? "text-[#1A1A1A]/70"
              : "text-[#1A1A1A]"
        }
      />
      <span className="font-mono tabular-nums text-[#1A1A1A]">{streak}</span>
      <span className="hidden text-[10px] font-semibold uppercase tracking-wider text-[#1A1A1A]/60 sm:inline">
        day{streak === 1 ? "" : "s"}
      </span>
    </span>
  );
}
