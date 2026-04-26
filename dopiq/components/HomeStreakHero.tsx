"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useSavingsStore } from "@/lib/savings-store";

type Summary = {
  todaySaved: number;
  currentStreak: number;
  longestStreak: number;
  streakStatus: "active" | "at_risk" | "broken" | "none";
};

function todayDateStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function localMidnightISO(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function formatMoney(n: number): string {
  return `$${Math.round(n).toLocaleString("en-US")}`;
}

function streakMessage(streak: number, atRisk: boolean, longest: number): string {
  if (streak === 0) return "Start your streak today.";
  if (atRisk) return "Don’t break it.";
  if (streak === 1) return "Day one. Nice.";
  if (streak < 7) return "Keep it up!";
  if (streak < 14) return "You’re on fire!";
  return `Best ever: ${longest}.`;
}

export function HomeStreakHero({ initial }: { initial: Summary | null }) {
  const { status } = useSession();
  const version = useSavingsStore((s) => s.version);
  const [summary, setSummary] = useState<Summary | null>(initial);

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

  const saved = summary?.todaySaved ?? 0;
  const streak = summary?.currentStreak ?? 0;
  const longest = summary?.longestStreak ?? 0;
  const atRisk = summary?.streakStatus === "at_risk";

  return (
    <div className="grid gap-3 sm:grid-cols-[1.4fr_1fr] sm:gap-4">
      {/* Saved today — clean white card with green accents */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="rounded-card border border-[#E8E4E0] bg-white p-6"
      >
        <p className="text-[11px] font-bold uppercase tracking-widest text-[#1A1A1A]/60">
          Saved today
        </p>
        <div className="mt-2 flex items-baseline gap-2.5">
          <p className="font-heading text-[44px] font-extrabold leading-none text-[#1B5E20] md:text-[56px]">
            {formatMoney(saved)}
          </p>
          <ArrowUp className="text-[#1B5E20]" />
        </div>
        <p className="mt-2 text-[13px] text-[#1A1A1A]/70">
          {saved === 0
            ? "First simulation of the day starts the count."
            : "That’s real money you didn’t spend on real impulses."}
        </p>
      </motion.section>

      {/* Streak — clean white card with charcoal accents */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.08, ease: "easeOut" }}
        className="rounded-card border border-[#E8E4E0] bg-white p-6"
      >
        <p className="text-[11px] font-bold uppercase tracking-widest text-[#1A1A1A]/60">
          Streak
        </p>
        <div className="mt-2 flex items-center gap-3">
          <span aria-hidden className="text-[40px] leading-none md:text-[48px]">
            🔥
          </span>
          <span className="font-mono text-[44px] font-extrabold leading-none text-[#1A1A1A] tabular-nums md:text-[56px]">
            {streak}
          </span>
        </div>
        <p className="mt-2 text-[13px] font-semibold text-[#1A1A1A]/70">
          {streakMessage(streak, atRisk, longest)}
        </p>
      </motion.section>
    </div>
  );
}

function ArrowUp({ className }: { className?: string }) {
  // Inline SVG to avoid pulling in another icon dep — sized to sit on
  // the baseline next to the dollar amount.
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
    >
      <path d="M12 19V5M5 12l7-7 7 7" />
    </svg>
  );
}
