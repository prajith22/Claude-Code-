"use client";

import { useState } from "react";
import { useCartStore } from "@/lib/cart-store";
import type { MenuItem } from "@/types";

export function AddMenuItemButton({
  item,
  restaurantId,
  restaurantName,
}: {
  item: MenuItem;
  restaurantId: string;
  restaurantName: string;
}) {
  const add = useCartStore((s) => s.add);
  const [added, setAdded] = useState(false);

  function handleClick() {
    add("food", {
      id: `${restaurantId}:${item.id}`,
      name: item.name,
      price: item.price,
      qty: 1,
      meta: restaurantName,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1000);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="h-10 flex-none rounded-full border border-surface-border bg-white px-4 text-sm font-semibold text-ink transition active:scale-95 hover:bg-surface-alt"
    >
      {added ? "Added ✓" : "+ Add"}
    </button>
  );
}
