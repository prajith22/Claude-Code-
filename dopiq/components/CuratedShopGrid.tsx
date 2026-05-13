"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import type { Product, ProductCategory } from "@/types";

export type CuratedFilter =
  | { kind: "category"; cat: ProductCategory }
  | { kind: "top-picks" };

type Tile = {
  key: string;
  label: string;
  imageUrl: string;
  filter: CuratedFilter;
};

const ORDER: ProductCategory[] = [
  "Clothes",
  "Electronics",
  "Beauty",
  "Home Goods",
  "Sports",
];

/**
 * Builds the 6 curated tiles. Each category tile uses its highest-
 * rated product's image as the full-bleed hero photo, and the final
 * tile ("Top Picks") uses the overall #1 rated product. No new
 * image assets are introduced — every background is already in
 * /public/products.
 */
export function buildCuratedTiles(products: Product[]): Tile[] {
  const tiles: Tile[] = ORDER.map((cat) => {
    const hero = [...products]
      .filter((p) => p.category === cat)
      .sort((a, b) => b.rating - a.rating)[0];
    return {
      key: cat,
      label: cat,
      imageUrl: hero?.imageUrl ?? "",
      filter: { kind: "category", cat },
    };
  });
  const overallHero = [...products].sort((a, b) => b.rating - a.rating)[0];
  tiles.push({
    key: "top-picks",
    label: "Top Picks",
    imageUrl: overallHero?.imageUrl ?? "",
    filter: { kind: "top-picks" },
  });
  return tiles;
}

/**
 * Anthropologie-style 2x3 magazine grid. Each tile is a full-bleed
 * image with a subtle bottom gradient + a single centered serif label.
 * Tapping a tile drives the parent's filter state and smooth-scrolls
 * to the Browse section below.
 */
export function CuratedShopGrid({
  products,
  onSelect,
}: {
  products: Product[];
  onSelect: (filter: CuratedFilter) => void;
}) {
  const tiles = buildCuratedTiles(products);

  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      aria-label="Curated categories"
    >
      <div className="grid grid-cols-2 gap-3 md:gap-4">
        {tiles.map((tile, i) => (
          <motion.button
            key={tile.key}
            type="button"
            onClick={() => onSelect(tile.filter)}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            // Staggered entry so the grid resolves diagonally rather
            // than all-at-once — feels more editorial.
            style={{ transitionDelay: `${i * 40}ms` }}
            className="group relative aspect-[4/5] overflow-hidden rounded-[20px] bg-surface-alt shadow-card transition-shadow duration-200 hover:shadow-cardHover"
            aria-label={`Browse ${tile.label}`}
          >
            {tile.imageUrl && (
              <Image
                src={tile.imageUrl}
                alt=""
                fill
                sizes="(max-width: 768px) 50vw, 33vw"
                className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
              />
            )}
            {/* Bottom gradient for label legibility */}
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "linear-gradient(to top, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.15) 35%, rgba(0,0,0,0) 60%)",
              }}
            />
            {/* Centered serif label — bottom-aligned but with breathing room */}
            <span className="absolute inset-x-0 bottom-0 flex items-end justify-center pb-5">
              <span className="font-display text-[22px] font-medium leading-none tracking-wide text-white drop-shadow-sm md:text-[26px]">
                {tile.label}
              </span>
            </span>
          </motion.button>
        ))}
      </div>
    </motion.section>
  );
}
