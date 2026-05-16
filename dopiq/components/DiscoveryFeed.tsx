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
import { MasonryProductGrid } from "@/components/MasonryProductGrid";
import AmbientBreath from "@/components/motion/AmbientBreath";

const CATEGORIES: ProductCategory[] = [
  "Clothes",
  "Electronics",
  "Home Goods",
  "Beauty",
  "Sports",
];

/**
 * "Browse" section — small label + category pills + masonry grid.
 *
 * The parent (ShopExperience) owns the filter + product list and
 * feeds the already-filtered array in so this component is a pure
 * presenter. forwardRef is preserved for future scroll-anchoring
 * even though the Curated grid no longer triggers a callback.
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

      <MasonryProductGrid products={products} />
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

  // Deterministic metadata variation — drives masonry rhythm without
  // any randomness, so server and client render identical heights.
  // All knobs key off stable product fields:
  //
  //   - nameClamp: 3 buckets by name length (≤20 / 21-40 / >40 chars)
  //   - topRated:  product.rating >= 4.7
  //   - popular:   product.reviewCount > 5000  → renders the saved-count line
  //   - descPreview: always rendered (every product has a description),
  //                  truncated to 50 chars
  const nameLength = product.name.length;
  const nameClamp =
    nameLength <= 20 ? "" : nameLength <= 40 ? "line-clamp-2" : "line-clamp-4";
  const topRated = product.rating >= 4.7;
  const popular = product.reviewCount > 5000;
  const descPreview =
    product.description.length > 50
      ? `${product.description.slice(0, 50).trimEnd()}…`
      : product.description;

  return (
    <AmbientBreath duration={3.8} amplitude={1}>
      <motion.div
        whileHover={cardHover}
        whileTap={{ scale: 0.98 }}
        transition={cardHoverTransition}
        className={cn(
          "surface-shop-fill relative overflow-hidden rounded-card border-[2.5px] shadow-card",
          className,
        )}
        style={{ borderColor: "#2A1F18" }}
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
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, transparent 60%, rgba(139,92,246,0.08) 100%)",
            }}
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
      <Link href={`/shop/${product.id}`} className="block space-y-1.5 p-3">
        <p className={cn("text-[13px] font-bold leading-snug text-ink", nameClamp)}>
          {product.name}
        </p>
        <div className="flex items-center justify-between">
          <p className="font-mono text-[15px] font-bold text-navy">
            {formatUSD(product.price)}
          </p>
          <p className="flex items-center gap-1 text-[11px] font-semibold text-ink">
            <StarFilled size={10} />
            {product.rating.toFixed(1)}
          </p>
        </div>
        {topRated && (
          <span className="inline-flex items-center gap-1 rounded-full bg-[#D1FAE5] px-2 py-0.5 text-[11px] font-bold text-[#065F46]">
            ★ Top Rated
          </span>
        )}
        {popular && (
          <p className="text-[12px] text-ink-muted">
            {product.reviewCount.toLocaleString()}+ saved
          </p>
        )}
        <p className="text-[12px] leading-snug text-ink-muted">
          {descPreview}
        </p>
      </Link>
      </motion.div>
    </AmbientBreath>
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
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.95 }}
      className={cn(
        "flex-none whitespace-nowrap rounded-pill px-4 py-2 text-[13px] font-semibold transition-all duration-150",
        active
          ? "pill-glass-active scale-[1.02]"
          : "pill-shop text-ink",
      )}
    >
      {children}
    </motion.button>
  );
}

function HeartIcon({ filled }: { filled: boolean }) {
  return filled ? (
    <HeartFilled size={18} className="text-ink" />
  ) : (
    <Heart size={18} className="text-ink" />
  );
}
