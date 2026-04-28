import products from "@/data/products.json";
import type { Product } from "@/types";
import { requireSubscribedUser } from "@/lib/session-guards";
import { CartButton } from "@/components/CartButton";
import { ShopExperience } from "@/components/ShopExperience";
import { SimDisclaimer } from "@/components/SimDisclaimer";

export default async function ShopPage() {
  await requireSubscribedUser();
  const all = products as Product[];

  // Format date on server to avoid hydration mismatch
  const todayLabel = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="space-y-6 pb-4">
      <header className="flex items-center justify-between pt-2">
        <div>
          <h1 className="text-[26px] font-bold tracking-tight">Shop</h1>
          <p className="mt-0.5 text-sm text-ink-muted">
            Today&rsquo;s drops, curated daily.
          </p>
        </div>
        <CartButton kind="shop" />
      </header>

      <ShopExperience products={all} todayLabel={todayLabel} />

      <SimDisclaimer text="All products, prices, and reviews are fictional and for simulation purposes only. Dopiq does not sell or own any items. No real purchase is ever made." />
    </div>
  );
}
