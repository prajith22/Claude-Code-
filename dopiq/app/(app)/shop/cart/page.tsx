"use client";

import Link from "next/link";
import Image from "next/image";
import { useCartStore, cartSubtotal } from "@/lib/cart-store";
import { formatUSD } from "@/lib/utils";

export default function ShopCartPage() {
  const lines = useCartStore((s) => s.shop);
  const setQty = useCartStore((s) => s.setQty);
  const remove = useCartStore((s) => s.remove);
  const subtotal = cartSubtotal(lines);
  const shipping = lines.length ? 0 : 0;
  const total = subtotal + shipping;

  return (
    <div className="space-y-5">
      <h1 className="pt-2 text-[24px] font-semibold tracking-tight">Cart</h1>

      {lines.length === 0 ? (
        <div className="card flex flex-col items-center gap-3 px-6 py-12 text-center">
          <p className="text-[17px] font-semibold">Your cart is empty.</p>
          <p className="text-sm text-ink-muted">
            Go window-shop with consequences removed.
          </p>
          <Link href="/shop" className="btn-primary mt-2">
            Browse shop
          </Link>
        </div>
      ) : (
        <>
          <ul className="space-y-3">
            {lines.map((l) => (
              <li key={l.id} className="card flex gap-3 p-3">
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
                    <p className="line-clamp-2 text-[15px] font-medium">{l.name}</p>
                    <p className="mt-1 text-[15px] font-semibold">
                      {formatUSD(l.price)}
                    </p>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center rounded-full border border-surface-border">
                      <button
                        type="button"
                        onClick={() => setQty("shop", l.id, l.qty - 1)}
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
                        onClick={() => setQty("shop", l.id, l.qty + 1)}
                        className="h-9 w-9 text-lg"
                        aria-label="Increase"
                      >
                        +
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => remove("shop", l.id)}
                      className="text-sm text-ink-muted hover:text-ink"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <div className="card space-y-2 p-4">
            <Row label="Subtotal" value={formatUSD(subtotal)} />
            <Row label="Shipping" value="Free" />
            <div className="my-2 border-t border-surface-border" />
            <Row label="Total" value={formatUSD(total)} bold />
          </div>

          <Link href="/shop/checkout" className="btn-primary w-full">
            Proceed to checkout
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
    <div className="flex items-center justify-between text-[15px]">
      <span className={bold ? "font-semibold text-ink" : "text-ink-muted"}>
        {label}
      </span>
      <span className={bold ? "font-semibold text-ink" : "text-ink"}>
        {value}
      </span>
    </div>
  );
}
