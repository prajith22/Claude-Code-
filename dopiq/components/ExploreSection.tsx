"use client";

import Link from "next/link";
import type { Product } from "@/types";
import { cn, formatUSD } from "@/lib/utils";
import { useExploreProducts } from "@/hooks/useExploreProducts";

const CATEGORY_EMOJI: Record<string, string> = {
  Clothes: "👕",
  Electronics: "🎧",
  "Home Goods": "🏠",
  Beauty: "💄",
  Sports: "⚽",
};

export function ExploreSection({ products }: { products: Product[] }) {
  const { shuffled, index, current, goNext, goPrev } =
    useExploreProducts(products);

  if (!current) return null;

  const atStart = index === 0;
  const atEnd = index === shuffled.length - 1;

  return (
    <section className="space-y-4">
      <div>
        <h2 className="font-heading text-[20px] font-bold tracking-tight text-ink">
          ✨ Explore
        </h2>
        <p className="text-[13px] text-ink-muted">Discover something new</p>
      </div>

      <ExploreCard product={current} />

      <div className="flex items-center justify-center gap-4 pt-1">
        <ArrowButton
          dir="left"
          onClick={goPrev}
          disabled={atStart}
          label="Previous product"
        />
        <ArrowButton
          dir="right"
          onClick={goNext}
          disabled={atEnd}
          label="Next product"
        />
      </div>
    </section>
  );
}

function ExploreCard({ product }: { product: Product }) {
  return (
    <article className="card mx-auto w-full max-w-[600px] overflow-hidden">
      <div className="relative h-[320px] w-full overflow-hidden bg-surface-alt">
        {product.imageUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={product.imageUrl}
            alt={product.name}
            className="h-full w-full object-cover"
            style={{ filter: "blur(0.8px)" }}
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-ink-muted">
            <span className="text-5xl" aria-hidden>
              {CATEGORY_EMOJI[product.category] ?? "✨"}
            </span>
            <span className="text-[13px] font-semibold">{product.category}</span>
          </div>
        )}
      </div>

      <div className="space-y-1.5 p-5">
        <p className="font-heading text-[20px] font-bold leading-tight text-ink">
          {product.name}
        </p>
        <p className="text-[11px] font-semibold uppercase tracking-widest text-ink-muted">
          {product.category}
        </p>
        <div className="flex items-center justify-between pt-2">
          <span className="money text-[22px] text-brand">
            {formatUSD(product.price)}
          </span>
          <span className="flex items-center gap-1 text-[13px] font-semibold text-brand">
            ★ {product.rating.toFixed(1)}
          </span>
        </div>
        <Link href={`/shop/${product.id}`} className="btn-navy mt-3 w-full">
          View Product
        </Link>
      </div>
    </article>
  );
}

function ArrowButton({
  dir,
  onClick,
  disabled,
  label,
}: {
  dir: "left" | "right";
  onClick: () => void;
  disabled: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={cn(
        "flex h-12 w-12 items-center justify-center rounded-full bg-navy text-white shadow-navy transition",
        disabled
          ? "cursor-not-allowed opacity-40"
          : "hover:bg-navy-light active:scale-95",
      )}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d={dir === "left" ? "M15 18l-6-6 6-6" : "M9 18l6-6-6-6"}
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
