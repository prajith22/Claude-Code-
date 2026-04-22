"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/lib/cart-store";
import type { Product } from "@/types";

export function AddToCartControls({ product }: { product: Product }) {
  const router = useRouter();
  const add = useCartStore((s) => s.add);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  function handleAdd() {
    add("shop", {
      id: product.id,
      name: product.name,
      price: product.price,
      imageUrl: product.imageUrl,
      qty,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  }

  return (
    <div className="sticky bottom-20 z-30 flex items-center gap-3 md:static md:bottom-auto">
      <div className="flex h-12 items-center rounded-full border border-surface-border bg-white">
        <button
          type="button"
          onClick={() => setQty((q) => Math.max(1, q - 1))}
          className="h-12 w-12 text-lg text-ink"
          aria-label="Decrease quantity"
        >
          −
        </button>
        <span className="w-8 text-center text-[15px] font-semibold">{qty}</span>
        <button
          type="button"
          onClick={() => setQty((q) => Math.min(10, q + 1))}
          className="h-12 w-12 text-lg text-ink"
          aria-label="Increase quantity"
        >
          +
        </button>
      </div>
      <button
        type="button"
        onClick={handleAdd}
        className="btn-primary flex-1"
      >
        {added ? "Added ✓" : "Add to Cart"}
      </button>
      <button
        type="button"
        onClick={() => {
          handleAdd();
          router.push("/shop/cart");
        }}
        className="btn-secondary hidden md:inline-flex"
      >
        Buy now
      </button>
    </div>
  );
}
