"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useSavingsStore } from "@/lib/savings-store";
import { Flame } from "@/components/icons";

type Summary = {
  totalSaved: number;
  currentStreak: number;
  longestStreak: number;
  streakStatus: "active" | "at_risk" | "broken" | "none";
};

function todayDateStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatMoney(n: number): string {
  return `$${Math.round(n).toLocaleString("en-US")}`;
}

export function HomeStreakHero({ initial }: { initial: Summary | null }) {
  const { status } = useSession();
  const version = useSavingsStore((s) => s.version);
  const [summary, setSummary] = useState<Summary | null>(initial);

  useEffect(() => {
    if (status !== "authenticated") return;
    let cancelled = false;
    fetch(`/api/savings/me?today=${encodeURIComponent(todayDateStr())}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d: Summary | null) => {
        if (!cancelled && d) setSummary(d);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [status, version]);

  const saved = summary?.totalSaved ?? 0;
  const streak = summary?.currentStreak ?? 0;
  const longest = summary?.longestStreak ?? 0;
  const atRisk = summary?.streakStatus === "at_risk";

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="card-navy p-6"
    >
      <div className="grid gap-5 sm:grid-cols-[1fr_auto] sm:items-end">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-white/50">
            Money saved by simulating
          </p>
          <p className="money mt-2 text-[44px] leading-none text-brand md:text-[56px]">
            {formatMoney(saved)}
          </p>
          <p className="mt-2 text-[13px] text-white/70">
            That&rsquo;s real money you didn&rsquo;t spend on real impulses.
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 sm:min-w-[160px]">
          <p className="text-[11px] font-bold uppercase tracking-widest text-white/50">
            Streak
          </p>
          <div className="mt-2 flex items-center gap-3">
            <Flame
              size={28}
              className={
                streak === 0
                  ? "text-white/30"
                  : atRisk
                    ? "text-white/60"
                    : "text-brand"
              }
            />
            <span className="font-mono text-[40px] font-extrabold leading-none text-white tabular-nums">
              {streak}
            </span>
          </div>
          <p
            className={`mt-1 text-[12px] font-semibold ${atRisk ? "text-white" : "text-white/60"}`}
          >
            {streak === 0
              ? "Start your streak today."
              : atRisk
                ? "At risk. Log anything to keep it."
                : streak === 1
                  ? "day clean"
                  : `days clean · best ${longest}`}
          </p>
        </div>
      </div>
    </motion.section>
  );
}
