"use client";

import Link from "next/link";
import Image from "next/image";
import { useCartStore, cartSubtotal } from "@/lib/cart-store";
import { formatUSD } from "@/lib/utils";
import { EmptyCart } from "@/components/EmptyCart";

export default function ShopCartPage() {
  const lines = useCartStore((s) => s.shop);
  const setQty = useCartStore((s) => s.setQty);
  const remove = useCartStore((s) => s.remove);
  const subtotal = cartSubtotal(lines);
  const total = subtotal;

  return (
    <div className="space-y-5 pb-4">
      <h1 className="pt-2 text-[26px] font-bold tracking-tight">Cart</h1>

      {lines.length === 0 ? (
        <EmptyCart
          mascotSrc="/onboarding/dopiq-dog1.png"
          heading="Nothing in your cart. Cool."
          subhead="That's the whole idea."
          ctaHref="/shop"
          ctaLabel="Keep window-shopping"
        />
      ) : (
        <>
          <ul className="space-y-3">
            {lines.map((l) => (
              <li key={l.id} className="surface-shop flex gap-4 p-4">
                {l.imageUrl && (
                  <div className="relative h-20 w-20 flex-none overflow-hidden rounded-xl bg-surface-alt">
                    <Image
                      src={l.imageUrl}
                      alt={l.name}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="flex min-w-0 flex-1 flex-col justify-between">
                  <div>
                    <p className="line-clamp-2 text-[15px] font-bold leading-snug text-ink">
                      {l.name}
                    </p>
                    <p className="mt-1 text-[16px] font-bold text-navy money">
                      {formatUSD(l.price)}
                    </p>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center rounded-full border border-surface-border bg-surface-alt">
                      <button
                        type="button"
                        onClick={() => setQty("shop", l.id, l.qty - 1)}
                        className="flex h-9 w-9 items-center justify-center text-lg text-ink"
                        aria-label="Decrease"
                      >
                        −
                      </button>
                      <span className="w-6 text-center text-sm font-bold">
                        {l.qty}
                      </span>
                      <button
                        type="button"
                        onClick={() => setQty("shop", l.id, l.qty + 1)}
                        className="flex h-9 w-9 items-center justify-center text-lg text-ink"
                        aria-label="Increase"
                      >
                        +
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => remove("shop", l.id)}
                      className="text-[13px] font-medium text-ink-muted hover:text-ink"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <div className="surface-shop space-y-3 p-5">
            <Row label="Subtotal" value={formatUSD(subtotal)} />
            <Row label="Shipping" value="Free" />
            <div className="border-t border-surface-border" />
            <Row label="Total" value={formatUSD(total)} bold />
          </div>

          <Link href="/shop/checkout" className="btn-primary w-full">
            Proceed to checkout
          </Link>
          <p className="text-center text-xs text-ink-muted">
            Simulated checkout · no real charge
          </p>
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
    <div className="flex items-center justify-between text-[15px]">
      <span className={bold ? "font-bold text-ink" : "text-ink-muted"}>
        {label}
      </span>
      <span className={bold ? "font-bold text-navy money" : "text-ink"}>
        {value}
      </span>
    </div>
  );
}
