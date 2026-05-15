"use client";

import { animate, motion, useInView } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { formatUSD } from "@/lib/utils";

/**
 * Hero dollar-amount display: scales + fades in on mount, then
 * counts the value up from $0 over 800ms once it scrolls into view
 * (or immediately for above-the-fold instances).
 *
 * Uses formatUSD (Intl currency) rather than a raw toFixed so the
 * count-up keeps the app's thousands separators — "$2,159.21"
 * stays grouped while it ticks, matching every other money value.
 *
 * `className` is passed through so callers keep their existing
 * size / weight / color utilities on the number itself.
 */
export function AnimatedAmount({
  amount,
  className,
}: {
  amount: number;
  className?: string;
}) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, amount, {
      duration: 0.8,
      ease: "easeOut",
      onUpdate: (value) => setDisplay(value),
    });
    return () => controls.stop();
  }, [inView, amount]);

  return (
    <motion.span
      ref={ref}
      initial={{ scale: 0.92, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={className}
      style={{ display: "inline-block" }}
    >
      {formatUSD(display)}
    </motion.span>
  );
}
