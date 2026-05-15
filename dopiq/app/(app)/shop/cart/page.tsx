"use client";

import Link from "next/link";
import Image from "next/image";
import { useCartStore, cartSubtotal } from "@/lib/cart-store";
import { formatUSD } from "@/lib/utils";
import { Bag } from "@/components/icons";

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
        <div className="card flex flex-col items-center gap-3 px-6 py-14 text-center">
          <Bag size={36} className="text-ink-faint" />
          <p className="text-[17px] font-bold">Nothing in your cart. Cool.</p>
          <p className="text-sm text-ink-muted">
            That&rsquo;s the whole idea.
          </p>
          <Link href="/shop" className="btn-primary mt-2">
            Keep window-shopping
          </Link>
        </div>
      ) : (
        <>
          <ul className="space-y-3">
            {lines.map((l) => (
              <li key={l.id} className="card-subtle flex gap-4 p-4">
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

          <div className="card space-y-3 p-5">
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
