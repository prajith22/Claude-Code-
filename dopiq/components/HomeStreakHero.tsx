"use client";

import {
  animate,
  motion,
  useAnimationControls,
  useMotionValue,
} from "framer-motion";
import { useEffect, useRef, useState } from "react";
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

function formatAnimatedMoney(v: number): string {
  // Two decimals throughout — including during the count-up while v is
  // negative (slot-machine effect). Sign sits before the dollar sign:
  // "-$78.00" reads more naturally than "$-78.00".
  const sign = v < 0 ? "-" : "";
  const abs = Math.abs(v).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${sign}$${abs}`;
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
          <AnimatedSavedAmount
            value={saved}
            className="font-heading text-[44px] font-extrabold leading-none text-[#1B5E20] md:text-[56px]"
          />
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

const COUNT_DURATION_S = 1.2;
const COUNT_OFFSET = 100;

/**
 * Slot-machine count-up to the current saved-today value. Starts 100
 * dollars below the target (so $22 lifts off from -$78), eases out
 * cubically, then pops the number with a tiny scale pulse on landing.
 *
 * Implementation notes:
 * - Framer's `animate(motionValue, target, ...)` drives the number; we
 *   subscribe to its change events and write directly to a ref'd span
 *   so React doesn't re-render once per frame (~70 renders avoided per
 *   animation).
 * - Re-runs whenever `value` changes (including the initial 0 → real
 *   transition once /api/savings/me lands).
 * - `value === 0` short-circuits to a static "$0.00" — no animation,
 *   no pulse.
 */
function AnimatedSavedAmount({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const motionValue = useMotionValue(0);
  const controls = useAnimationControls();

  // Subscribe once: every motionValue change writes the formatted text
  // straight to the DOM. Cleanup unsubscribes on unmount.
  useEffect(() => {
    return motionValue.on("change", (v) => {
      if (ref.current) ref.current.textContent = formatAnimatedMoney(v);
    });
  }, [motionValue]);

  useEffect(() => {
    if (value === 0) {
      motionValue.stop();
      motionValue.set(0);
      if (ref.current) ref.current.textContent = "$0.00";
      return;
    }

    const start = value - COUNT_OFFSET;
    motionValue.set(start);
    // Write the start frame synchronously so the user doesn't see a
    // flicker of the previous value while RAF spins up.
    if (ref.current) ref.current.textContent = formatAnimatedMoney(start);

    const animation = animate(motionValue, value, {
      duration: COUNT_DURATION_S,
      // Cubic ease-out — fast start, smooth deceleration into the
      // final number. Same shape as a slot-wheel slowing down.
      ease: [0, 0, 0.2, 1],
      onComplete: () => {
        // Snap the displayed value to exactly the target so any
        // subpixel rounding from the easing curve disappears.
        if (ref.current) ref.current.textContent = formatAnimatedMoney(value);
        controls.start({
          scale: [1, 1.05, 1],
          transition: { type: "spring", stiffness: 300, damping: 15 },
        });
      },
    });

    return () => animation.stop();
  }, [value, motionValue, controls]);

  return (
    <motion.span
      ref={ref}
      animate={controls}
      className={className}
      style={{ display: "inline-block", transformOrigin: "left center" }}
    >
      $0.00
    </motion.span>
  );
}
