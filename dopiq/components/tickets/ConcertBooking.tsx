"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  TICKETS_BRAND,
  type ConcertArtist,
  type TourDate,
} from "@/data/tickets";
import { SeatMap, type Seat } from "@/components/tickets/SeatMap";
import { DotTexture } from "@/components/DotTexture";
import { formatUSD } from "@/lib/utils";
import { useSimulationGuard } from "@/lib/use-simulation-guard";
import type { PendingPurchase } from "@/components/tickets/TicketsCheckout";

export function ConcertBooking({ artist }: { artist: ConcertArtist }) {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<TourDate>(artist.tourDates[0]);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [total, setTotal] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const { tryRun, modal } = useSimulationGuard();

  async function onContinue() {
    if (seats.length === 0) return;
    setSubmitting(true);
    // Gate at "Continue" so a free user out of slots gets the
    // upgrade modal before they sit through the queue. Savings
    // record + receipt happen inside TicketsCheckout once they
    // Complete Purchase.
    const allowed = await tryRun(async () => {
      const pending: PendingPurchase = {
        kind: "concert",
        artistName: artist.name,
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
        reason: `concert:${artist.id}:${selectedDate.id}`,
      };
      sessionStorage.setItem(
        "dopiq-tickets-pending-checkout",
        JSON.stringify(pending),
      );
      router.push("/tickets/checkout");
    });
    if (!allowed) setSubmitting(false);
  }

  const eventId = `${artist.id}__${selectedDate.id}`;

  return (
    <div
      className="-mx-4 -mt-4 px-4 pb-nav-action pt-6"
      style={{ backgroundColor: TICKETS_BRAND.cream }}
    >
      <div className="mx-auto max-w-3xl">
        {/* Header — keeps the per-entry pastel as the one place each
            artist's color identity lives, anchored by the warm-dark
            border + a matching darker dot texture so it reads as
            part of the bordered-card system used on /home and the
            wheel result card. */}
        <header
          className="relative overflow-hidden rounded-2xl border-[2.5px]"
          style={{
            backgroundColor: artist.bgColor,
            borderColor: "#2A1F18",
          }}
        >
          <DotTexture style={{ color: artist.fgColor }} />
          <div className="relative flex items-center gap-4 px-5 py-6">
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

      {/* Sticky CTA bar — anchored above the BottomNav on mobile via
          the .bottom-nav utility (CSS var resolves to 3.5rem + the
          home-indicator inset on iOS, and to 0 above md where the
          nav is hidden). Same pattern as AddToCartControls /
          RestaurantCheckoutBar / BetSlipPanel — they all sit above
          the nav without z-fighting it. */}
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
