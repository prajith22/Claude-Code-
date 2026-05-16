"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

/**
 * Wraps a surface in a very subtle continuous y-axis float so the
 * app feels alive. Returns children untouched (no wrapper motion)
 * when the user prefers reduced motion. Stagger `duration` across
 * sibling instances so cards don't bob in lockstep.
 */
export default function AmbientBreath({
  children,
  duration = 4,
  amplitude = 1,
  className,
}: {
  children: ReactNode;
  duration?: number;
  amplitude?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  if (reduce) return <>{children}</>;
  return (
    <motion.div
      className={className}
      animate={{ y: [0, -amplitude, 0] }}
      transition={{ duration, repeat: Infinity, ease: "easeInOut" }}
    >
      {children}
    </motion.div>
  );
}
