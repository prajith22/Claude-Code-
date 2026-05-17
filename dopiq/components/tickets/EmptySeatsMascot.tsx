"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";

// Shown in the booking content area (above the seat picker) when no
// seats are selected yet. No CTA — the sticky "No seats selected"
// bar already carries the action prompt. Mirrors the onboarding
// mascot entrance + breathing, reduced-motion-gated.
export function EmptySeatsMascot() {
  const reduce = useReducedMotion();
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-8 text-center">
      <motion.div
        initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
        animate={reduce ? { opacity: 1 } : { opacity: 1, scale: 1 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
      >
        <motion.div
          animate={reduce ? undefined : { scale: [1, 1.03, 1] }}
          transition={
            reduce
              ? undefined
              : { duration: 3, repeat: Infinity, ease: "easeInOut" }
          }
        >
          <Image
            src="/onboarding/dopiq-dog3.png"
            alt="Dopiq mascot"
            width={140}
            height={140}
            className="h-[120px] w-[120px] md:h-[140px] md:w-[140px]"
          />
        </motion.div>
      </motion.div>
      <p className="text-sm text-ink-muted">
        Pick your seats. We&rsquo;ll handle the fees.
      </p>
    </div>
  );
}
