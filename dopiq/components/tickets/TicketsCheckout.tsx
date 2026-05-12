"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { WaitingRoom } from "./WaitingRoom";
import { FeeBreakdown, computeFees } from "./FeeBreakdown";
import { TICKETS_BRAND } from "@/data/tickets";
import { formatUSD } from "@/lib/utils";
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
 * The full Tickets checkout flow. Renders a WaitingRoom, then the
 * itemized FeeBreakdown with a Complete Purchase CTA. On commit it
 * records to /api/savings/record exactly like Shop / Food and
 * routes to the shared /tickets/confirmed receipt.
 *
 * One-time gating (useSimulationGuard) lives upstream on the booking
 * page's Continue button — by the time we get here the sim slot is
 * already consumed, so this component doesn't re-gate.
 */
export function TicketsCheckout({ pending }: { pending: PendingPurchase }) {
  const router = useRouter();
  const bumpSavings = useSavingsStore((s) => s.bump);

  const [stage, setStage] = useState<Stage>("queue");

  const fees = useMemo(
    () => computeFees(pending.subtotal, hashSeed(pending.reason)),
    [pending.subtotal, pending.reason],
  );

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
      className="-mx-4 -mt-4 min-h-screen px-4 pb-32 pt-6"
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
          className="mt-4 rounded-2xl bg-white p-4 text-[13px]"
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
        className="fixed inset-x-0 bottom-0 z-30 border-t bg-white px-4 pb-[max(env(safe-area-inset-bottom),12px)] pt-3"
        style={{ borderColor: TICKETS_BRAND.creamDeep }}
      >
        <div className="mx-auto flex max-w-md items-center gap-3">
          <div className="flex-1">
            <div
              className="text-[11px]"
              style={{ color: TICKETS_BRAND.inkSoft }}
            >
              Total
            </div>
            <div
              className="text-[20px] font-extrabold tabular-nums"
              style={{ color: TICKETS_BRAND.ink }}
            >
              {formatUSD(fees.total)}
            </div>
          </div>
          <button
            type="button"
            onClick={onCompletePurchase}
            disabled={stage === "submitting"}
            className="rounded-xl px-5 py-3 text-[14px] font-bold transition active:scale-[0.98] disabled:opacity-50"
            style={{ backgroundColor: TICKETS_BRAND.emerald, color: "#fff" }}
          >
            {stage === "submitting" ? "Saving…" : "Complete Purchase"}
          </button>
        </div>
      </div>
    </div>
  );
}
