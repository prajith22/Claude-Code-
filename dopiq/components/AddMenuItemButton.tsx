"use client";

import { AnimatePresence, motion } from "framer-motion";
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
  const lineId = `${restaurantId}:${item.id}`;
  const qty = useCartStore(
    (s) => s.food.find((x) => x.id === lineId)?.qty ?? 0,
  );
  const add = useCartStore((s) => s.add);
  const setQty = useCartStore((s) => s.setQty);

  function addOne() {
    add("food", {
      id: lineId,
      name: item.name,
      price: item.price,
      qty: 1,
      meta: restaurantName,
    });
  }

  function inc() {
    setQty("food", lineId, qty + 1);
  }

  function dec() {
    // setQty drops lines whose qty goes to 0, so we flip back to + Add.
    setQty("food", lineId, qty - 1);
  }

  return (
    <AnimatePresence mode="wait" initial={false}>
      {qty === 0 ? (
        <motion.button
          key="add"
          type="button"
          onClick={addOne}
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.85, opacity: 0 }}
          transition={{ duration: 0.18 }}
          whileTap={{ scale: 1.12 }}
          className="h-10 flex-none rounded-full border border-surface-border bg-white px-4 text-sm font-semibold text-ink transition-colors hover:bg-surface-alt"
        >
          + Add
        </motion.button>
      ) : (
        <motion.div
          key="qty"
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.85, opacity: 0 }}
          transition={{ type: "spring", stiffness: 360, damping: 24 }}
          className="flex h-10 flex-none items-center rounded-full bg-brand shadow-sm"
        >
          <button
            type="button"
            onClick={dec}
            aria-label={qty === 1 ? "Remove from order" : "Decrease quantity"}
            className="flex h-10 w-10 items-center justify-center text-[18px] font-bold text-navy active:scale-90"
          >
            −
          </button>
          <motion.span
            key={qty}
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.18, type: "spring", stiffness: 400 }}
            className="w-5 text-center text-[14px] font-bold tabular-nums text-navy"
          >
            {qty}
          </motion.span>
          <button
            type="button"
            onClick={inc}
            aria-label="Increase quantity"
            className="flex h-10 w-10 items-center justify-center text-[18px] font-bold text-navy active:scale-90"
          >
            +
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
