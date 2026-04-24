"use client";

import { useCallback, useEffect, useState } from "react";
import type { Product } from "@/types";

function fisherYatesShuffle<T>(input: readonly T[]): T[] {
  const arr = input.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export type UseExploreProductsResult = {
  shuffled: Product[];
  index: number;
  current: Product | undefined;
  previous: Product | undefined;
  next: Product | undefined;
  goNext: () => void;
  goPrev: () => void;
};

export function useExploreProducts(products: Product[]): UseExploreProductsResult {
  const [shuffled, setShuffled] = useState<Product[]>([]);
  const [index, setIndex] = useState(0);

  // Shuffle once on mount (client-side) so the order is randomized per page load
  // and we avoid SSR hydration mismatches from Math.random on the server.
  useEffect(() => {
    setShuffled(fisherYatesShuffle(products));
    setIndex(0);
  }, [products]);

  const goNext = useCallback(() => {
    setIndex((i) => (shuffled.length === 0 ? 0 : Math.min(i + 1, shuffled.length - 1)));
  }, [shuffled.length]);

  const goPrev = useCallback(() => {
    setIndex((i) => Math.max(i - 1, 0));
  }, []);

  const current = shuffled[index];
  const previous = index > 0 ? shuffled[index - 1] : undefined;
  const next = index < shuffled.length - 1 ? shuffled[index + 1] : undefined;

  return { shuffled, index, current, previous, next, goNext, goPrev };
}
