import Link from "next/link";
import products from "@/data/products.json";
import type { Product } from "@/types";
import { MasonryProductGrid } from "@/components/MasonryProductGrid";
import { SimDisclaimer } from "@/components/SimDisclaimer";

const TOP_PICKS_COUNT = 24;

// Static route — Next.js prefers /shop/category/top-picks over the
// dynamic /shop/category/[category] sibling, so this never collides
// with the slug map.
export default function ShopTopPicksPage() {
  const items = [...(products as Product[])]
    .sort((a, b) => b.rating - a.rating)
    .slice(0, TOP_PICKS_COUNT);

  return (
    <div className="space-y-8 pb-4">
      <header className="pt-2">
        <Link
          href="/shop"
          className="inline-flex items-center gap-1 text-[13px] font-semibold text-ink-muted transition hover:text-ink"
        >
          ← Back to Shop
        </Link>
        <h1 className="mt-4 text-center font-display text-[34px] font-normal tracking-tight text-ink md:text-[44px]">
          Top Picks
        </h1>
        <p className="mt-1 text-center text-[14px] text-ink-muted">
          The best of everything. · {items.length} highest-rated
        </p>
      </header>

      <MasonryProductGrid products={items} />

      <SimDisclaimer text="All products, prices, and reviews are fictional and for simulation purposes only. Dopiq does not sell or own any items. No real purchase is ever made." />
    </div>
  );
}
