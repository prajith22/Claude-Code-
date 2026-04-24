"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion, type PanInfo } from "framer-motion";
import type { Product } from "@/types";
import { cn, formatUSD } from "@/lib/utils";

const CATEGORY_EMOJI: Record<string, string> = {
  Clothes: "👕",
  Electronics: "🎧",
  "Home Goods": "🏠",
  Beauty: "💄",
  Sports: "⚽",
};

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
  const [shuffled, setShuffled] = useState<Product[]>(products);
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);

  // SSR-safe: start with the given order, reshuffle once on mount so every
  // page load produces a fresh random order that stays stable in the session.
  useEffect(() => {
    setShuffled(fisherYates(products));
    setIndex(0);
  }, [products]);

  if (shuffled.length === 0) return null;
  const current = shuffled[index];

  const goNext = () => {
    setDirection(1);
    setIndex((i) => (i + 1) % shuffled.length);
  };
  const goPrev = () => {
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
          ✨ Explore
        </h2>
        <p className="text-[13px] text-ink-muted">Discover something new</p>
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
                  <span className="flex items-center gap-1 text-[13px] font-semibold text-brand">
                    ★ {current.rating.toFixed(1)}
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
        </div>
      </div>

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
    </section>
  );
}

function CardImage({ product }: { product: Product }) {
  // 60% of card height — card is image (h-[300px]) + info block (~200px).
  return (
    <div className="relative h-[300px] w-full overflow-hidden bg-surface-alt">
      {product.imageUrl ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={product.imageUrl}
          alt={product.name}
          draggable={false}
          className="h-full w-full select-none object-cover"
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
