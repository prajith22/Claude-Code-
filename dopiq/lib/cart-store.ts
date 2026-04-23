"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartKind = "shop" | "food";

export type CartLine = {
  id: string;
  name: string;
  price: number;
  imageUrl?: string;
  qty: number;
  meta?: string;
};

type CartState = Record<CartKind, CartLine[]> & {
  wishlist: string[];
  add: (kind: CartKind, line: CartLine) => void;
  remove: (kind: CartKind, id: string) => void;
  setQty: (kind: CartKind, id: string, qty: number) => void;
  clear: (kind: CartKind) => void;
  toggleWishlist: (id: string) => void;
};

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      shop: [],
      food: [],
      wishlist: [],
      add: (kind, line) =>
        set((state) => {
          const existing = state[kind].find((x) => x.id === line.id);
          const next = existing
            ? state[kind].map((x) =>
                x.id === line.id ? { ...x, qty: x.qty + line.qty } : x,
              )
            : [...state[kind], line];
          return { ...state, [kind]: next };
        }),
      remove: (kind, id) =>
        set((state) => ({
          ...state,
          [kind]: state[kind].filter((x) => x.id !== id),
        })),
      setQty: (kind, id, qty) =>
        set((state) => ({
          ...state,
          [kind]: state[kind]
            .map((x) => (x.id === id ? { ...x, qty } : x))
            .filter((x) => x.qty > 0),
        })),
      clear: (kind) => set((state) => ({ ...state, [kind]: [] })),
      toggleWishlist: (id) =>
        set((state) => ({
          ...state,
          wishlist: state.wishlist.includes(id)
            ? state.wishlist.filter((x) => x !== id)
            : [...state.wishlist, id],
        })),
    }),
    { name: "dopiq-cart-v1" },
  ),
);

export function cartSubtotal(lines: CartLine[]) {
  return lines.reduce((sum, l) => sum + l.price * l.qty, 0);
}
