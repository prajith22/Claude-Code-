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
      {/* Saved today — warm green card */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="rounded-card bg-[#E8F5E9] p-6"
      >
        <p className="text-[11px] font-bold uppercase tracking-widest text-[#2E7D32]/70">
          Saved today
        </p>
        <div className="mt-2 flex items-baseline gap-2">
          <p className="font-heading text-[44px] font-extrabold leading-none text-[#2E7D32] md:text-[56px]">
            {formatMoney(saved)}
          </p>
          <span aria-hidden className="text-[26px] md:text-[32px]">
            {saved > 0 ? "🎉" : "✨"}
          </span>
        </div>
        <p className="mt-2 text-[13px] text-[#2E7D32]/80">
          {saved === 0
            ? "First simulation of the day starts the count."
            : "That’s real money you didn’t spend on real impulses."}
        </p>
      </motion.section>

      {/* Streak — warm amber card */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.08, ease: "easeOut" }}
        className="rounded-card bg-[#FFF3E0] p-6"
      >
        <p className="text-[11px] font-bold uppercase tracking-widest text-[#E65100]/70">
          Streak
        </p>
        <div className="mt-2 flex items-center gap-3">
          <span aria-hidden className="text-[40px] leading-none md:text-[48px]">
            🔥
          </span>
          <span className="font-mono text-[44px] font-extrabold leading-none text-[#E65100] tabular-nums md:text-[56px]">
            {streak}
          </span>
        </div>
        <p className="mt-2 text-[13px] font-semibold text-[#E65100]/80">
          {streakMessage(streak, atRisk, longest)}
        </p>
      </motion.section>
    </div>
  );
}
