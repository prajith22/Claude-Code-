"use client";

import {
  animate,
  motion,
  useAnimationControls,
  useMotionValue,
  useReducedMotion,
} from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { DotTexture } from "@/components/DotTexture";
import { DopaminePulse } from "@/components/DopaminePulse";
import { AnimatedAmount } from "@/components/AnimatedAmount";
import { useSavingsStore } from "@/lib/savings-store";

type Summary = {
  todaySaved: number;
  lifetimeSaved: number;
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

// Rotates daily (by date) so the hero says something slightly
// different each day without being random per render.
const WELLNESS_COPY = [
  "Impulse avoided.",
  "Still yours.",
  "Simulated. Not spent.",
  "Your wallet survived today.",
];

function dailyWellnessCopy(): string {
  const d = new Date();
  const dayOfYear = Math.floor(
    (d.getTime() - new Date(d.getFullYear(), 0, 0).getTime()) / 86_400_000,
  );
  return WELLNESS_COPY[dayOfYear % WELLNESS_COPY.length];
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
  const lifetime = summary?.lifetimeSaved ?? 0;
  const streak = summary?.currentStreak ?? 0;
  const longest = summary?.longestStreak ?? 0;
  const atRisk = summary?.streakStatus === "at_risk";
  const reduce = useReducedMotion();
  // Picked post-mount so the line genuinely "fades in after mount"
  // and there's no SSR/client date mismatch.
  const [wellnessCopy, setWellnessCopy] = useState<string | null>(null);
  useEffect(() => {
    setWellnessCopy(dailyWellnessCopy());
  }, []);

  return (
    <div className="grid gap-3 sm:grid-cols-[1.4fr_1fr] sm:gap-4">
      {/* Saved today — the amplified hero. Soft mint, dot texture,
          a Dopamine Pulse breathing behind the big amount, and a
          TODAY / LIFETIME accumulation strip. All continuous
          motion is reduced-motion-gated. (No WEEK column — the
          savings API exposes today + lifetime only; a weekly sum
          would need a backend change, out of scope here.) */}
      <div className="relative">
        {/* Ambient emerald lighting — bleeds ~80px beyond the hero
            card. Sits OUTSIDE the card's overflow-hidden so it
            isn't clipped; pointer-events-none, behind the card.
            Static (no motion) so no reduced-motion gate needed. */}
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-[80px] -z-10"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(16,185,129,0.10) 0%, transparent 60%)",
          }}
        />
        <motion.section
        initial={reduce ? { opacity: 1 } : { opacity: 0 }}
        animate={
          reduce ? { opacity: 1, y: 0 } : { opacity: 1, y: [0, -2, 0] }
        }
        transition={
          reduce
            ? { duration: 0 }
            : {
                opacity: { duration: 0.4, ease: "easeOut" },
                y: { duration: 4.2, repeat: Infinity, ease: "easeInOut" },
              }
        }
        className="relative overflow-hidden rounded-card border-[2.5px] border-[#2A1F18] bg-[#D1FAE5] px-6 py-8 text-center"
      >
        <DotTexture className="text-[#064E3B]" />
        {/* Content wrapper is `relative` so it sits in the same
            stacking context as the absolute DotTexture and DOM
            order (texture first → content after) decides paint
            order. Without this the SVG would paint over the text. */}
        <div className="relative flex flex-col items-center">
          <p className="type-track-in font-playful text-[11px] font-bold uppercase tracking-widest text-[#1A1A1A]/60">
            Saved today
          </p>
          <div className="relative mt-3 flex items-center justify-center">
            {/* Dopamine Pulse — radial energy breathing out from
                behind the hero amount. */}
            <DopaminePulse
              color="rgba(16,185,129,0.25)"
              className="inset-[-35%]"
            />
            <motion.div
              className="relative"
              animate={reduce ? undefined : { scale: [1, 1.015, 1] }}
              transition={{
                duration: 4.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <AnimatedSavedAmount
                value={saved}
                className="type-hero-amount text-[64px] leading-none md:text-[80px]"
              />
            </motion.div>
          </div>
          {saved === 0 ? (
            <p className="relative mt-3 max-w-[16rem] text-[13px] text-[#1A1A1A]/70">
              First simulation of the day starts the count.
            </p>
          ) : (
            <motion.p
              key={wellnessCopy ?? "pending"}
              initial={{ opacity: 0 }}
              animate={{ opacity: wellnessCopy ? 1 : 0 }}
              transition={{ duration: 0.4, delay: 0.2, ease: "easeOut" }}
              className="type-pulse font-playful relative mt-3 max-w-[16rem] text-[13px] italic text-[#1A1A1A]/70"
            >
              {wellnessCopy ?? " "}
            </motion.p>
          )}

          {/* Accumulation strip — TODAY vs LIFETIME (real fields
              from /api/savings/me). No WEEK column: the API doesn't
              expose a weekly sum and adding one is a backend change
              out of scope for this frontend pass. */}
          <div className="relative mt-6 flex w-full max-w-[18rem] items-stretch">
            <div className="flex-1 px-2">
              <p className="type-track-in font-playful text-[9px] font-bold uppercase tracking-widest text-[#1A1A1A]/45">
                Today
              </p>
              <AnimatedAmount
                amount={saved}
                className="mt-1 block font-heading text-[20px] font-extrabold text-[#1B5E20]"
              />
            </div>
            <div className="w-px self-stretch bg-[#1A1A1A]/15" />
            <div className="flex-1 px-2">
              <p className="type-track-in font-playful text-[9px] font-bold uppercase tracking-widest text-[#1A1A1A]/45">
                Lifetime
              </p>
              <AnimatedAmount
                amount={lifetime}
                className="mt-1 block font-heading text-[20px] font-extrabold text-[#1B5E20]"
              />
            </div>
          </div>
        </div>
        </motion.section>
      </div>

      {/* Streak — warm peach tint pairs with the flame emoji and
          rhymes with the rest of the home palette without colliding
          with Quick Sim's coral pink. DotTexture tinted deep warm
          brown at 7% opacity → reads as darker-peach speckle. */}
      <motion.section
        initial={reduce ? { opacity: 1 } : { opacity: 0 }}
        animate={
          reduce ? { opacity: 1, y: 0 } : { opacity: 1, y: [0, -2, 0] }
        }
        transition={
          reduce
            ? { duration: 0 }
            : {
                opacity: { duration: 0.4, delay: 0.08, ease: "easeOut" },
                y: { duration: 4.8, repeat: Infinity, ease: "easeInOut" },
              }
        }
        className="relative overflow-hidden rounded-card border-[2.5px] border-[#2A1F18] bg-[#FFEDD5] p-6"
      >
        <DotTexture className="text-[#7C2D12]" />
        <div className="relative">
          <p className="type-track-in font-playful text-[11px] font-bold uppercase tracking-widest text-[#1A1A1A]/60">
            Streak
          </p>
          <div className="mt-2 flex items-center gap-3">
            <motion.span
              aria-hidden
              className="text-[40px] leading-none md:text-[48px]"
              style={{ display: "inline-block", transformOrigin: "center bottom" }}
              animate={
                reduce
                  ? undefined
                  : {
                      scale: [1, 1.05, 1, 1.03, 1],
                      rotate: [-1, 0, 1, 0, -1],
                    }
              }
              transition={{
                duration: 1.8,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              🔥
            </motion.span>
            <span className="font-mono text-[44px] font-extrabold leading-none text-[#1A1A1A] tabular-nums md:text-[56px]">
              {streak}
            </span>
          </div>
          <p className="mt-2 text-[13px] font-semibold text-[#1A1A1A]/70">
            {streakMessage(streak, atRisk, longest)}
          </p>
        </div>
      </motion.section>
    </div>
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

    // Clamp to 0 so small values (e.g. $22 today) lift off from $0
    // instead of starting in the negatives — feels more like a
    // counter and less like a balance ledger.
    const start = Math.max(0, value - COUNT_OFFSET);
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
