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
 *
 * `fromCurrent` (default false): when false, every `amount` change
 * re-tweens from $0 (right for one-shot mount reveals on
 * confirmation screens). When true, only the first in-view
 * animation starts at $0; subsequent `amount` changes tween from
 * the currently-displayed value to the new amount — for live totals
 * that adjust as the user toggles items (Quick Sim cart).
 */
export function AnimatedAmount({
  amount,
  className,
  duration = 0.8,
  fromCurrent = false,
}: {
  amount: number;
  className?: string;
  duration?: number;
  fromCurrent?: boolean;
}) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  // Latest tweened value — the start point for value-to-value
  // tweens. Updated every frame so a mid-flight retoggle picks up
  // exactly where the number currently is.
  const displayRef = useRef(0);
  // False until the first in-view animation has run, so the first
  // tween always lifts off from $0 even when fromCurrent is true.
  const startedRef = useRef(false);

  useEffect(() => {
    if (!inView) return;
    const from =
      fromCurrent && startedRef.current ? displayRef.current : 0;
    startedRef.current = true;
    const controls = animate(from, amount, {
      duration,
      ease: "easeOut",
      onUpdate: (value) => {
        displayRef.current = value;
        setDisplay(value);
      },
    });
    return () => controls.stop();
  }, [inView, amount, duration, fromCurrent]);

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
