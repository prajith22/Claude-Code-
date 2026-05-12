"use client";

import { useMemo, useState, useEffect } from "react";
import { TICKETS_BRAND } from "@/data/tickets";

export type SeatTier = "Premium" | "Standard" | "Budget";

export type Seat = {
  id: string;
  section: string;
  row: number;
  seatNumber: number;
  tier: SeatTier;
  price: number;
  sold: boolean;
};

type SectionDef = {
  label: string;
  tier: SeatTier;
  multiplier: number;
  rows: number;
  cols: number;
  badge?: string;
};

// Layout — same for every event so the UI stays predictable. The
// per-event seed varies which specific seats sell out and the
// per-seat price jitter, so each show still feels distinct.
const SECTIONS: SectionDef[] = [
  {
    label: "Floor A",
    tier: "Premium",
    multiplier: 3.6,
    rows: 3,
    cols: 8,
    badge: "🔥 Almost gone!",
  },
  { label: "Lower Bowl 102", tier: "Standard", multiplier: 1.6, rows: 4, cols: 10 },
  {
    label: "Upper Deck 305",
    tier: "Standard",
    multiplier: 1.2,
    rows: 4,
    cols: 10,
    badge: "Resale — 312% markup",
  },
  { label: "Nosebleeds 414", tier: "Budget", multiplier: 0.65, rows: 3, cols: 12 },
];

function hashSeed(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h) || 1;
}

function makeRng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

export function buildSeats(eventId: string, basePrice: number): Seat[] {
  const rng = makeRng(hashSeed(eventId));
  const out: Seat[] = [];
  for (const sec of SECTIONS) {
    const tierPrice = Math.round(basePrice * sec.multiplier);
    for (let r = 1; r <= sec.rows; r++) {
      for (let c = 1; c <= sec.cols; c++) {
        const sold = rng() < 0.3;
        const jitter = 1 + (rng() - 0.5) * 0.1;
        out.push({
          id: `${sec.label.replace(/\s+/g, "")}-R${r}-S${c}`,
          section: sec.label,
          row: r,
          seatNumber: c,
          tier: sec.tier,
          price: Math.max(15, Math.round(tierPrice * jitter)),
          sold,
        });
      }
    }
  }
  return out;
}

/** Surface label rendered above the seat map. "STAGE" for concerts,
 *  "FIELD" for sports, etc. Lets one component serve every event type. */
export type SeatMapSurfaceLabel = "STAGE" | "FIELD" | "COURT" | "ICE" | "TRACK";

export function SeatMap({
  eventId,
  basePrice,
  surfaceLabel = "STAGE",
  accentColor = TICKETS_BRAND.emerald,
  onChange,
}: {
  eventId: string;
  basePrice: number;
  surfaceLabel?: SeatMapSurfaceLabel;
  accentColor?: string;
  onChange?: (selected: Seat[], total: number) => void;
}) {
  const seats = useMemo(
    () => buildSeats(eventId, basePrice),
    [eventId, basePrice],
  );

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Reset selection when the event changes (user picks a different
  // tour date). Without this, switching dates would keep the old
  // seat ids highlighted in the new map.
  useEffect(() => {
    setSelectedIds(new Set());
    onChange?.([], 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  function toggle(id: string) {
    const seat = seats.find((s) => s.id === id);
    if (!seat || seat.sold) return;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      const selected = seats.filter((s) => next.has(s.id));
      const total = selected.reduce((sum, s) => sum + s.price, 0);
      onChange?.(selected, total);
      return next;
    });
  }

  return (
    <div
      className="rounded-2xl border p-4"
      style={{ borderColor: TICKETS_BRAND.creamDeep, backgroundColor: "#fff" }}
    >
      <div className="mb-4 flex justify-center">
        <div
          className="rounded-md px-8 py-1.5 text-[11px] font-bold tracking-[0.3em]"
          style={{
            backgroundColor: TICKETS_BRAND.ink,
            color: TICKETS_BRAND.cream,
          }}
        >
          {surfaceLabel}
        </div>
      </div>

      {SECTIONS.map((sec) => {
        const sectionSeats = seats.filter((s) => s.section === sec.label);
        const cheapest = Math.min(...sectionSeats.map((s) => s.price));
        return (
          <div key={sec.label} className="mb-5 last:mb-0">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <h4
                className="text-[13px] font-bold"
                style={{ color: TICKETS_BRAND.ink }}
              >
                {sec.label}
              </h4>
              <span
                className="text-[11px]"
                style={{ color: TICKETS_BRAND.inkSoft }}
              >
                {sec.tier} · from ${cheapest}
              </span>
              {sec.badge && (
                <span
                  className="ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold"
                  style={{ backgroundColor: "#FFEDD5", color: "#9A3412" }}
                >
                  {sec.badge}
                </span>
              )}
            </div>
            <div
              className="grid gap-1"
              style={{
                gridTemplateColumns: `repeat(${sec.cols}, minmax(0, 1fr))`,
              }}
            >
              {sectionSeats.map((seat) => {
                const isSelected = selectedIds.has(seat.id);
                return (
                  <button
                    key={seat.id}
                    type="button"
                    onClick={() => toggle(seat.id)}
                    disabled={seat.sold}
                    aria-label={`${seat.section} row ${seat.row} seat ${seat.seatNumber}, $${seat.price}${seat.sold ? ", sold" : ""}`}
                    title={`${seat.section} · R${seat.row} S${seat.seatNumber} · $${seat.price}`}
                    className="aspect-square rounded-md text-[9px] font-bold transition active:scale-95 disabled:cursor-not-allowed"
                    style={{
                      backgroundColor: seat.sold
                        ? "#E5E7EB"
                        : isSelected
                          ? accentColor
                          : TICKETS_BRAND.cream,
                      color: isSelected
                        ? "#fff"
                        : seat.sold
                          ? "#9CA3AF"
                          : TICKETS_BRAND.ink,
                      border: `1px solid ${
                        seat.sold
                          ? "#E5E7EB"
                          : isSelected
                            ? accentColor
                            : TICKETS_BRAND.creamDeep
                      }`,
                    }}
                  >
                    {seat.sold ? "" : isSelected ? "✓" : seat.seatNumber}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      <div
        className="mt-4 flex flex-wrap items-center justify-center gap-3 text-[11px]"
        style={{ color: TICKETS_BRAND.inkSoft }}
      >
        <Swatch
          color={TICKETS_BRAND.cream}
          border={TICKETS_BRAND.creamDeep}
          label="Available"
        />
        <Swatch color={accentColor} border={accentColor} label="Selected" />
        <Swatch color="#E5E7EB" border="#E5E7EB" label="Sold" />
      </div>
    </div>
  );
}

function Swatch({
  color,
  border,
  label,
}: {
  color: string;
  border: string;
  label: string;
}) {
  return (
    <span className="flex items-center gap-1.5">
      <span
        className="inline-block h-3 w-3 rounded"
        style={{ backgroundColor: color, border: `1px solid ${border}` }}
      />
      {label}
    </span>
  );
}
