"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  TICKETS_BRAND,
  type ConcertArtist,
  type TourDate,
} from "@/data/tickets";
import { SeatMap, type Seat } from "@/components/tickets/SeatMap";
import { formatUSD } from "@/lib/utils";
import { useSimulationGuard } from "@/lib/use-simulation-guard";
import { useSavingsStore } from "@/lib/savings-store";

function todayDateStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function ConcertBooking({ artist }: { artist: ConcertArtist }) {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<TourDate>(artist.tourDates[0]);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [total, setTotal] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const { tryRun, modal } = useSimulationGuard();
  const bumpSavings = useSavingsStore((s) => s.bump);

  async function onContinue() {
    if (seats.length === 0) return;
    setSubmitting(true);
    const allowed = await tryRun(async () => {
      // Stash the selection so the (still-to-be-built) full checkout
      // can pick it up — for now this records straight to savings
      // and routes to the receipt. Step 5 will replace the receipt
      // with the WaitingRoom → PriceIncrease → FeeBreakdown chain.
      sessionStorage.setItem(
        "dopiq-last-tickets-purchase",
        JSON.stringify({
          kind: "concert",
          artistName: artist.name,
          tourDateId: selectedDate.id,
          venue: selectedDate.venue,
          city: selectedDate.city,
          date: selectedDate.date,
          seats: seats.map((s) => ({
            label: `${s.section} R${s.row} S${s.seatNumber}`,
            section: s.section,
            row: s.row,
            seatNumber: s.seatNumber,
            tier: s.tier,
            price: s.price,
          })),
          subtotal: total,
        }),
      );
      fetch("/api/savings/record", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          section: "tickets",
          amount: total,
          reason: `concert:${artist.id}`,
          todayDateStr: todayDateStr(),
        }),
      })
        .then(() => bumpSavings())
        .catch(() => {});
      router.push("/tickets/confirmed");
    });
    if (!allowed) setSubmitting(false);
  }

  const eventId = `${artist.id}__${selectedDate.id}`;

  return (
    <div
      className="-mx-4 -mt-4 px-4 pb-32 pt-6"
      style={{ backgroundColor: TICKETS_BRAND.cream }}
    >
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <header
          className="overflow-hidden rounded-2xl"
          style={{ backgroundColor: artist.bgColor }}
        >
          <div className="flex items-center gap-4 px-5 py-6">
            <div className="text-6xl" aria-hidden>
              {artist.emoji}
            </div>
            <div>
              <div
                className="text-[11px] font-bold uppercase tracking-wider"
                style={{ color: artist.fgColor }}
              >
                {artist.genre}
              </div>
              <h1
                className="mt-1 text-[26px] font-extrabold leading-tight tracking-tight"
                style={{ color: TICKETS_BRAND.ink }}
              >
                {artist.name}
              </h1>
              <p
                className="mt-1 text-[14px] italic"
                style={{ color: artist.fgColor }}
              >
                {artist.tagline}
              </p>
            </div>
          </div>
        </header>

        {/* Tour date picker */}
        <section className="mt-6">
          <h2
            className="text-[13px] font-bold uppercase tracking-wider"
            style={{ color: TICKETS_BRAND.inkSoft }}
          >
            Pick a date
          </h2>
          <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
            {artist.tourDates.map((td) => {
              const active = td.id === selectedDate.id;
              return (
                <button
                  key={td.id}
                  type="button"
                  onClick={() => setSelectedDate(td)}
                  className="shrink-0 rounded-xl border px-4 py-3 text-left transition"
                  style={{
                    backgroundColor: active ? TICKETS_BRAND.emerald : "#fff",
                    color: active ? "#fff" : TICKETS_BRAND.ink,
                    borderColor: active
                      ? TICKETS_BRAND.emerald
                      : TICKETS_BRAND.creamDeep,
                  }}
                >
                  <div className="text-[13px] font-bold">{td.date}</div>
                  <div
                    className="text-[11px]"
                    style={{ color: active ? "#D1FAE5" : TICKETS_BRAND.inkSoft }}
                  >
                    {td.city}
                  </div>
                  <div
                    className="mt-0.5 text-[10px]"
                    style={{ color: active ? "#D1FAE5" : TICKETS_BRAND.inkSoft }}
                  >
                    {td.venue}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Seat map */}
        <section className="mt-5">
          <h2
            className="text-[13px] font-bold uppercase tracking-wider"
            style={{ color: TICKETS_BRAND.inkSoft }}
          >
            Pick your seats
          </h2>
          <div className="mt-2">
            <SeatMap
              eventId={eventId}
              basePrice={artist.basePrice}
              surfaceLabel="STAGE"
              onChange={(sel, t) => {
                setSeats(sel);
                setTotal(t);
              }}
            />
          </div>
        </section>
      </div>

      {/* Sticky CTA bar */}
      <div
        className="fixed inset-x-0 bottom-0 z-30 border-t bg-white px-4 pb-[max(env(safe-area-inset-bottom),12px)] pt-3 md:bottom-0"
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
            style={{
              backgroundColor: TICKETS_BRAND.emerald,
              color: "#fff",
            }}
          >
            {submitting ? "Processing…" : "Continue"}
          </button>
        </div>
      </div>

      {modal}
    </div>
  );
}
