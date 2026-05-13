"use client";

import Link from "next/link";
import Image from "next/image";
import { forwardRef, memo } from "react";
import { motion } from "framer-motion";
import type { Product, ProductCategory } from "@/types";
import { useCartStore } from "@/lib/cart-store";
import { formatUSD, cn } from "@/lib/utils";
import { cardHover, cardHoverTransition } from "@/lib/card-hover";
import { Heart, HeartFilled, StarFilled } from "@/components/icons";

const CATEGORIES: ProductCategory[] = [
  "Clothes",
  "Electronics",
  "Home Goods",
  "Beauty",
  "Sports",
];

/**
 * "Browse" section — formerly the multi-aisle Today's Finds feed.
 * Now a simpler stack: a small left-aligned section label, the
 * category filter pills, and a flat 2/3-col grid of ProductCards.
 *
 * The parent (ShopExperience) owns the filter + product list and
 * feeds the already-filtered array in so this component is a pure
 * presenter. Forwarded ref lets the Curated tiles above smooth-
 * scroll to the section's top when tapped.
 */
export const BrowseSection = forwardRef<
  HTMLElement,
  {
    products: Product[];
    subtitle: string | null;
    activeCategory: ProductCategory | null;
    onSelectCategory: (cat: ProductCategory | null) => void;
  }
>(function BrowseSection(
  { products, subtitle, activeCategory, onSelectCategory },
  ref,
) {
  return (
    <motion.section
      ref={ref}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      // scroll-mt-20 lifts the section anchor below the sticky TopNav
      // so a smooth-scroll lands the header in a comfortable spot
      // rather than pinned right under the nav edge.
      className="scroll-mt-20"
      aria-label="Browse all products"
    >
      <header className="mb-3 flex items-baseline justify-between gap-3">
        <h2 className="text-[18px] font-semibold tracking-tight text-ink">
          Browse
        </h2>
        {subtitle && (
          <span className="text-[12px] text-ink-muted">{subtitle}</span>
        )}
      </header>

      {/* Category filter pills */}
      <div className="-mx-4 mb-5 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0">
        <FilterPill
          active={activeCategory === null}
          onClick={() => onSelectCategory(null)}
        >
          All
        </FilterPill>
        {CATEGORIES.map((cat) => (
          <FilterPill
            key={cat}
            active={activeCategory === cat}
            onClick={() =>
              onSelectCategory(activeCategory === cat ? null : cat)
            }
          >
            {cat}
          </FilterPill>
        ))}
      </div>

      {/* Flat 2/3-col grid */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </motion.section>
  );
});

function ProductCardImpl({
  product,
  className,
}: {
  product: Product;
  className?: string;
}) {
  const wishlist = useCartStore((s) => s.wishlist);
  const toggle = useCartStore((s) => s.toggleWishlist);
  const saved = wishlist.includes(product.id);

  return (
    <motion.div
      whileHover={cardHover}
      transition={cardHoverTransition}
      className={cn(
        "relative overflow-hidden rounded-card border border-surface-border bg-white shadow-card",
        className,
      )}
    >
      <Link href={`/shop/${product.id}`} className="block">
        <div className="relative aspect-square w-full overflow-hidden bg-surface-alt">
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, 220px"
            className="object-cover"
          />
        </div>
      </Link>
      <button
        type="button"
        aria-label={saved ? "Remove from wishlist" : "Save to wishlist"}
        aria-pressed={saved}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          toggle(product.id);
        }}
        className={cn(
          "absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full border border-surface-border bg-white/90 backdrop-blur-sm transition-all duration-150 hover:scale-110 active:scale-95",
          saved && "border-ink bg-white",
        )}
      >
        <HeartIcon filled={saved} />
      </button>
      <Link href={`/shop/${product.id}`} className="block p-3">
        <p className="line-clamp-2 min-h-[34px] text-[13px] font-bold leading-snug text-ink">
          {product.name}
        </p>
        <div className="mt-1.5 flex items-center justify-between">
          <p className="font-mono text-[15px] font-bold text-navy">
            {formatUSD(product.price)}
          </p>
          <p className="flex items-center gap-1 text-[11px] font-semibold text-ink">
            <StarFilled size={10} />
            {product.rating.toFixed(1)}
          </p>
        </div>
      </Link>
    </motion.div>
  );
}

// Memoized so re-renders of the parent (filter changes, scroll-driven
// motion) don't ripple through every grid card.
export const ProductCard = memo(ProductCardImpl);

function FilterPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex-none whitespace-nowrap rounded-pill px-4 py-2 text-[13px] font-semibold transition-all duration-150",
        active
          ? "bg-navy text-white shadow-navy"
          : "border border-surface-border bg-white text-ink-muted hover:bg-surface-alt",
      )}
    >
      {children}
    </button>
  );
}

function HeartIcon({ filled }: { filled: boolean }) {
  // Saved-state heart: filled in ink (not red — keep the palette quiet),
  // outline otherwise. Brand-green is reserved for money-saved + bet-won,
  // never decoration.
  return filled ? (
    <HeartFilled size={18} className="text-ink" />
  ) : (
    <Heart size={18} className="text-ink" />
  );
}
