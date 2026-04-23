"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useCartStore, cartSubtotal } from "@/lib/cart-store";
import { formatUSD } from "@/lib/utils";

export function RestaurantCheckoutBar() {
  const lines = useCartStore((s) => s.food);
  const itemCount = lines.reduce((n, l) => n + l.qty, 0);
  const total = cartSubtotal(lines);
  const visible = itemCount > 0;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="checkout-bar"
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 30 }}
          className="fixed inset-x-0 bottom-14 z-30 border-t border-surface-border bg-white/95 px-4 py-3 backdrop-blur-sm md:bottom-0"
        >
          <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 md:max-w-4xl">
            <div className="min-w-0">
              <p className="text-[12px] font-semibold uppercase tracking-wide text-ink-muted">
                {itemCount} {itemCount === 1 ? "item" : "items"}
              </p>
              <p className="text-[18px] font-bold text-navy money">
                {formatUSD(total)}
              </p>
            </div>
            <Link href="/food/checkout" className="btn-primary flex-none">
              Place Order · {formatUSD(total)}
            </Link>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
