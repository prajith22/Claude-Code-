"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion, type PanInfo } from "framer-motion";
import type { Product, ProductCategory } from "@/types";
import { cn, formatUSD } from "@/lib/utils";
import { Bag, StarFilled } from "@/components/icons";
import { CartButton } from "@/components/CartButton";
import AmbientBreath from "@/components/motion/AmbientBreath";

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

// Module-scope in-memory image cache. Holding live HTMLImageElement
// references prevents the browser from evicting recently-decoded
// images, so a swipe back to a previously seen card renders
// instantly with no placeholder flash. The cache is shared across
// renders and across category switches.
const imageCache = new Map<string, HTMLImageElement>();

function preloadImage(src: string) {
  if (!src) return;
  if (typeof window === "undefined") return;
  if (imageCache.has(src)) return;
  const img = new window.Image();
  img.decoding = "async";
  img.src = src;
  // Stash the element immediately so a second preload call for the
  // same URL is a no-op even if onload hasn't fired yet.
  imageCache.set(src, img);
}

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
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey>("all");
  const [shuffled, setShuffled] = useState<Product[]>(products);
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);

  // Carry the single product to the isolated /shop/buy-now express
  // checkout via sessionStorage — deliberately NOT through
  // useCartStore.shop, so a user's real cart is never touched. The
  // old behavior added the product to the shared cart and routed
  // through /shop/checkout, which then showed unrelated cart lines
  // ("4 items" when they meant to buy 1).
  function purchaseNow(product: Product) {
    sessionStorage.setItem("dopiq-buy-now-shop", JSON.stringify(product));
    router.push("/shop/buy-now");
  }

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

  // Preload the next two cards' images as soon as the current card
  // renders. Keeps swipes feeling instant — by the time the user
  // pans, the next image is already decoded in the browser cache.
  useEffect(() => {
    if (shuffled.length === 0) return;
    for (let offset = 1; offset <= 2; offset++) {
      const next = shuffled[(index + offset) % shuffled.length];
      if (next?.imageUrl) preloadImage(next.imageUrl);
    }
  }, [index, shuffled]);

  // On a category tap (or initial shuffle), warm the first 5 images
  // in the new pool before the user starts swiping.
  useEffect(() => {
    if (shuffled.length === 0) return;
    shuffled.slice(0, 5).forEach((p) => {
      if (p.imageUrl) preloadImage(p.imageUrl);
    });
  }, [shuffled]);

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
        {/* Section heading + cart button live on one line so the
            cart stays reachable from /shop without a standalone
            top-bar row. Subtitle sits on its own line below,
            still left-aligned. */}
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-heading text-[20px] font-bold tracking-tight text-ink">
            Swipe to Explore
          </h2>
          <CartButton kind="shop" />
        </div>
        <p className="mt-1 text-[13px] text-ink-muted">
          Something new every refresh.
        </p>
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
                <motion.button
                  key={c.key}
                  type="button"
                  onClick={() => setSelectedCategory(c.key)}
                  aria-pressed={active}
                  whileTap={{ scale: 0.95 }}
                  className={`type-magnetic font-editorial flex flex-none items-center rounded-pill px-4 py-2 text-[13px] font-semibold transition ${
                    active
                      ? "pill-glass-active scale-[1.02]"
                      : "pill-shop text-ink"
                  }`}
                >
                  {c.label}
                </motion.button>
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
            <AmbientBreath duration={4.2} amplitude={1}>
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
                className="surface-shop-fill card border-[2.5px] border-[#2A1F18] cursor-grab touch-pan-y overflow-hidden active:cursor-grabbing"
              >
                <CardImage product={current} priority={index < 3} />
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
                  <button
                    type="button"
                    onClick={() => purchaseNow(current)}
                    className="btn-primary mt-3 w-full"
                  >
                    Purchase Now
                  </button>
                  <Link
                    href={`/shop/${current.id}`}
                    className="btn-navy mt-2 w-full"
                  >
                    View Product
                  </Link>
                </div>
              </motion.div>
            </AnimatePresence>
            </AmbientBreath>
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
    <div className="surface-shop flex min-h-[420px] flex-col items-center justify-center gap-3 p-10 text-center">
      <Bag size={36} className="text-ink-faint" />
      <p className="text-[15px] font-semibold text-ink">
        No products in this category yet — check back soon.
      </p>
    </div>
  );
}

function CardImage({
  product,
  priority,
}: {
  product: Product;
  priority: boolean;
}) {
  // If the URL is already in our in-memory cache the browser has it
  // decoded — skip the placeholder entirely on this render so swipe-
  // backs feel instant.
  const cached = product.imageUrl ? imageCache.has(product.imageUrl) : false;
  const [loaded, setLoaded] = useState(cached);

  // Reset loaded state when the product changes (e.g., user swipes
  // to a new card). Cached images skip the placeholder.
  useEffect(() => {
    setLoaded(product.imageUrl ? imageCache.has(product.imageUrl) : true);
  }, [product.imageUrl]);

  // 60% of card height — card is image (h-[300px]) + info block (~200px).
  return (
    <div className="relative h-[300px] w-full overflow-hidden bg-[#F5F0E8]">
      {!loaded && (
        <div aria-hidden className="absolute inset-0 explore-shimmer" />
      )}
      {product.imageUrl ? (
        <Image
          src={product.imageUrl}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 100vw, 600px"
          draggable={false}
          priority={priority}
          // Eager loading kills the IntersectionObserver-driven
          // pop-in. priority handles the first 3 cards more
          // aggressively (fetchpriority=high) and itself implies
          // eager, so we only set loading explicitly when priority
          // is off to avoid the Next.js prop-conflict warning.
          loading={priority ? undefined : "eager"}
          onLoadingComplete={(img) => {
            if (product.imageUrl && !imageCache.has(product.imageUrl)) {
              const cacheEl = new window.Image();
              cacheEl.src = img.currentSrc || product.imageUrl;
              imageCache.set(product.imageUrl, cacheEl);
            }
            setLoaded(true);
          }}
          className="select-none object-cover transition-opacity duration-200"
          style={{ opacity: loaded ? 1 : 0 }}
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-ink-faint">
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
