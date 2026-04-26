"use client";

import { useMemo, useState } from "react";
import type { Product, ProductCategory } from "@/types";
import { FlashDeals } from "@/components/FlashDeals";
import { ExploreSection } from "@/components/ExploreSection";
import {
  CollectionsGrid,
  buildCollections,
  type CollectionId,
} from "@/components/CollectionsGrid";
import { DiscoveryFeed, ProductCard } from "@/components/DiscoveryFeed";
import { Bag } from "@/components/icons";

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
  const [search, setSearch] = useState("");

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

  // Search overrides the curated experience — when the user types,
  // we hide flash deals / explore / collections / themed sections and
  // surface a flat grid of name-or-category matches. Mirrors how the
  // Food page collapses to a flat list when searching.
  const searchTerm = search.trim();
  const searchResults = useMemo(() => {
    const q = searchTerm.toLowerCase();
    if (!q) return null;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q),
    );
  }, [searchTerm, products]);

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
      {/* Search — mirrors the food page */}
      <div className="relative">
        <svg
          width="16"
          height="16"
          viewBox="0 0 20 20"
          fill="none"
          aria-hidden
          className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted"
        >
          <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.8" />
          <path
            d="m14 14 4 4"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products or categories..."
          className="w-full rounded-pill border border-surface-border bg-white py-3 pl-11 pr-11 text-[14px] text-ink placeholder:text-ink-faint shadow-sm transition-all duration-150 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch("")}
            aria-label="Clear search"
            className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-surface-alt text-ink-muted transition hover:bg-surface-border"
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden>
              <path
                d="M4 4l8 8M12 4l-8 8"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        )}
      </div>

      {searchResults ? (
        <SearchResults
          products={searchResults}
          query={searchTerm}
          onClear={() => setSearch("")}
        />
      ) : (
        <>
          {/* Flash Deals */}
          <FlashDeals products={products} />

          {/* Explore — random shuffled carousel */}
          <ExploreSection products={products} />

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
        </>
      )}
    </div>
  );
}

function SearchResults({
  products,
  query,
  onClear,
}: {
  products: Product[];
  query: string;
  onClear: () => void;
}) {
  if (products.length === 0) {
    return (
      <div className="card flex flex-col items-center gap-2 p-10 text-center">
        <Bag size={32} className="text-ink-faint" />
        <p className="text-[15px] font-semibold text-ink">
          No products for &ldquo;{query}&rdquo;.
        </p>
        <p className="text-[13px] text-ink-muted">
          Try a different word, or clear the search to browse everything.
        </p>
        <button
          type="button"
          onClick={onClear}
          className="mt-2 text-[13px] font-semibold text-brand hover:text-brand-dark"
        >
          Clear search
        </button>
      </div>
    );
  }

  return (
    <section>
      <p className="mb-3 text-[13px] text-ink-muted">
        Showing{" "}
        <span className="font-semibold text-ink">{products.length}</span>{" "}
        {products.length === 1 ? "match" : "matches"} for{" "}
        <span className="font-semibold text-ink">&ldquo;{query}&rdquo;</span>
      </p>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}
