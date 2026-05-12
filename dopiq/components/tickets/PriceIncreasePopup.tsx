"use client";

import { motion } from "framer-motion";
import { TICKETS_BRAND } from "@/data/tickets";

/**
 * The "demand surge" pop-up. Single Accept button — no way to decline
 * without forfeiting the seats they just spent the queue grinding for.
 * That's the joke. The increase amount is decided one level up
 * (TicketsCheckout) so the same fees rng can use it.
 */
export function PriceIncreasePopup({
  increase,
  onAccept,
}: {
  increase: number;
  onAccept: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 240, damping: 22 }}
        className="w-full max-w-sm rounded-2xl bg-white p-6 text-center"
      >
        <div className="mb-3 text-5xl" aria-hidden>
          📈
        </div>
        <h3
          className="text-[20px] font-extrabold tracking-tight"
          style={{ color: TICKETS_BRAND.ink }}
        >
          Heads up — prices just went up.
        </h3>
        <p
          className="mt-2 text-[14px] leading-relaxed"
          style={{ color: TICKETS_BRAND.inkSoft }}
        >
          Demand is high. Your seats are now{" "}
          <span className="font-bold" style={{ color: TICKETS_BRAND.ink }}>
            ${increase} more
          </span>{" "}
          than they were 30 seconds ago.
        </p>
        <button
          type="button"
          onClick={onAccept}
          className="mt-5 w-full rounded-xl py-3 text-[14px] font-bold text-white transition active:scale-[0.98]"
          style={{ backgroundColor: TICKETS_BRAND.emerald }}
        >
          Accept new price
        </button>
        <p
          className="mt-3 text-[11px] italic"
          style={{ color: TICKETS_BRAND.inkSoft }}
        >
          This is the only way to keep your seats.
        </p>
      </motion.div>
    </motion.div>
  );
}
