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
    <div className="space-y-6 pb-4">
      {/* Cart button row — minimal top chrome now that the centered
          "Shop" title is gone. Keeps a tap-target to /shop/cart
          (the only other path is the Add-to-Cart bar on a detail
          page, so removing this would strand users without a cart
          in progress). Everything else moves up. */}
      <div className="flex justify-end pt-2">
        <CartButton kind="shop" />
      </div>

      <ShopExperience products={all} />

      <SimDisclaimer text="All products, prices, and reviews are fictional and for simulation purposes only. Dopiq does not sell or own any items. No real purchase is ever made." />
    </div>
  );
}
