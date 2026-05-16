"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { DopaminePulse } from "@/components/DopaminePulse";

// Amplified home Quick Sim card. Same copy / route (/quick-sim —
// the existing entry, unchanged) / dot texture / chevron as the
// old inline <Link>; adds a breathing emerald-coral glow, a
// pulsing bolt with a Dopamine Pulse behind it, and hover/tap
// feedback. Every continuous animation is gated on
// useReducedMotion.
export function QuickSimHomeCard() {
  const reduce = useReducedMotion();

  return (
    <motion.div
      whileHover={reduce ? undefined : { scale: 1.01 }}
      whileTap={reduce ? undefined : { scale: 0.985 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      animate={
        reduce
          ? undefined
          : {
              boxShadow: [
                "0 4px 12px -4px rgba(232,168,180,0.18)",
                "0 10px 26px -4px rgba(232,168,180,0.38)",
                "0 4px 12px -4px rgba(232,168,180,0.18)",
              ],
            }
      }
      // The boxShadow keyframe is its own slow loop; scale uses the
      // short transition above.
      style={{ boxShadow: "0 4px 12px -4px rgba(232,168,180,0.18)" }}
      className="overflow-hidden rounded-card"
    >
      <Link
        href="/quick-sim"
        className="group relative flex items-center gap-4 overflow-hidden rounded-card border-[2.5px] border-[#2A1F18] bg-[#FFE4E1] p-6 transition active:scale-[0.99]"
      >
        {/* Dot texture — unchanged from the original card. */}
        <svg
          aria-hidden
          className="pointer-events-none absolute inset-0 h-full w-full text-[#8B2500] opacity-[0.07]"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern
              id="qs-dots"
              x="0"
              y="0"
              width="14"
              height="14"
              patternUnits="userSpaceOnUse"
            >
              <circle cx="2" cy="2" r="1.4" fill="currentColor" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#qs-dots)" />
        </svg>

        <span className="relative flex h-14 w-14 flex-none items-center justify-center">
          <DopaminePulse color="rgba(236,72,153,0.28)" className="inset-0" />
          <motion.span
            aria-hidden
            className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-white/60 text-[30px] leading-none backdrop-blur-sm"
            animate={reduce ? undefined : { scale: [1, 1.06, 1] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          >
            ⚡
          </motion.span>
        </span>

        <div className="relative min-w-0 flex-1">
          <p className="font-heading text-[19px] font-extrabold leading-tight text-[#8B2500]">
            Quick Sim
          </p>
          <p className="mt-0.5 text-[12px] text-[#8B2500]/70">
            Impulse hitting? Sim it in seconds.
          </p>
        </div>
        <span
          aria-hidden
          className="relative flex h-8 w-8 flex-none items-center justify-center rounded-full bg-white/60 text-[#8B2500] backdrop-blur-sm transition group-hover:translate-x-0.5"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path
              d="M9 6l6 6-6 6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </Link>
    </motion.div>
  );
}
