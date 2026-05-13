import products from "@/data/products.json";
import type { Product } from "@/types";
import { CartButton } from "@/components/CartButton";
import { ShopExperience } from "@/components/ShopExperience";
import { SimDisclaimer } from "@/components/SimDisclaimer";

// Auth + subscription gating happen in (app)/layout.tsx; no need
// to re-check here. Doing so previously doubled the per-nav
// Prisma roundtrips.
export default function ShopPage() {
  const all = products as Product[];

  return (
    <div className="space-y-8 pb-4">
      {/* Centered editorial header — serif title, cart button anchored
          to the far right. The relative+absolute lets the title sit
          true-center while the cart stays flush-right regardless of
          how long the title becomes. */}
      <header className="relative pt-2">
        <h1 className="text-center font-display text-[30px] font-normal tracking-tight text-ink md:text-[34px]">
          Shop
        </h1>
        <div className="absolute right-0 top-2">
          <CartButton kind="shop" />
        </div>
      </header>

      <ShopExperience products={all} />

      <SimDisclaimer text="All products, prices, and reviews are fictional and for simulation purposes only. Dopiq does not sell or own any items. No real purchase is ever made." />
    </div>
  );
}
