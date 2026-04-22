import Link from "next/link";
import products from "@/data/products.json";
import type { Product, ProductCategory } from "@/types";
import { requireOnboardedSubscribedUser } from "@/lib/session-guards";
import { formatUSD, cn } from "@/lib/utils";
import { CartButton } from "@/components/CartButton";

const CATEGORIES: ProductCategory[] = [
  "Clothes",
  "Electronics",
  "Home Goods",
  "Beauty",
  "Sports",
];

export default async function ShopPage({
  searchParams,
}: {
  searchParams?: { cat?: string };
}) {
  await requireOnboardedSubscribedUser();
  const selectedCat = searchParams?.cat as ProductCategory | undefined;
  const all = products as Product[];
  const filtered = selectedCat
    ? all.filter((p) => p.category === selectedCat)
    : all;

  return (
    <div className="space-y-5 pb-4">
      <header className="flex items-center justify-between pt-2">
        <div>
          <h1 className="text-[26px] font-bold tracking-tight">Shop</h1>
          <p className="mt-0.5 text-sm text-ink-muted">Fake store. Real dopamine.</p>
        </div>
        <CartButton kind="shop" />
      </header>

      {/* Category filter pills */}
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0">
        <Link
          href="/shop"
          className={cn(
            "flex-none rounded-pill px-4 py-2 text-[13px] font-semibold transition-all duration-150 whitespace-nowrap",
            !selectedCat
              ? "bg-navy text-white shadow-navy"
              : "border border-surface-border bg-white text-ink-muted hover:bg-surface-alt",
          )}
        >
          All
        </Link>
        {CATEGORIES.map((cat) => (
          <Link
            key={cat}
            href={`/shop?cat=${encodeURIComponent(cat)}`}
            className={cn(
              "flex-none rounded-pill px-4 py-2 text-[13px] font-semibold transition-all duration-150 whitespace-nowrap",
              selectedCat === cat
                ? "bg-navy text-white shadow-navy"
                : "border border-surface-border bg-white text-ink-muted hover:bg-surface-alt",
            )}
          >
            {cat}
          </Link>
        ))}
      </div>

      {/* Product grid */}
      {filtered.length === 0 ? (
        <div className="card flex flex-col items-center gap-3 px-6 py-12 text-center">
          <p className="text-[17px] font-semibold">No products here yet.</p>
          <Link href="/shop" className="btn-primary mt-2">
            See all
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {filtered.map((p) => (
            <Link
              key={p.id}
              href={`/shop/${p.id}`}
              className="group card overflow-hidden transition-all duration-150 hover:scale-[1.02] hover:shadow-cardHover active:scale-[0.995]"
            >
              <div className="relative aspect-square overflow-hidden bg-surface-alt">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.imageUrl}
                  alt={p.name}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <div className="p-4">
                <p className="line-clamp-2 text-[14px] font-bold leading-snug text-ink">
                  {p.name}
                </p>
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-[17px] font-bold text-navy money">
                    {formatUSD(p.price)}
                  </p>
                  <p className="text-[12px] font-semibold text-brand">
                    ★ {p.rating.toFixed(1)}
                  </p>
                </div>
                <p className="mt-0.5 text-[11px] text-ink-muted">
                  {p.reviewCount.toLocaleString()} reviews
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
