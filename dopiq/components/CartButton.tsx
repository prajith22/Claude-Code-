"use client";

import Link from "next/link";
import { useCartStore, type CartKind } from "@/lib/cart-store";

export function CartButton({ kind }: { kind: CartKind }) {
  const lines = useCartStore((s) => s[kind]);
  const count = lines.reduce((n, l) => n + l.qty, 0);
  const href = kind === "shop" ? "/shop/cart" : "/food/cart";
  return (
    <Link
      href={href}
      className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-surface-border bg-white"
      aria-label="Open cart"
    >
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-ink" aria-hidden="true">
        <path
          d="M5 8h14l-1 12H6L5 8Z"
          stroke="currentColor"
          strokeWidth={1.8}
          strokeLinejoin="round"
        />
        <path
          d="M9 8a3 3 0 1 1 6 0"
          stroke="currentColor"
          strokeWidth={1.8}
          strokeLinecap="round"
        />
      </svg>
      {count > 0 && (
        <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1 text-[11px] font-semibold text-white">
          {count}
        </span>
      )}
    </Link>
  );
}
