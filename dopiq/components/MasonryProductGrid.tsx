"use client";

import type { Product } from "@/types";
import { ProductCard } from "@/components/DiscoveryFeed";

/**
 * Pinterest / SHEIN-style masonry grid for the Shop browsing
 * surfaces — used by BrowseSection on /shop, by every category
 * page under /shop/category/*, and by the search-results grid.
 *
 * Native CSS columns — zero deps, zero hydration shift, no JS
 * measurement pass. Behavior: items pack top-to-bottom in column
 * one, then column two, etc., which is what most lightweight
 * masonry implementations do. Visual order != reading order in
 * that sense, but at Dopiq's scale (max ~100 cards per surface)
 * that trade-off is fine; if true shortest-column-wins becomes
 * important we can swap to react-masonry-css later.
 *
 * Per-card height variation is driven by ProductCard's conditional
 * metadata (varied name clamp + Top Rated pill + saved-count line
 * + description preview), all keyed off real product fields so
 * server-render and client-render never disagree.
 */
export function MasonryProductGrid({ products }: { products: Product[] }) {
  return (
    <div className="columns-2 gap-2 md:columns-3">
      {products.map((p) => (
        <div key={p.id} className="mb-2 break-inside-avoid">
          <ProductCard product={p} />
        </div>
      ))}
    </div>
  );
}
