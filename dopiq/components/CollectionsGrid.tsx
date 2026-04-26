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

  return [
    {
      id: "summer-finds",
      title: "Summer Finds",
      subtitle: "Hot weather. Same simulator.",
      bg: "bg-[#FFE4DE]",
      title_color: "text-[#9A1F1F]",
      sub_color: "text-[#9A1F1F]/70",
      productIds: summer.map((p) => p.id),
    },
    {
      id: "under-25",
      title: "Under $25",
      subtitle: "Cheap to almost-buy.",
      bg: "bg-[#D8F2DC]",
      title_color: "text-[#13693B]",
      sub_color: "text-[#13693B]/70",
      productIds: under25.map((p) => p.id),
    },
    {
      id: "trending-now",
      title: "Trending Now",
      subtitle: "What everyone almost bought.",
      bg: "bg-[#E8E0FA]",
      title_color: "text-[#4C1D95]",
      sub_color: "text-[#4C1D95]/70",
      productIds: trending.map((p) => p.id),
    },
    {
      id: "just-dropped",
      title: "Just Dropped",
      subtitle: "Fresh this week.",
      bg: "bg-[#FFEBC2]",
      title_color: "text-[#7A4A07]",
      sub_color: "text-[#7A4A07]/70",
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
              className={`group relative flex min-h-[140px] flex-col items-start justify-between overflow-hidden rounded-card p-4 text-left ${c.bg} ${
                isActive
                  ? "ring-2 ring-navy ring-offset-2 ring-offset-[#F5EFE4]"
                  : ""
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
