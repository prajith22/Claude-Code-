"use client";

import { motion } from "framer-motion";
import type { Product } from "@/types";
import { cardHover, cardHoverTransition } from "@/lib/card-hover";

export type CollectionId =
  | "summer-finds"
  | "under-25"
  | "trending-now"
  | "just-dropped";

export type Collection = {
  id: CollectionId;
  title: string;
  subtitle: string;
  bg: string;
  title_color: string;
  sub_color: string;
  productIds: string[];
};

export function buildCollections(products: Product[]): Collection[] {
  const summer = products.filter(
    (p) => p.category === "Clothes" || p.category === "Beauty",
  );
  const under25 = products.filter((p) => p.price < 25);
  const trending = [...products]
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 3);
  const justDropped = products.slice(-3);

  // All four cards now ride the disciplined palette: cream surface,
  // ink text, navy on hover/active. Differentiation comes from the
  // copy itself, not from a pastel rainbow that signals nothing.
  const baseStyle = {
    bg: "bg-white",
    title_color: "text-ink",
    sub_color: "text-ink-muted",
  };

  return [
    {
      id: "summer-finds",
      title: "Summer Finds",
      subtitle: "Hot weather. Same simulator.",
      ...baseStyle,
      productIds: summer.map((p) => p.id),
    },
    {
      id: "under-25",
      title: "Under $25",
      subtitle: "Cheap to almost-buy.",
      ...baseStyle,
      productIds: under25.map((p) => p.id),
    },
    {
      id: "trending-now",
      title: "Trending Now",
      subtitle: "What everyone almost bought.",
      ...baseStyle,
      productIds: trending.map((p) => p.id),
    },
    {
      id: "just-dropped",
      title: "Just Dropped",
      subtitle: "Fresh this week.",
      ...baseStyle,
      productIds: justDropped.map((p) => p.id),
    },
  ];
}

export function CollectionsGrid({
  products,
  active,
  onSelect,
}: {
  products: Product[];
  active: CollectionId | null;
  onSelect: (id: CollectionId | null) => void;
}) {
  const collections = buildCollections(products);

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-[18px] font-bold tracking-tight">Collections</h2>
        {active && (
          <button
            type="button"
            onClick={() => onSelect(null)}
            className="text-[12px] font-semibold text-ink-muted hover:text-ink"
          >
            Clear filter
          </button>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {collections.map((c) => {
          const isActive = active === c.id;
          return (
            <motion.button
              key={c.id}
              type="button"
              onClick={() => onSelect(isActive ? null : c.id)}
              whileHover={cardHover}
              transition={cardHoverTransition}
              className={`group relative flex min-h-[140px] flex-col items-start justify-between overflow-hidden rounded-card border border-surface-border p-4 text-left transition-colors ${c.bg} ${
                isActive
                  ? "border-ink shadow-card"
                  : "hover:bg-surface-alt"
              }`}
            >
              <div>
                <p className={`text-[18px] font-bold leading-tight ${c.title_color}`}>
                  {c.title}
                </p>
                <p className={`mt-1 text-[12px] ${c.sub_color}`}>{c.subtitle}</p>
              </div>
            </motion.button>
          );
        })}
      </div>
    </motion.section>
  );
}
