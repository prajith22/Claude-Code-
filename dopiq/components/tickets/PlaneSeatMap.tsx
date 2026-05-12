"use client";

import { useEffect, useMemo, useState } from "react";
import { TICKETS_BRAND } from "@/data/tickets";
import type { Seat } from "@/components/tickets/SeatMap";

export type TravelClass = "First" | "Business" | "Economy";

type ClassDef = {
  id: TravelClass;
  color: string;
  bgColor: string;
  multiplier: number;
  rows: number;
  groups: number[]; // seats per cabin block, separated by aisles
};

// Layout per brief:
//   First    — 2-2, 3 rows  (12 seats)
//   Business — 2-3-2, 5 rows (35 seats)
//   Economy  — 3-3-3, 20 rows (180 seats)
const CLASSES: ClassDef[] = [
  {
    id: "First",
    color: "#7C3AED",
    bgColor: "#EDE7F6",
    multiplier: 4.6,
    rows: 3,
    groups: [2, 2],
  },
  {
    id: "Business",
    color: "#0284C7",
    bgColor: "#E0F2FE",
    multiplier: 2.2,
    rows: 5,
    groups: [2, 3, 2],
  },
  {
    id: "Economy",
    color: TICKETS_BRAND.emerald,
    bgColor: "#D1FAE5",
    multiplier: 1.0,
    rows: 20,
    groups: [3, 3, 3],
  },
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

const LETTERS = ["A", "B", "C", "D", "E", "F", "G", "H", "J", "K"];

export function buildPlaneSeats(eventId: string, basePrice: number): Seat[] {
  const rng = makeRng(hashSeed(eventId));
  let rowOffset = 1;
  const out: Seat[] = [];

  for (const cls of CLASSES) {
    const tier =
      cls.id === "First"
        ? "Premium"
        : cls.id === "Business"
          ? "Standard"
          : "Budget";
    const tierPrice = Math.round(basePrice * cls.multiplier);
    for (let r = 0; r < cls.rows; r++) {
      const rowNumber = rowOffset + r;
      let letterIdx = 0;
      for (const group of cls.groups) {
        for (let c = 0; c < group; c++) {
          const isWindow =
            (group === cls.groups[0] && c === 0) ||
            (group === cls.groups[cls.groups.length - 1] && c === group - 1);
          // Window seats nudge slightly more expensive
          const posMult = isWindow ? 1.05 : 1;
          const jitter = 1 + (rng() - 0.5) * 0.08;
          const sold = rng() < 0.32;
          out.push({
            id: `${cls.id}-${rowNumber}-${LETTERS[letterIdx]}`,
            section: cls.id,
            row: rowNumber,
            seatNumber: letterIdx + 1,
            tier,
            price: Math.max(35, Math.round(tierPrice * posMult * jitter)),
            sold,
          });
          letterIdx++;
        }
      }
    }
    rowOffset += cls.rows;
  }
  return out;
}

export function PlaneSeatMap({
  eventId,
  basePrice,
  onChange,
}: {
  eventId: string;
  basePrice: number;
  onChange?: (selected: Seat[], total: number) => void;
}) {
  const seats = useMemo(
    () => buildPlaneSeats(eventId, basePrice),
    [eventId, basePrice],
  );
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

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

  let rowOffset = 1;

  return (
    <div
      className="rounded-2xl border bg-white p-4"
      style={{ borderColor: TICKETS_BRAND.creamDeep }}
    >
      {/* Plane nose */}
      <div className="mb-3 flex justify-center">
        <div
          className="rounded-t-full px-8 pb-1 pt-2 text-[10px] font-bold tracking-[0.3em]"
          style={{
            backgroundColor: TICKETS_BRAND.ink,
            color: TICKETS_BRAND.cream,
          }}
        >
          ✈ FRONT
        </div>
      </div>

      {CLASSES.map((cls) => {
        const startRow = rowOffset;
        rowOffset += cls.rows;
        const sectionSeats = seats.filter((s) => s.section === cls.id);
        const cheapest = Math.min(...sectionSeats.map((s) => s.price));
        return (
          <div key={cls.id} className="mb-4 last:mb-0">
            <div
              className="mb-2 flex items-center justify-between rounded-md px-2 py-1"
              style={{ backgroundColor: cls.bgColor }}
            >
              <span
                className="text-[12px] font-bold uppercase tracking-wider"
                style={{ color: cls.color }}
              >
                {cls.id} class
              </span>
              <span className="text-[11px]" style={{ color: cls.color }}>
                from ${cheapest}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              {Array.from({ length: cls.rows }).map((_, rIdx) => {
                const rowNumber = startRow + rIdx;
                const rowSeats = sectionSeats.filter(
                  (s) => s.row === rowNumber,
                );
                let seatIdx = 0;
                return (
                  <div
                    key={rowNumber}
                    className="flex items-center justify-center gap-2"
                  >
                    <span
                      className="w-5 text-right text-[9px] font-mono tabular-nums"
                      style={{ color: TICKETS_BRAND.inkSoft }}
                    >
                      {rowNumber}
                    </span>
                    {cls.groups.map((group, gIdx) => {
                      const items = [];
                      for (let c = 0; c < group; c++) {
                        const seat = rowSeats[seatIdx++];
                        if (!seat) continue;
                        const isSelected = selectedIds.has(seat.id);
                        const isWindow =
                          (gIdx === 0 && c === 0) ||
                          (gIdx === cls.groups.length - 1 && c === group - 1);
                        items.push(
                          <button
                            key={seat.id}
                            type="button"
                            onClick={() => toggle(seat.id)}
                            disabled={seat.sold}
                            title={`${seat.section} · Row ${seat.row} ${LETTERS[seat.seatNumber - 1]} · $${seat.price}`}
                            className="rounded text-[8px] font-bold transition active:scale-95 disabled:cursor-not-allowed"
                            style={{
                              width: 18,
                              height: 18,
                              backgroundColor: seat.sold
                                ? "#E5E7EB"
                                : isSelected
                                  ? cls.color
                                  : cls.bgColor,
                              color: isSelected
                                ? "#fff"
                                : seat.sold
                                  ? "#9CA3AF"
                                  : cls.color,
                              border: `1px solid ${
                                seat.sold
                                  ? "#E5E7EB"
                                  : isSelected
                                    ? cls.color
                                    : isWindow
                                      ? cls.color
                                      : cls.bgColor
                              }`,
                              opacity: isWindow && !seat.sold && !isSelected ? 1 : undefined,
                            }}
                          >
                            {seat.sold ? "" : isSelected ? "✓" : ""}
                          </button>,
                        );
                      }
                      return (
                        <div key={gIdx} className="flex gap-0.5">
                          {items}
                        </div>
                      );
                    })}
                    <span
                      className="w-5 text-left text-[9px] font-mono tabular-nums"
                      style={{ color: TICKETS_BRAND.inkSoft }}
                    >
                      {rowNumber}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      <div
        className="mt-3 flex flex-wrap items-center justify-center gap-3 text-[11px]"
        style={{ color: TICKETS_BRAND.inkSoft }}
      >
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block h-3 w-3 rounded"
            style={{ backgroundColor: "#EDE7F6", border: "1px solid #7C3AED" }}
          />
          First
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block h-3 w-3 rounded"
            style={{ backgroundColor: "#E0F2FE", border: "1px solid #0284C7" }}
          />
          Business
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block h-3 w-3 rounded"
            style={{
              backgroundColor: "#D1FAE5",
              border: `1px solid ${TICKETS_BRAND.emerald}`,
            }}
          />
          Economy
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block h-3 w-3 rounded"
            style={{ backgroundColor: "#E5E7EB", border: "1px solid #E5E7EB" }}
          />
          Sold
        </span>
      </div>
    </div>
  );
}
