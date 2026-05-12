"use client";

import { formatUSD } from "@/lib/utils";
import { TICKETS_BRAND } from "@/data/tickets";

export type FeeBreakdownValues = {
  faceValue: number;
  serviceFee: number;
  convenienceFee: number;
  facilityFee: number;
  processingFee: number;
  deliveryFee: number;
  total: number;
};

/**
 * Computes the itemized fee stack on top of face value:
 *   - Service Fee: 30–40% of face value (the big one)
 *   - Convenience Fee: $8–15 flat
 *   - Facility Fee: $5–12 flat
 *   - Order Processing: $4–7 flat
 *   - Delivery Fee: $3–5 flat ("for an email")
 *
 * `seed` is hashed off the purchase reason so the same purchase
 * shows the same fees on rerender — but two purchases of the same
 * artist on different dates get different gouging.
 */
export function computeFees(
  faceValue: number,
  seed: number,
): FeeBreakdownValues {
  const rng = (n: number) => {
    const x = ((seed + n) * 9301 + 49297) % 233280;
    return x / 233280;
  };
  const servicePct = 0.3 + rng(1) * 0.1;
  const serviceFee = Math.round(faceValue * servicePct);
  const convenienceFee = 8 + Math.floor(rng(2) * 8);
  const facilityFee = 5 + Math.floor(rng(3) * 8);
  const processingFee = 4 + Math.floor(rng(4) * 4);
  const deliveryFee = 3 + Math.floor(rng(5) * 3);
  const total =
    faceValue +
    serviceFee +
    convenienceFee +
    facilityFee +
    processingFee +
    deliveryFee;
  return {
    faceValue,
    serviceFee,
    convenienceFee,
    facilityFee,
    processingFee,
    deliveryFee,
    total,
  };
}

export function FeeBreakdown({ values }: { values: FeeBreakdownValues }) {
  return (
    <div
      className="rounded-2xl bg-white p-5"
      style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}
    >
      <Row label="Face value" value={values.faceValue} />
      <Row
        label="Service Fee"
        value={values.serviceFee}
        hint="non-refundable, of course"
      />
      <Row label="Convenience Fee" value={values.convenienceFee} />
      <Row
        label="Facility Fee"
        value={values.facilityFee}
        hint="goes to the venue (allegedly)"
      />
      <Row label="Order Processing" value={values.processingFee} />
      <Row label="Delivery Fee" value={values.deliveryFee} hint="for an email" />
      <div
        className="my-3 border-t"
        style={{ borderColor: TICKETS_BRAND.creamDeep }}
      />
      <Row label="Total" value={values.total} bold />
    </div>
  );
}

function Row({
  label,
  value,
  hint,
  bold,
}: {
  label: string;
  value: number;
  hint?: string;
  bold?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-3 py-1.5">
      <div>
        <div
          className={`text-[14px] ${bold ? "font-extrabold" : "font-medium"}`}
          style={{ color: TICKETS_BRAND.ink }}
        >
          {label}
        </div>
        {hint && (
          <div
            className="text-[10px] italic"
            style={{ color: TICKETS_BRAND.inkSoft }}
          >
            {hint}
          </div>
        )}
      </div>
      <div
        className={`tabular-nums text-[14px] ${bold ? "font-extrabold" : "font-semibold"}`}
        style={{ color: TICKETS_BRAND.ink }}
      >
        {formatUSD(value)}
      </div>
    </div>
  );
}
