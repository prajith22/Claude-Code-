"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  TICKETS_BRAND,
  type SportsGame,
  type SportName,
} from "@/data/tickets";
import {
  SeatMap,
  type Seat,
  type SeatMapSurfaceLabel,
} from "@/components/tickets/SeatMap";
import { formatUSD } from "@/lib/utils";
import { useSimulationGuard } from "@/lib/use-simulation-guard";
import type { PendingPurchase } from "@/components/tickets/TicketsCheckout";

// Per-sport surface label so the seat map says FIELD for football,
// COURT for basketball, etc. — pure cosmetic, the map underneath
// is the same.
const SURFACE_BY_SPORT: Record<SportName, SeatMapSurfaceLabel> = {
  Football: "FIELD",
  Soccer: "FIELD",
  Baseball: "FIELD",
  Basketball: "COURT",
  Hockey: "ICE",
  Racing: "TRACK",
  Fighting: "STAGE",
};

export function SportsBooking({ game }: { game: SportsGame }) {
  const router = useRouter();
  const [seats, setSeats] = useState<Seat[]>([]);
  const [total, setTotal] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const { tryRun, modal } = useSimulationGuard();

  async function onContinue() {
    if (seats.length === 0) return;
    setSubmitting(true);
    const allowed = await tryRun(async () => {
      const pending: PendingPurchase = {
        kind: "sports",
        teamHome: game.homeTeam,
        teamAway: game.awayTeam,
        venue: game.venue,
        city: game.city,
        date: game.date,
        seats: seats.map((s) => ({
          label: `${s.section} R${s.row} S${s.seatNumber}`,
          section: s.section,
          row: s.row,
          seatNumber: s.seatNumber,
          tier: s.tier,
          price: s.price,
        })),
        subtotal: total,
        reason: `sports:${game.id}`,
      };
      sessionStorage.setItem(
        "dopiq-tickets-pending-checkout",
        JSON.stringify(pending),
      );
      router.push("/tickets/checkout");
    });
    if (!allowed) setSubmitting(false);
  }

  return (
    <div
      className="-mx-4 -mt-4 px-4 pb-nav-action pt-6"
      style={{ backgroundColor: TICKETS_BRAND.cream }}
    >
      <div className="mx-auto max-w-3xl">
        <header
          className="overflow-hidden rounded-2xl"
          style={{ backgroundColor: game.bgColor }}
        >
          <div className="px-5 py-6">
            <div
              className="text-[11px] font-bold uppercase tracking-wider"
              style={{ color: game.fgColor }}
            >
              {game.sport} · {game.date}
            </div>
            <h1
              className="mt-1 text-[24px] font-extrabold leading-tight tracking-tight"
              style={{ color: TICKETS_BRAND.ink }}
            >
              {game.homeTeam}
            </h1>
            <div
              className="text-[14px] font-semibold"
              style={{ color: game.fgColor }}
            >
              vs {game.awayTeam}
            </div>
            <p
              className="mt-2 text-[13px] italic"
              style={{ color: game.fgColor }}
            >
              {game.tagline}
            </p>
            <div
              className="mt-3 text-[12px]"
              style={{ color: game.fgColor }}
            >
              📍 {game.venue} · {game.city}
            </div>
          </div>
        </header>

        <section className="mt-5">
          <h2
            className="text-[13px] font-bold uppercase tracking-wider"
            style={{ color: TICKETS_BRAND.inkSoft }}
          >
            Pick your seats
          </h2>
          <div className="mt-2">
            <SeatMap
              eventId={game.id}
              basePrice={game.basePrice}
              surfaceLabel={SURFACE_BY_SPORT[game.sport]}
              onChange={(sel, t) => {
                setSeats(sel);
                setTotal(t);
              }}
            />
          </div>
        </section>
      </div>

      <div
        className="bottom-nav fixed inset-x-0 z-30 border-t bg-white/95 px-4 py-3 backdrop-blur-sm"
        style={{ borderColor: TICKETS_BRAND.creamDeep }}
      >
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <div className="flex-1">
            <div
              className="text-[11px]"
              style={{ color: TICKETS_BRAND.inkSoft }}
            >
              {seats.length === 0
                ? "No seats selected"
                : `${seats.length} seat${seats.length === 1 ? "" : "s"} · face value`}
            </div>
            <div
              className="text-[20px] font-extrabold tabular-nums"
              style={{ color: TICKETS_BRAND.ink }}
            >
              {formatUSD(total)}
            </div>
          </div>
          <button
            type="button"
            onClick={onContinue}
            disabled={seats.length === 0 || submitting}
            className="rounded-xl px-5 py-3 text-[14px] font-bold transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            style={{ backgroundColor: TICKETS_BRAND.emerald, color: "#fff" }}
          >
            {submitting ? "Processing…" : "Continue"}
          </button>
        </div>
      </div>

      {modal}
    </div>
  );
}
