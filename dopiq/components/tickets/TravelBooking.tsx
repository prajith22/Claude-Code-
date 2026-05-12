"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  TICKETS_BRAND,
  type TravelDestination,
  type TravelAirline,
} from "@/data/tickets";
import { PlaneSeatMap } from "@/components/tickets/PlaneSeatMap";
import type { Seat } from "@/components/tickets/SeatMap";
import { formatUSD } from "@/lib/utils";
import { useSimulationGuard } from "@/lib/use-simulation-guard";
import type { PendingPurchase } from "@/components/tickets/TicketsCheckout";

export function TravelBooking({
  destination,
}: {
  destination: TravelDestination;
}) {
  const router = useRouter();
  const [airline, setAirline] = useState<TravelAirline>(destination.airlines[0]);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [total, setTotal] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const { tryRun, modal } = useSimulationGuard();

  async function onContinue() {
    if (seats.length === 0) return;
    setSubmitting(true);
    const allowed = await tryRun(async () => {
      // If the user picked seats across cabins (rare but possible),
      // surface the most-premium class in the receipt header — the
      // fee breakdown still itemizes the full total.
      const cabinRank: Record<string, number> = {
        First: 3,
        Business: 2,
        Economy: 1,
      };
      const topClass = seats.reduce((best, s) =>
        (cabinRank[s.section] ?? 0) > (cabinRank[best.section] ?? 0) ? s : best,
      ).section;

      const pending: PendingPurchase = {
        kind: "travel",
        destinationCity: `${destination.city}, ${destination.country}`,
        airline: airline.name,
        travelClass: topClass,
        date: `${airline.flightDuration} · ${airline.stops === 0 ? "Nonstop" : `${airline.stops} stop${airline.stops === 1 ? "" : "s"}`}`,
        seats: seats.map((s) => ({
          label: `${s.section} · Row ${s.row} ${seatLetter(s.seatNumber)}`,
          section: s.section,
          row: s.row,
          seatNumber: s.seatNumber,
          tier: s.tier,
          price: s.price,
        })),
        subtotal: total,
        reason: `travel:${destination.id}:${airline.name}`,
      };
      sessionStorage.setItem(
        "dopiq-tickets-pending-checkout",
        JSON.stringify(pending),
      );
      router.push("/tickets/checkout");
    });
    if (!allowed) setSubmitting(false);
  }

  const eventId = `${destination.id}__${airline.name.replace(/\s+/g, "")}`;

  return (
    <div
      className="-mx-4 -mt-4 px-4 pb-32 pt-6"
      style={{ backgroundColor: TICKETS_BRAND.cream }}
    >
      <div className="mx-auto max-w-3xl">
        <header
          className="overflow-hidden rounded-2xl"
          style={{ backgroundColor: destination.bgColor }}
        >
          <div className="flex items-center gap-4 px-5 py-6">
            <div className="text-6xl" aria-hidden>
              {destination.emoji}
            </div>
            <div>
              <div
                className="text-[11px] font-bold uppercase tracking-wider"
                style={{ color: destination.fgColor }}
              >
                {destination.country}
              </div>
              <h1
                className="mt-1 text-[26px] font-extrabold leading-tight tracking-tight"
                style={{ color: TICKETS_BRAND.ink }}
              >
                {destination.city}
              </h1>
              <p
                className="mt-1 text-[13px] italic"
                style={{ color: destination.fgColor }}
              >
                {destination.tagline}
              </p>
            </div>
          </div>
        </header>

        <section className="mt-6">
          <h2
            className="text-[13px] font-bold uppercase tracking-wider"
            style={{ color: TICKETS_BRAND.inkSoft }}
          >
            Pick an airline
          </h2>
          <div className="mt-2 flex flex-col gap-2">
            {destination.airlines.map((al) => {
              const active = al.name === airline.name;
              return (
                <button
                  key={al.name}
                  type="button"
                  onClick={() => setAirline(al)}
                  className="rounded-xl border px-4 py-3 text-left transition"
                  style={{
                    backgroundColor: active ? TICKETS_BRAND.emerald : "#fff",
                    color: active ? "#fff" : TICKETS_BRAND.ink,
                    borderColor: active
                      ? TICKETS_BRAND.emerald
                      : TICKETS_BRAND.creamDeep,
                  }}
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <div className="text-[14px] font-bold">{al.name}</div>
                    <div className="text-[14px] font-extrabold tabular-nums">
                      ${al.basePrice}
                    </div>
                  </div>
                  <div
                    className="mt-0.5 text-[11px]"
                    style={{
                      color: active ? "#D1FAE5" : TICKETS_BRAND.inkSoft,
                    }}
                  >
                    {al.flightDuration} ·{" "}
                    {al.stops === 0
                      ? "Nonstop"
                      : `${al.stops} stop${al.stops === 1 ? "" : "s"}`}{" "}
                    · Economy base
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section className="mt-5">
          <h2
            className="text-[13px] font-bold uppercase tracking-wider"
            style={{ color: TICKETS_BRAND.inkSoft }}
          >
            Pick your seats
          </h2>
          <div className="mt-2">
            <PlaneSeatMap
              eventId={eventId}
              basePrice={airline.basePrice}
              onChange={(sel, t) => {
                setSeats(sel);
                setTotal(t);
              }}
            />
          </div>
        </section>
      </div>

      <div
        className="fixed inset-x-0 bottom-0 z-30 border-t bg-white px-4 pb-[max(env(safe-area-inset-bottom),12px)] pt-3"
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

const LETTERS = ["A", "B", "C", "D", "E", "F", "G", "H", "J", "K"];
function seatLetter(n: number): string {
  return LETTERS[n - 1] ?? String(n);
}
