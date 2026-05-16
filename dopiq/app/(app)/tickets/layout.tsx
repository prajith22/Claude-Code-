"use client";

import { motion, useReducedMotion } from "framer-motion";

/**
 * Tickets atmosphere overlay. A fixed, pointer-events-none teal
 * radial glow that layers ON TOP of each Tickets page's cream
 * background (those pages set their own backgroundColor on a
 * wrapper). Fades in once on mount; static when the user prefers
 * reduced motion. Visual-only — does not touch layout or routing.
 */
export default function TicketsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const reduce = useReducedMotion();
  return (
    <>
      <motion.div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            "radial-gradient(ellipse at top, rgba(20,184,166,0.05) 0%, transparent 50%)",
        }}
        initial={reduce ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={reduce ? { duration: 0 } : { duration: 0.4 }}
      />
      {children}
    </>
  );
}
