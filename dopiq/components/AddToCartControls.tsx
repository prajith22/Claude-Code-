"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/lib/cart-store";
import type { Product } from "@/types";
import { cn } from "@/lib/utils";

export function AddToCartControls({ product }: { product: Product }) {
  const router = useRouter();
  const add = useCartStore((s) => s.add);
  const [qty, setQty] = useState(1);
  const [bounce, setBounce] = useState(false);
  const [added, setAdded] = useState(false);

  function handleAdd() {
    add("shop", {
      id: product.id,
      name: product.name,
      price: product.price,
      imageUrl: product.imageUrl,
      qty,
    });
    setBounce(true);
    setAdded(true);
    setTimeout(() => setBounce(false), 400);
    setTimeout(() => setAdded(false), 1400);
  }

  const QtyPicker = (
    <div className="flex items-center rounded-full border border-surface-border bg-surface-alt">
      <button
        type="button"
        onClick={() => setQty((q) => Math.max(1, q - 1))}
        className="flex h-11 w-11 items-center justify-center text-xl font-medium text-ink"
        aria-label="Decrease quantity"
      >
        −
      </button>
      <span className="w-8 text-center text-[15px] font-bold">{qty}</span>
      <button
        type="button"
        onClick={() => setQty((q) => Math.min(10, q + 1))}
        className="flex h-11 w-11 items-center justify-center text-xl font-medium text-ink"
        aria-label="Increase quantity"
      >
        +
      </button>
    </div>
  );

  return (
    <>
      {/* Mobile: fixed bar above bottom nav */}
      <div className="fixed inset-x-0 bottom-14 z-30 flex items-center gap-3 border-t border-surface-border bg-white/95 px-4 py-3 backdrop-blur-sm md:hidden">
        {QtyPicker}
        <button
          type="button"
          onClick={handleAdd}
          className={cn(
            "btn-primary flex-1 transition-transform duration-200",
            bounce && "scale-105",
          )}
        >
          {added ? "Added ✓" : "Add to Cart"}
        </button>
      </div>

      {/* Desktop: inline */}
      <div className="hidden items-center gap-3 md:flex">
        {QtyPicker}
        <button
          type="button"
          onClick={handleAdd}
          className={cn(
            "btn-primary flex-1 transition-transform duration-200",
            bounce && "scale-105",
          )}
        >
          {added ? "Added ✓" : "Add to Cart"}
        </button>
        <button
          type="button"
          onClick={() => {
            handleAdd();
            router.push("/shop/cart");
          }}
          className="btn-secondary"
        >
          Buy now
        </button>
      </div>
    </>
  );
}
