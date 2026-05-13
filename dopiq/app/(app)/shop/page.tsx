import products from "@/data/products.json";
import type { Product } from "@/types";
import { ShopExperience } from "@/components/ShopExperience";
import { SimDisclaimer } from "@/components/SimDisclaimer";

// Auth + subscription gating happen in (app)/layout.tsx; no need
// to re-check here. Doing so previously doubled the per-nav
// Prisma roundtrips.
//
// The standalone cart-button row that used to live here has moved
// into ExploreSection's heading line — keeps the cart reachable
// without leaving a half-empty row above the search input.
export default function ShopPage() {
  const all = products as Product[];

  return (
    <div className="space-y-6 pb-4">
      <ShopExperience products={all} />

      <SimDisclaimer text="All products, prices, and reviews are fictional and for simulation purposes only. Dopiq does not sell or own any items. No real purchase is ever made." />
    </div>
  );
}
