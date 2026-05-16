"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { formatUSD } from "@/lib/utils";
import { TICKETS_BRAND } from "@/data/tickets";
import { AnimatedAmount } from "@/components/AnimatedAmount";

export type FeeBreakdownValues = {
  faceValue: number;
  serviceFee: number;
  convenienceFee: number;
  facilityFee: number;
  processingFee: number;
  deliveryFee: number;
  total: number;
};

/**
 * Computes the itemized fee stack on top of face value:
 *   - Service Fee: 30–40% of face value (the big one)
 *   - Convenience Fee: $8–15 flat
 *   - Facility Fee: $5–12 flat
 *   - Order Processing: $4–7 flat
 *   - Delivery Fee: $3–5 flat ("for an email")
 *
 * `seed` is hashed off the purchase reason so the same purchase
 * shows the same fees on rerender — but two purchases of the same
 * artist on different dates get different gouging.
 */
export function computeFees(
  faceValue: number,
  seed: number,
): FeeBreakdownValues {
  const rng = (n: number) => {
    const x = ((seed + n) * 9301 + 49297) % 233280;
    return x / 233280;
  };
  const servicePct = 0.3 + rng(1) * 0.1;
  const serviceFee = Math.round(faceValue * servicePct);
  const convenienceFee = 8 + Math.floor(rng(2) * 8);
  const facilityFee = 5 + Math.floor(rng(3) * 8);
  const processingFee = 4 + Math.floor(rng(4) * 4);
  const deliveryFee = 3 + Math.floor(rng(5) * 3);
  const total =
    faceValue +
    serviceFee +
    convenienceFee +
    facilityFee +
    processingFee +
    deliveryFee;
  return {
    faceValue,
    serviceFee,
    convenienceFee,
    facilityFee,
    processingFee,
    deliveryFee,
    total,
  };
}

// Stagger choreography. Face value is the static base; the 5 fees
// slide in one at a time; the Total reveals after the last fee.
// Exported so TicketsCheckout's sticky-bar total counts up in sync
// with the fee card's.
const FEE_COUNT = 5;
const STAGGER_BASE_S = 0.4;
const STAGGER_STEP_S = 0.35;
export const TOTAL_REVEAL_DELAY_S =
  STAGGER_BASE_S + FEE_COUNT * STAGGER_STEP_S + 0.2; // 2.35s
export const TOTAL_COUNT_DURATION_S = 1.6;

export function FeeBreakdown({ values }: { values: FeeBreakdownValues }) {
  const ref = useRef<HTMLDivElement>(null);
  // once: true — the choreography is a moment that happened, not a
  // loop. Re-renders won't replay it (framer initial→animate fires
  // once per mount; the timers are gated on first in-view).
  const inView = useInView(ref, { once: true });
  const [revealed, setRevealed] = useState(false);
  const [landed, setLanded] = useState(false);

  useEffect(() => {
    if (!inView) return;
    const t1 = setTimeout(
      () => setRevealed(true),
      TOTAL_REVEAL_DELAY_S * 1000,
    );
    const t2 = setTimeout(
      () => setLanded(true),
      (TOTAL_REVEAL_DELAY_S + TOTAL_COUNT_DURATION_S) * 1000,
    );
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [inView]);

  const fees: Array<{ label: string; value: number; hint?: string }> = [
    {
      label: "Service Fee",
      value: values.serviceFee,
      hint: "non-refundable, of course",
    },
    { label: "Convenience Fee", value: values.convenienceFee },
    {
      label: "Facility Fee",
      value: values.facilityFee,
      hint: "goes to the venue (allegedly)",
    },
    { label: "Order Processing", value: values.processingFee },
    { label: "Delivery Fee", value: values.deliveryFee, hint: "for an email" },
  ];

  return (
    <div
      ref={ref}
      className="surface-tickets p-5"
      style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}
    >
      {/* Face value — static base, no animation. */}
      <Row label="Face value" value={values.faceValue} />

      {fees.map((f, i) => (
        <motion.div
          key={f.label}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.3,
            delay: STAGGER_BASE_S + i * STAGGER_STEP_S,
          }}
        >
          <Row label={f.label} value={f.value} hint={f.hint} />
        </motion.div>
      ))}

      {/* Total — reveals after the last fee; the amount counts up
          (1.6s) the moment it appears, then pulse-scales once. */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: TOTAL_REVEAL_DELAY_S }}
      >
        <div
          className="my-3 border-t"
          style={{ borderColor: TICKETS_BRAND.creamDeep }}
        />
        <div className="flex items-start justify-between gap-3 py-1.5">
          <div
            className="text-[14px] font-extrabold"
            style={{ color: TICKETS_BRAND.ink }}
          >
            Total
          </div>
          <motion.div
            animate={landed ? { scale: [1, 1.05, 1] } : { scale: 1 }}
            transition={{ duration: 0.3 }}
            className="tabular-nums text-[14px] font-extrabold"
            style={{ color: TICKETS_BRAND.ink, display: "inline-block" }}
          >
            {revealed ? (
              <AnimatedAmount
                amount={values.total}
                duration={TOTAL_COUNT_DURATION_S}
              />
            ) : (
              formatUSD(values.total)
            )}
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

function Row({
  label,
  value,
  hint,
  bold,
}: {
  label: string;
  value: number;
  hint?: string;
  bold?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-3 py-1.5">
      <div>
        <div
          className={`text-[14px] ${bold ? "font-extrabold" : "font-medium"}`}
          style={{ color: TICKETS_BRAND.ink }}
        >
          {label}
        </div>
        {hint && (
          <div
            className="font-playful text-[10px] italic"
            style={{ color: TICKETS_BRAND.inkSoft }}
          >
            {hint}
          </div>
        )}
      </div>
      <div
        className={`tabular-nums text-[14px] ${bold ? "font-extrabold" : "font-semibold"}`}
        style={{ color: TICKETS_BRAND.ink }}
      >
        {formatUSD(value)}
      </div>
    </div>
  );
}
