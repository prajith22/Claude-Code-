"use client";

import { motion, useReducedMotion } from "framer-motion";

/**
 * Shop atmosphere — a fixed, pointer-events-none lavender wash behind
 * all /shop pages. Fades in on mount; renders static (no motion) when
 * the user prefers reduced motion.
 */
export default function ShopLayout({
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
            "radial-gradient(ellipse at top, rgba(139,92,246,0.05) 0%, transparent 50%)",
        }}
        initial={reduce ? { opacity: 1 } : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={reduce ? { duration: 0 } : { duration: 0.4 }}
      />
      {children}
    </>
  );
}
