"use client";

import { useMemo, useState } from "react";
import type { Product, ProductCategory } from "@/types";
import { FlashDeals } from "@/components/FlashDeals";
import {
  CollectionsGrid,
  buildCollections,
  type CollectionId,
} from "@/components/CollectionsGrid";
import { DiscoveryFeed } from "@/components/DiscoveryFeed";

type Filter =
  | { kind: "none" }
  | { kind: "category"; cat: ProductCategory }
  | { kind: "collection"; id: CollectionId };

export function ShopExperience({
  products,
  todayLabel,
}: {
  products: Product[];
  todayLabel: string;
}) {
  const [filter, setFilter] = useState<Filter>({ kind: "none" });

  const collections = useMemo(() => buildCollections(products), [products]);

  const { filtered, label } = useMemo(() => {
    if (filter.kind === "category") {
      return {
        filtered: products.filter((p) => p.category === filter.cat),
        label: filter.cat as string,
      };
    }
    if (filter.kind === "collection") {
      const c = collections.find((c) => c.id === filter.id);
      const ids = new Set(c?.productIds ?? []);
      return {
        filtered: products.filter((p) => ids.has(p.id)),
        label: c?.title ?? null,
      };
    }
    return { filtered: null as Product[] | null, label: null as string | null };
  }, [filter, products, collections]);

  function selectCategory(cat: ProductCategory | null) {
    setFilter(cat ? { kind: "category", cat } : { kind: "none" });
  }

  function selectCollection(id: CollectionId | null) {
    setFilter(id ? { kind: "collection", id } : { kind: "none" });
  }

  const activeCategory = filter.kind === "category" ? filter.cat : null;
  const activeCollection = filter.kind === "collection" ? filter.id : null;

  return (
    <div className="space-y-8">
      {/* Flash Deals */}
      <FlashDeals products={products} />

      {/* Collections */}
      <CollectionsGrid
        products={products}
        active={activeCollection}
        onSelect={selectCollection}
      />

      {/* Discovery Feed (with category pills under "Today's Finds") */}
      <DiscoveryFeed
        products={products}
        todayLabel={todayLabel}
        filteredProducts={filtered}
        filterLabel={label}
        activeCategory={activeCategory}
        onSelectCategory={selectCategory}
      />
    </div>
  );
}
