"use client";

import { useMemo, useState } from "react";
import type { Product, ProductCategory } from "@/types";
import { ExploreSection } from "@/components/ExploreSection";
import { CuratedShopGrid } from "@/components/CuratedShopGrid";
import { BrowseSection } from "@/components/DiscoveryFeed";
import { MasonryProductGrid } from "@/components/MasonryProductGrid";
import { Bag } from "@/components/icons";

/**
 * Magazine-style Shop landing — Anthropologie / Free People inspired.
 * Order top to bottom: Search → Explore swipe → Curated 2x3 magazine
 * grid → Browse (filter pills + flat grid).
 *
 * The Curated grid is a pure navigation surface — tapping a tile
 * routes to /shop/category/<slug>. Browse below stays as an
 * in-page filter for users who'd rather scroll.
 */
export function ShopExperience({ products }: { products: Product[] }) {
  const [activeCategory, setActiveCategory] = useState<ProductCategory | null>(
    null,
  );
  const [search, setSearch] = useState("");

  function selectCategory(cat: ProductCategory | null) {
    setActiveCategory(cat);
  }

  const { browseList, browseSubtitle } = useMemo(() => {
    if (activeCategory) {
      const list = products.filter((p) => p.category === activeCategory);
      return {
        browseList: list,
        browseSubtitle: `${list.length} in ${activeCategory}`,
      };
    }
    return { browseList: products, browseSubtitle: null as string | null };
  }, [activeCategory, products]);

  // Search overrides the curated experience entirely — when the user
  // types we hide Explore + Curated and surface a flat grid of
  // name-or-category matches. Mirrors the Food page's behavior.
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

  return (
    <div className="space-y-10">
      {/* Prominent search bar */}
      <div className="relative">
        <svg
          width="18"
          height="18"
          viewBox="0 0 20 20"
          fill="none"
          aria-hidden
          className="absolute left-5 top-1/2 -translate-y-1/2 text-ink-muted"
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
          className="h-[52px] w-full rounded-pill border border-surface-border bg-white pl-12 pr-12 text-[16px] text-ink placeholder:text-ink-faint shadow-sm transition-all duration-150 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch("")}
            aria-label="Clear search"
            className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-surface-alt text-ink-muted transition hover:bg-surface-border"
          >
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden>
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
          {/* Explore swipe — the hero discovery mechanic, now at the top */}
          <ExploreSection products={products} />

          {/* Curated 2x3 magazine grid — each tile links to its
              dedicated category page; no parent callback needed. */}
          <CuratedShopGrid products={products} />

          {/* Browse — filter pills + flat grid; independent of Curated */}
          <BrowseSection
            products={browseList}
            subtitle={browseSubtitle}
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
      <MasonryProductGrid products={products} />
    </section>
  );
}
