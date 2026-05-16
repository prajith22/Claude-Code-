"use client";

import type { Product } from "@/types";
import { ProductCard } from "@/components/DiscoveryFeed";

/**
 * Uniform 2-column product grid for the Shop browsing surfaces —
 * used by BrowseSection on /shop, every category page under
 * /shop/category/*, and the search-results grid.
 *
 * Real CSS grid (grid-cols-2, md:grid-cols-3). Previously this was
 * a CSS multi-column (`columns-2`) masonry, but once ProductCard
 * got wrapped in an AmbientBreath motion.div the column-break
 * algorithm mis-handled the transformed first child and rendered
 * it orphaned/full-width. A real grid places every card in an
 * equal cell — no orphan card, consistent 2-up top-to-bottom, and
 * transforms inside grid items compose cleanly.
 */
export function MasonryProductGrid({ products }: { products: Product[] }) {
  return (
    <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}
