"use client";

import { useMemo, useState } from "react";
import type { Product, ProductCategory } from "@/types";
import { cn } from "@/lib/utils";
import { FlashDeals } from "@/components/FlashDeals";
import {
  CollectionsGrid,
  buildCollections,
  type CollectionId,
} from "@/components/CollectionsGrid";
import { DiscoveryFeed } from "@/components/DiscoveryFeed";

const CATEGORIES: ProductCategory[] = [
  "Clothes",
  "Electronics",
  "Home Goods",
  "Beauty",
  "Sports",
];

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
        label: filter.cat,
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

  const activeCategory =
    filter.kind === "category" ? filter.cat : null;
  const activeCollection =
    filter.kind === "collection" ? filter.id : null;

  return (
    <div className="space-y-8">
      {/* Category filter pills — preserved for the old way */}
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0">
        <FilterPill
          active={filter.kind === "none"}
          onClick={() => selectCategory(null)}
        >
          All
        </FilterPill>
        {CATEGORIES.map((cat) => (
          <FilterPill
            key={cat}
            active={activeCategory === cat}
            onClick={() => selectCategory(activeCategory === cat ? null : cat)}
          >
            {cat}
          </FilterPill>
        ))}
      </div>

      {/* Flash Deals */}
      <FlashDeals products={products} />

      {/* Collections */}
      <CollectionsGrid
        products={products}
        active={activeCollection}
        onSelect={selectCollection}
      />

      {/* Discovery Feed (or filtered grid) */}
      <DiscoveryFeed
        products={products}
        todayLabel={todayLabel}
        filteredProducts={filtered}
        filterLabel={label}
      />
    </div>
  );
}

function FilterPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex-none whitespace-nowrap rounded-pill px-4 py-2 text-[13px] font-semibold transition-all duration-150",
        active
          ? "bg-navy text-white shadow-navy"
          : "border border-surface-border bg-white text-ink-muted hover:bg-surface-alt",
      )}
    >
      {children}
    </button>
  );
}
