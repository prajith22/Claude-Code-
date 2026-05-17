"use client";

import Link from "next/link";
import { useCartStore, cartSubtotal } from "@/lib/cart-store";
import { formatUSD } from "@/lib/utils";
import { EmptyCart } from "@/components/EmptyCart";

const DELIVERY_FEE = 1.99;
const SERVICE_FEE = 2.49;

export default function FoodCartPage() {
  const lines = useCartStore((s) => s.food);
  const setQty = useCartStore((s) => s.setQty);
  const remove = useCartStore((s) => s.remove);
  const subtotal = cartSubtotal(lines);
  const total = lines.length > 0 ? subtotal + DELIVERY_FEE + SERVICE_FEE : 0;

  return (
    <div className="space-y-5">
      <h1 className="pt-2 text-[24px] font-semibold tracking-tight">Your order</h1>

      {lines.length === 0 ? (
        <EmptyCart
          mascotSrc="/onboarding/dopiq-dog2.png"
          heading="Order's empty."
          subhead="Pick a spot and add something."
          ctaHref="/food"
          ctaLabel="Browse restaurants"
        />
      ) : (
        <>
          <ul className="space-y-3">
            {lines.map((l) => (
              <li key={l.id} className="surface-food flex items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="line-clamp-1 text-[15px] font-medium">{l.name}</p>
                  {l.meta && (
                    <p className="text-xs text-ink-muted">{l.meta}</p>
                  )}
                  <p className="mt-1 text-[15px] font-semibold">
                    {formatUSD(l.price)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center rounded-full border border-surface-border">
                    <button
                      type="button"
                      onClick={() => setQty("food", l.id, l.qty - 1)}
                      className="h-9 w-9 text-lg"
                      aria-label="Decrease"
                    >
                      −
                    </button>
                    <span className="w-6 text-center text-sm font-semibold">
                      {l.qty}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQty("food", l.id, l.qty + 1)}
                      className="h-9 w-9 text-lg"
                      aria-label="Increase"
                    >
                      +
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => remove("food", l.id)}
                    className="text-xs text-ink-muted hover:text-ink"
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>

          <div className="surface-food space-y-2 p-4 text-[15px]">
            <Row label="Subtotal" value={formatUSD(subtotal)} />
            <Row label="Delivery fee" value={formatUSD(DELIVERY_FEE)} />
            <Row label="Service fee" value={formatUSD(SERVICE_FEE)} />
            <div className="my-2 border-t border-surface-border" />
            <Row label="Total" value={formatUSD(total)} bold />
          </div>

          <Link href="/food/checkout" className="btn-primary w-full">
            Checkout
          </Link>
        </>
      )}
    </div>
  );
}

function Row({
  label,
  value,
  bold,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className={bold ? "font-semibold text-ink" : "text-ink-muted"}>
        {label}
      </span>
      <span className={bold ? "font-semibold text-ink" : "text-ink"}>
        {value}
      </span>
    </div>
  );
}
