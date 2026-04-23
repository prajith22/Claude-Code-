"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import type { Product, ProductCategory } from "@/types";
import { useCartStore } from "@/lib/cart-store";
import { formatUSD, cn } from "@/lib/utils";

const VIBE_LABELS: Record<ProductCategory, string> = {
  Clothes: "Fits dropping today",
  Electronics: "Tech you didn't know you needed",
  "Home Goods": "Make your space better",
  Beauty: "Your new routine",
  Sports: "Level up",
};

const SECTION_ORDER: ProductCategory[] = [
  "Clothes",
  "Electronics",
  "Home Goods",
  "Beauty",
  "Sports",
];

const CATEGORIES: ProductCategory[] = [
  "Clothes",
  "Electronics",
  "Home Goods",
  "Beauty",
  "Sports",
];

export function DiscoveryFeed({
  products,
  todayLabel,
  filteredProducts,
  filterLabel,
  activeCategory,
  onSelectCategory,
}: {
  products: Product[];
  todayLabel: string;
  filteredProducts: Product[] | null;
  filterLabel: string | null;
  activeCategory: ProductCategory | null;
  onSelectCategory: (cat: ProductCategory | null) => void;
}) {
  return (
    <section className="space-y-6">
      {/* Today's Finds hero */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="pt-2"
      >
        <p className="text-[12px] font-bold uppercase tracking-[0.18em] text-brand">
          {todayLabel}
        </p>
        <h2 className="mt-1 text-[34px] font-extrabold leading-tight tracking-tight text-ink md:text-[44px]">
          Today&rsquo;s Finds
        </h2>
        <p className="mt-1 text-[14px] text-ink-muted">
          Hand-picked drops, refreshed daily.
        </p>
      </motion.div>

      {/* Category filter pills — under the hero, for old-school browsing */}
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0">
        <FilterPill
          active={activeCategory === null && filteredProducts === null}
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

      {filteredProducts ? (
        <FilteredGrid products={filteredProducts} label={filterLabel} />
      ) : (
        <ThemedSections products={products} />
      )}

      {/* Footer message */}
      <motion.p
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4 }}
        className="pt-4 text-center text-[13px] text-ink-muted"
      >
        You&rsquo;ve seen everything for today — check back tomorrow for new drops.
      </motion.p>
    </section>
  );
}

function ThemedSections({ products }: { products: Product[] }) {
  return (
    <div className="space-y-8">
      {SECTION_ORDER.map((cat) => {
        const items = products.filter((p) => p.category === cat);
        if (items.length === 0) return null;
        return <Aisle key={cat} category={cat} products={items} />;
      })}
    </div>
  );
}

function Aisle({
  category,
  products,
}: {
  category: ProductCategory;
  products: Product[];
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-ink-muted">
            {category}
          </p>
          <h3 className="mt-0.5 text-[20px] font-bold tracking-tight">
            {VIBE_LABELS[category]}
          </h3>
        </div>
        <span className="flex-none text-[12px] text-ink-muted">
          {products.length} {products.length === 1 ? "item" : "items"}
        </span>
      </div>

      {/* Horizontal scroll row — swipe sideways through the aisle */}
      <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth px-4 pb-2 md:mx-0 md:px-0">
        {products.map((p) => (
          <ProductCard
            key={p.id}
            product={p}
            className="w-[180px] flex-none snap-start sm:w-[220px]"
          />
        ))}
      </div>
    </motion.section>
  );
}

function FilteredGrid({
  products,
  label,
}: {
  products: Product[];
  label: string | null;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {label && (
        <p className="mb-3 text-[13px] text-ink-muted">
          Showing{" "}
          <span className="font-semibold text-ink">{products.length}</span>{" "}
          from <span className="font-semibold text-ink">{label}</span>
        </p>
      )}
      {products.length === 0 ? (
        <div className="card p-8 text-center text-[14px] text-ink-muted">
          Nothing here yet. Try another filter.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </motion.div>
  );
}

function ProductCard({
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
    <div className={cn("group card relative overflow-hidden", className)}>
      <Link href={`/shop/${product.id}`} className="block">
        <div className="relative aspect-square overflow-hidden bg-surface-alt">
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, 220px"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
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
          saved && "border-red-200 bg-white",
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
          <p className="text-[11px] font-semibold text-brand">
            ★ {product.rating.toFixed(1)}
          </p>
        </div>
      </Link>
    </div>
  );
}

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
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill={filled ? "#EF4444" : "none"}
      stroke={filled ? "#EF4444" : "#0A0F1E"}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 1 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}
