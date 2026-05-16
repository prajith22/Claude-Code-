"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { WaitingRoom } from "./WaitingRoom";
import {
  FeeBreakdown,
  computeFees,
  TOTAL_REVEAL_DELAY_S,
  TOTAL_COUNT_DURATION_S,
} from "./FeeBreakdown";
import { TICKETS_BRAND } from "@/data/tickets";
import { formatUSD } from "@/lib/utils";
import { AnimatedAmount } from "@/components/AnimatedAmount";
import { useSavingsStore } from "@/lib/savings-store";

export type PendingPurchase = {
  kind: "concert" | "sports" | "travel";
  artistName?: string;
  teamHome?: string;
  teamAway?: string;
  destinationCity?: string;
  airline?: string;
  travelClass?: string;
  venue?: string;
  city?: string;
  date?: string;
  seats: Array<{
    label: string;
    section: string;
    row: number;
    seatNumber: number;
    tier: string;
    price: number;
  }>;
  subtotal: number;
  reason: string;
};

type Stage = "queue" | "breakdown" | "submitting";

function todayDateStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function hashSeed(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h) || 1;
}

/**
 * The full Tickets checkout flow. Renders a WaitingRoom (for
 * concerts + sports), then the itemized FeeBreakdown with a Complete
 * Purchase CTA. On commit it records to /api/savings/record exactly
 * like Shop / Food and routes to the shared /tickets/confirmed
 * receipt.
 *
 * Travel skips the queue: booking a flight doesn't share the
 * Ticketmaster-style queue-ritual that's the joke for concerts and
 * sports, so dropping into the queue would just feel out-of-place.
 *
 * One-time gating (useSimulationGuard) lives upstream on the booking
 * page's Continue button — by the time we get here the sim slot is
 * already consumed, so this component doesn't re-gate.
 */
export function TicketsCheckout({ pending }: { pending: PendingPurchase }) {
  const router = useRouter();
  const bumpSavings = useSavingsStore((s) => s.bump);

  const [stage, setStage] = useState<Stage>(
    pending.kind === "travel" ? "breakdown" : "queue",
  );

  const fees = useMemo(
    () => computeFees(pending.subtotal, hashSeed(pending.reason)),
    [pending.subtotal, pending.reason],
  );

  // Sticky-bar total + wellness amount count up in lockstep with
  // the fee card's stagger. Timers start only once the breakdown
  // is actually on screen (for concerts/sports the WaitingRoom
  // shows first, so gate on stage rather than mount).
  const [revealed, setRevealed] = useState(false);
  const [landed, setLanded] = useState(false);

  useEffect(() => {
    if (stage !== "breakdown") return;
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
  }, [stage]);

  function onQueueComplete() {
    setStage("breakdown");
  }

  async function onCompletePurchase() {
    setStage("submitting");
    sessionStorage.setItem(
      "dopiq-last-tickets-purchase",
      JSON.stringify({ ...pending, subtotal: fees.total }),
    );
    sessionStorage.removeItem("dopiq-tickets-pending-checkout");
    try {
      await fetch("/api/savings/record", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          section: "tickets",
          amount: fees.total,
          reason: pending.reason,
          todayDateStr: todayDateStr(),
        }),
      });
      bumpSavings();
    } catch {}
    router.push("/tickets/confirmed");
  }

  if (stage === "queue") {
    return <WaitingRoom onComplete={onQueueComplete} />;
  }

  return (
    <div
      className="-mx-4 -mt-4 min-h-screen px-4 pb-nav-action pt-6"
      style={{ backgroundColor: TICKETS_BRAND.cream }}
    >
      <div className="mx-auto max-w-md">
        <h1
          className="text-[24px] font-extrabold tracking-tight"
          style={{ color: TICKETS_BRAND.ink }}
        >
          Order summary
        </h1>
        <p
          className="mt-1 text-[13px]"
          style={{ color: TICKETS_BRAND.inkSoft }}
        >
          Review the fees before you commit. (You won&rsquo;t actually be
          charged.)
        </p>

        {/* Tiny purchase summary above the breakdown */}
        <div
          className="surface-tickets mt-4 p-4 text-[13px]"
          style={{
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
            color: TICKETS_BRAND.inkSoft,
          }}
        >
          {pending.artistName && (
            <div className="font-bold" style={{ color: TICKETS_BRAND.ink }}>
              {pending.artistName}
            </div>
          )}
          {pending.teamHome && pending.teamAway && (
            <div className="font-bold" style={{ color: TICKETS_BRAND.ink }}>
              {pending.teamHome} vs {pending.teamAway}
            </div>
          )}
          {pending.destinationCity && (
            <div className="font-bold" style={{ color: TICKETS_BRAND.ink }}>
              {pending.airline} → {pending.destinationCity}
            </div>
          )}
          <div className="mt-0.5">
            {pending.date}
            {pending.venue ? ` · ${pending.venue}` : ""}
            {pending.city && !pending.venue ? ` · ${pending.city}` : ""}
          </div>
          <div className="mt-1">
            {pending.seats.length} seat{pending.seats.length === 1 ? "" : "s"} ·{" "}
            {pending.seats.map((s) => s.label).join(", ")}
          </div>
        </div>

        <div className="mt-4">
          <FeeBreakdown values={fees} />
        </div>
      </div>

      <div
        className="bottom-nav fixed inset-x-0 z-30 border-t bg-white/95 px-4 py-3 backdrop-blur-sm"
        style={{ borderColor: TICKETS_BRAND.creamDeep }}
      >
        <div className="mx-auto max-w-md">
          <div className="flex items-baseline justify-between">
            <span
              className="text-[11px]"
              style={{ color: TICKETS_BRAND.inkSoft }}
            >
              Total
            </span>
            <motion.span
              animate={landed ? { scale: [1, 1.05, 1] } : { scale: 1 }}
              transition={{ duration: 0.3 }}
              className="text-[22px] font-extrabold tabular-nums"
              style={{ color: TICKETS_BRAND.ink, display: "inline-block" }}
            >
              {revealed ? (
                <AnimatedAmount
                  amount={fees.total}
                  duration={TOTAL_COUNT_DURATION_S}
                />
              ) : (
                formatUSD(fees.total)
              )}
            </motion.span>
          </div>
          <button
            type="button"
            onClick={onCompletePurchase}
            disabled={stage === "submitting"}
            className="btn-primary mt-3 w-full"
          >
            {stage === "submitting"
              ? "Saving…"
              : `Save ${formatUSD(fees.total)}`}
          </button>
          <p
            className="mt-2 text-center text-xs italic"
            style={{ color: TICKETS_BRAND.inkSoft }}
          >
            {revealed ? (
              <AnimatedAmount
                amount={fees.total}
                duration={TOTAL_COUNT_DURATION_S}
              />
            ) : (
              formatUSD(fees.total)
            )}{" "}
            kept · Your wallet survived
          </p>
        </div>
      </div>
    </div>
  );
}
