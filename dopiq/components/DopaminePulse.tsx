"use client";

import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * Dopiq's signature "Dopamine Pulse" — a soft radial energy ring
 * that breathes outward and fades, on a calm 5s cadence (2s
 * expand + 3s rest). Reused on the Saved-Today hero amount and the
 * Quick Sim card so the motif reads as one energy language.
 *
 * Renders nothing when the user prefers reduced motion. Always
 * pointer-events-none and aria-hidden; the caller positions/sizes
 * it (e.g. `absolute inset-0`) and passes the tint via `color`.
 */
export function DopaminePulse({
  color,
  className,
}: {
  color: string;
  className?: string;
}) {
  const reduce = useReducedMotion();
  if (reduce) return null;
  return (
    <motion.div
      aria-hidden
      className={cn("pointer-events-none absolute rounded-full", className)}
      style={{
        background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
      }}
      animate={{ scale: [1, 1.8], opacity: [0.3, 0] }}
      transition={{
        duration: 2,
        repeat: Infinity,
        repeatDelay: 3,
        ease: "easeOut",
      }}
    />
  );
}
