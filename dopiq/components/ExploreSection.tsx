"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { AnimatePresence, motion, type PanInfo } from "framer-motion";
import type { Product, ProductCategory } from "@/types";
import { cn, formatUSD } from "@/lib/utils";
import { Bag, StarFilled } from "@/components/icons";

type CategoryKey = "all" | ProductCategory;

const CATEGORIES: Array<{ key: CategoryKey; label: string }> = [
  { key: "all", label: "All" },
  { key: "Clothes", label: "Clothes" },
  { key: "Electronics", label: "Electronics" },
  { key: "Home Goods", label: "Home Goods" },
  { key: "Beauty", label: "Beauty" },
  { key: "Sports", label: "Sports" },
];

const MAX_DOTS = 5;
const SWIPE_OFFSET = 60;
const SWIPE_VELOCITY = 500;

function fisherYates<T>(input: T[]): T[] {
  const a = input.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const variants = {
  enter: (dir: number) => ({ x: dir > 0 ? 320 : -320, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -320 : 320, opacity: 0 }),
};

export function ExploreSection({ products }: { products: Product[] }) {
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey>("all");
  const [shuffled, setShuffled] = useState<Product[]>(products);
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);

  // Re-filter + re-shuffle every time the products prop or the
  // selected category changes. SSR-safe: first render uses the
  // unsorted products, the effect rolls a fresh random order on
  // mount (and on every category tap thereafter).
  useEffect(() => {
    const pool =
      selectedCategory === "all"
        ? products
        : products.filter((p) => p.category === selectedCategory);
    setShuffled(fisherYates(pool));
    setIndex(0);
  }, [products, selectedCategory]);

  const hasProducts = shuffled.length > 0;
  const current = hasProducts ? shuffled[index] : null;

  const goNext = () => {
    if (!hasProducts) return;
    setDirection(1);
    setIndex((i) => (i + 1) % shuffled.length);
  };
  const goPrev = () => {
    if (!hasProducts) return;
    setDirection(-1);
    setIndex((i) => (i - 1 + shuffled.length) % shuffled.length);
  };

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -SWIPE_OFFSET || info.velocity.x < -SWIPE_VELOCITY) goNext();
    else if (info.offset.x > SWIPE_OFFSET || info.velocity.x > SWIPE_VELOCITY) goPrev();
  };

  const dotCount = Math.min(shuffled.length, MAX_DOTS);
  const activeDot =
    shuffled.length <= MAX_DOTS
      ? index
      : Math.min(
          MAX_DOTS - 1,
          Math.floor((index * MAX_DOTS) / shuffled.length),
        );

  return (
    <section className="space-y-4">
      <div>
        <h2 className="font-heading text-[20px] font-bold tracking-tight text-ink">
          Explore
        </h2>
        <p className="text-[13px] text-ink-muted">Something new every refresh.</p>
      </div>

      {/* Category filter pills — horizontal scroll on mobile, no
          scrollbar. Right-edge cream fade hints at scrollable
          overflow. Visually identical to the Food page's cuisine
          filter pills so the two surfaces feel like one family. */}
      <div className="relative">
        <div
          className="-mx-4 overflow-x-auto [&::-webkit-scrollbar]:hidden"
          style={{ scrollbarWidth: "none" }}
        >
          <div className="flex gap-2 px-4">
            {CATEGORIES.map((c) => {
              const active = selectedCategory === c.key;
              return (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => setSelectedCategory(c.key)}
                  aria-pressed={active}
                  className={`flex flex-none items-center rounded-pill border px-4 py-2 text-[13px] font-semibold shadow-sm transition ${
                    active
                      ? "border-navy bg-navy text-white"
                      : "border-surface-border bg-white text-ink hover:bg-surface-alt"
                  }`}
                >
                  {c.label}
                </button>
              );
            })}
          </div>
        </div>
        <div
          aria-hidden
          className="pointer-events-none absolute right-0 top-0 h-full w-10 md:hidden"
          style={{
            background:
              "linear-gradient(to left, #F5EFE4 0%, rgba(245,239,228,0) 100%)",
          }}
        />
      </div>

      <div className="relative mx-auto w-full max-w-[600px]">
        <ArrowButton
          dir="left"
          onClick={goPrev}
          className="absolute left-0 top-1/2 z-20 hidden -translate-x-4 -translate-y-1/2 md:flex"
        />
        <ArrowButton
          dir="right"
          onClick={goNext}
          className="absolute right-0 top-1/2 z-20 hidden -translate-y-1/2 translate-x-4 md:flex"
        />

        <div className="overflow-hidden rounded-card">
          {!current ? (
            <EmptyCategoryCard />
          ) : (
            <AnimatePresence mode="wait" initial={false} custom={direction}>
              <motion.div
                key={current.id}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ type: "spring", stiffness: 260, damping: 26, mass: 0.8 }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.2}
                whileDrag={{ scale: 0.97 }}
                onDragEnd={handleDragEnd}
                className="card cursor-grab touch-pan-y overflow-hidden active:cursor-grabbing"
              >
                <CardImage product={current} />
                <div className="space-y-1.5 p-5">
                  <p className="font-heading text-[20px] font-bold leading-tight text-ink">
                    {current.name}
                  </p>
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-ink-muted">
                    {current.category}
                  </p>
                  <div className="flex items-center justify-between pt-2">
                    <span className="money text-[22px] text-brand">
                      {formatUSD(current.price)}
                    </span>
                    <span className="flex items-center gap-1 text-[13px] font-semibold text-ink">
                      <StarFilled size={12} />
                      {current.rating.toFixed(1)}
                    </span>
                  </div>
                  <Link
                    href={`/shop/${current.id}`}
                    className="btn-navy mt-3 w-full"
                  >
                    View Product
                  </Link>
                </div>
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>

      {hasProducts && (
        <div className="flex items-center justify-center gap-1.5 pt-1">
          {Array.from({ length: dotCount }).map((_, i) => (
            <span
              key={i}
              className={cn(
                "h-1.5 rounded-full transition-all duration-200",
                i === activeDot ? "w-5 bg-brand" : "w-1.5 bg-surface-border",
              )}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function EmptyCategoryCard() {
  return (
    <div className="card flex min-h-[420px] flex-col items-center justify-center gap-3 p-10 text-center">
      <Bag size={36} className="text-ink-faint" />
      <p className="text-[15px] font-semibold text-ink">
        No products in this category yet — check back soon.
      </p>
    </div>
  );
}

function CardImage({ product }: { product: Product }) {
  // 60% of card height — card is image (h-[300px]) + info block (~200px).
  return (
    <div className="relative h-[300px] w-full overflow-hidden bg-surface-alt">
      {product.imageUrl ? (
        <Image
          src={product.imageUrl}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 100vw, 600px"
          draggable={false}
          className="select-none object-cover"
          style={{ filter: "blur(0.8px)" }}
        />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-ink-faint">
          <Bag size={40} />
          <span className="text-[13px] font-semibold">{product.category}</span>
        </div>
      )}
    </div>
  );
}

function ArrowButton({
  dir,
  onClick,
  className,
}: {
  dir: "left" | "right";
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={dir === "left" ? "Previous product" : "Next product"}
      className={cn(
        "h-11 w-11 items-center justify-center rounded-full bg-navy text-white shadow-navy transition hover:bg-navy-light active:scale-95",
        className,
      )}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden className="mx-auto">
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
