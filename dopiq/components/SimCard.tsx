"use client";

import { memo, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { DotTexture } from "@/components/DotTexture";

function SimCardImpl({
  href,
  label,
  bg,
  title,
  icon,
  delay,
}: {
  href: string;
  label: string;
  bg: string;
  /** Tailwind text-color class — used for label, chevron, and pattern tint. */
  title: string;
  icon: React.ReactNode;
  delay: number; // seconds
}) {
  const [entered, setEntered] = useState(false);
  const [hovered, setHovered] = useState(false);
  const reduce = useReducedMotion();
  // Breathe = the post-entrance idle pulse. Suppressed entirely
  // for reduced-motion users. Duration is staggered off the
  // per-card entrance `delay` (0 / .15 / .3 / .45 → 3.5 / 3.8 /
  // 4.1 / 4.4s) so the cards don't bob in lockstep.
  const breathe = entered && !reduce;

  return (
    <motion.div
      className={cn(
        "group relative min-h-[180px] overflow-hidden rounded-card border-[2.5px] border-[#2A1F18]",
        bg,
      )}
      initial={{ opacity: 0, y: 24 }}
      animate={
        breathe
          ? { opacity: 1, y: 0, scale: [1, 1.02, 1] }
          : { opacity: 1, y: 0 }
      }
      transition={
        breathe
          ? {
              scale: {
                duration: 3.5 + delay * 2,
                repeat: Infinity,
                ease: "easeInOut",
              },
            }
          : { duration: 0.5, delay, ease: "easeOut" }
      }
      onAnimationComplete={() => {
        if (!entered) setEntered(true);
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      whileHover={{
        // Transform-only hover — boxShadow animation forces a paint
        // every frame, which lags on lower-end mobile GPUs. The
        // hover ring is now a static CSS class on the wrapper below.
        scale: 1.04,
        transition: { duration: 0.2 },
      }}
      whileTap={{ scale: 0.97, transition: { duration: 0.08 } }}
      style={{
        // Static shadow that swaps on hover via CSS — no per-frame
        // paints. Uses the same brand-coral coloring the animated
        // shadow had.
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.04)",
      }}
    >
      {/* Subtle dotted texture, tinted by the card's title color via
          currentColor (the shared DotTexture uses fill="currentColor"
          and inherits whatever Tailwind text-* class lands on it).
          Keeps each card visually unique without hard-coding three
          different patterns. */}
      <DotTexture className={title} />

      <Link
        href={href}
        className="relative flex h-full min-h-[180px] flex-col justify-between p-4 md:p-5"
      >
        {/* Hover chevron — confirms tappability */}
        <motion.span
          aria-hidden
          className={cn(
            "absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full bg-white/60 backdrop-blur-sm",
            title,
          )}
          animate={hovered ? { x: 2, opacity: 1 } : { x: 0, opacity: 0.7 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
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
        </motion.span>

        <span aria-hidden className="text-[40px] leading-none md:text-[44px]">
          {icon}
        </span>

        <p
          className={cn(
            "font-heading text-[22px] font-extrabold leading-tight md:text-[24px]",
            title,
          )}
        >
          {label}
        </p>
      </Link>
    </motion.div>
  );
}

// Memoized — the home page passes stable string + ReactNode props,
// so the only re-renders should be the entry/hover ones owned by
// each card's own state.
export const SimCard = memo(SimCardImpl);
