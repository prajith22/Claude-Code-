import { useCallback, useEffect, useState } from "react";
import type { Product } from "@/types";

function fisherYates<T>(input: T[]): T[] {
  const a = input.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export type ExploreProducts = {
  shuffled: Product[];
  index: number;
  current: Product | undefined;
  prev: Product | undefined;
  next: Product | undefined;
  goNext: () => void;
  goPrev: () => void;
};

// Source of truth for the Explore carousel order. Shuffle runs once per
// mount so the order changes on every page load and stays stable within
// a session. The initial state is the unshuffled list so SSR and first
// client render match; the reshuffle happens in an effect after mount.
export function useExploreProducts(products: Product[]): ExploreProducts {
  const [shuffled, setShuffled] = useState<Product[]>(products);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const s = fisherYates(products);
    setShuffled(s);
    setIndex(0);
    // Verification log for installment 1 — remove once UI consumes the hook.
    if (s.length > 0) {
      console.log("[useExploreProducts] shuffled top 3:", s.slice(0, 3));
    }
  }, [products]);

  const len = shuffled.length;

  const goNext = useCallback(() => {
    setIndex((i) => (len === 0 ? 0 : (i + 1) % len));
  }, [len]);

  const goPrev = useCallback(() => {
    setIndex((i) => (len === 0 ? 0 : (i - 1 + len) % len));
  }, [len]);

  const current = len > 0 ? shuffled[index] : undefined;
  const prev = len > 0 ? shuffled[(index - 1 + len) % len] : undefined;
  const next = len > 0 ? shuffled[(index + 1) % len] : undefined;

  return { shuffled, index, current, prev, next, goNext, goPrev };
}
