import { notFound } from "next/navigation";
import Link from "next/link";
import products from "@/data/products.json";
import type { Product, ProductCategory } from "@/types";
import { ProductCard } from "@/components/DiscoveryFeed";
import { SimDisclaimer } from "@/components/SimDisclaimer";

// URL slug → canonical category name. Kebab-case for the URL,
// title-case + space for the type. Keep in sync with the tile
// hrefs in components/CuratedShopGrid.tsx.
const CATEGORY_BY_SLUG: Record<string, ProductCategory> = {
  clothes: "Clothes",
  electronics: "Electronics",
  beauty: "Beauty",
  "home-goods": "Home Goods",
  sports: "Sports",
};

const SUBTITLES: Record<ProductCategory, string> = {
  Clothes: "Wear it, save it.",
  Electronics: "Tech you almost bought.",
  Beauty: "Glow without the spend.",
  "Home Goods": "Cozy on a budget.",
  Sports: "Gear up, virtually.",
};

export function generateStaticParams() {
  return Object.keys(CATEGORY_BY_SLUG).map((category) => ({ category }));
}

export default function ShopCategoryPage({
  params,
}: {
  params: { category: string };
}) {
  const category = CATEGORY_BY_SLUG[params.category];
  if (!category) {
    notFound();
  }

  const items = (products as Product[]).filter((p) => p.category === category);

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
          {category}
        </h1>
        <p className="mt-1 text-center text-[14px] text-ink-muted">
          {SUBTITLES[category]} · {items.length}{" "}
          {items.length === 1 ? "item" : "items"}
        </p>
      </header>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        {items.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>

      <SimDisclaimer text="All products, prices, and reviews are fictional and for simulation purposes only. Dopiq does not sell or own any items. No real purchase is ever made." />
    </div>
  );
}
