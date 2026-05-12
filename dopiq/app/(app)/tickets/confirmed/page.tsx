"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import { formatUSD } from "@/lib/utils";
import { TICKETS_BRAND } from "@/data/tickets";
import { playDing } from "@/lib/sounds";

type LastTicketsPurchase = {
  kind: "concert" | "sports" | "travel";
  artistName?: string;
  teamHome?: string;
  teamAway?: string;
  destinationCity?: string;
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
};

const RECEIPT_PUNCHLINES: Record<LastTicketsPurchase["kind"], (p: LastTicketsPurchase) => string> = {
  concert: (p) => {
    const seat = p.seats[0];
    const rowLabel = seat ? `row ${seat.row}` : "the back";
    return `scream at ${p.artistName ?? "someone"} from ${rowLabel}`;
  },
  sports: (p) =>
    `watch the ${p.teamHome ?? "home team"} lose in person`,
  travel: () =>
    `fly first class somewhere you'd just sleep the whole way`,
};

export default function TicketsConfirmedPage() {
  const [purchase, setPurchase] = useState<LastTicketsPurchase | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("dopiq-last-tickets-purchase");
    if (raw) {
      try {
        setPurchase(JSON.parse(raw));
      } catch {}
    }

    playDing();

    const duration = 1600;
    const end = Date.now() + duration;
    const colors = [TICKETS_BRAND.emerald, TICKETS_BRAND.ink, "#ffffff"];
    const frame = () => {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 70,
        origin: { x: 0, y: 0.7 },
        colors,
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 70,
        origin: { x: 1, y: 0.7 },
        colors,
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  }, []);

  const punchline =
    purchase && purchase.kind in RECEIPT_PUNCHLINES
      ? RECEIPT_PUNCHLINES[purchase.kind as keyof typeof RECEIPT_PUNCHLINES](
          purchase,
        )
      : "";

  return (
    <div
      className="-mx-4 -mt-4 min-h-screen px-4 pt-10 pb-8"
      style={{ backgroundColor: TICKETS_BRAND.cream }}
    >
      <div className="mx-auto max-w-md">
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 18 }}
          className="mx-auto flex h-16 w-16 items-center justify-center rounded-full"
          style={{ backgroundColor: TICKETS_BRAND.emerald }}
        >
          <span className="text-3xl text-white">✓</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-4 text-center text-[24px] font-extrabold tracking-tight"
          style={{ color: TICKETS_BRAND.ink }}
        >
          You almost spent
        </motion.h1>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-1 text-center text-[44px] font-extrabold tabular-nums"
          style={{ color: TICKETS_BRAND.emerald }}
        >
          {purchase ? formatUSD(purchase.subtotal) : "—"}
        </motion.div>
        {punchline && (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-2 text-center text-[15px]"
            style={{ color: TICKETS_BRAND.inkSoft }}
          >
            to {punchline}.
          </motion.p>
        )}

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-6 rounded-2xl bg-white p-5"
          style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}
        >
          {purchase ? (
            <>
              {purchase.artistName && (
                <Receipt label="Show" value={purchase.artistName} />
              )}
              {purchase.teamHome && purchase.teamAway && (
                <Receipt
                  label="Match"
                  value={`${purchase.teamHome} vs ${purchase.teamAway}`}
                />
              )}
              {purchase.destinationCity && (
                <Receipt label="Destination" value={purchase.destinationCity} />
              )}
              {purchase.date && <Receipt label="Date" value={purchase.date} />}
              {purchase.venue && <Receipt label="Venue" value={purchase.venue} />}
              {purchase.city && <Receipt label="City" value={purchase.city} />}
              <Receipt
                label={`Seats (${purchase.seats.length})`}
                value={purchase.seats.map((s) => s.label).join(", ") || "—"}
              />
            </>
          ) : (
            <p className="text-center text-[13px]" style={{ color: TICKETS_BRAND.inkSoft }}>
              Receipt not found. Money still saved.
            </p>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-6 flex flex-col gap-2"
        >
          <Link
            href="/tickets"
            className="rounded-xl py-3 text-center text-[14px] font-bold text-white"
            style={{ backgroundColor: TICKETS_BRAND.ink }}
          >
            Back to Tickets
          </Link>
          <Link
            href="/home"
            className="rounded-xl border bg-white py-3 text-center text-[14px] font-bold"
            style={{
              borderColor: TICKETS_BRAND.creamDeep,
              color: TICKETS_BRAND.ink,
            }}
          >
            Home
          </Link>
        </motion.div>
      </div>
    </div>
  );
}

function Receipt({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 py-2 first:pt-0 last:pb-0">
      <div
        className="text-[12px] uppercase tracking-wider"
        style={{ color: TICKETS_BRAND.inkSoft }}
      >
        {label}
      </div>
      <div
        className="text-right text-[13px] font-semibold"
        style={{ color: TICKETS_BRAND.ink }}
      >
        {value}
      </div>
    </div>
  );
}
