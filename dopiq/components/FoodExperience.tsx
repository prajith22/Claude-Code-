"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import restaurants from "@/data/restaurants.json";
import type { Restaurant, Cuisine, FoodPrefs } from "@/types";
import { formatUSD } from "@/lib/utils";
import { CartButton } from "@/components/CartButton";
import { RestaurantLogo } from "@/components/RestaurantLogo";
import { cardHover, cardHoverTransition } from "@/lib/card-hover";
import { Plate, StarFilled } from "@/components/icons";
import AmbientBreath from "@/components/motion/AmbientBreath";
import { LandingMascot } from "@/components/LandingMascot";

type Pill = { key: string; label: string };

const PILLS: Pill[] = [
  { key: "Pizza", label: "Pizza" },
  { key: "Burgers", label: "Burgers" },
  { key: "Chicken", label: "Chicken" },
  { key: "Mexican", label: "Mexican" },
  { key: "Sushi", label: "Sushi" },
  { key: "Chinese", label: "Chinese" },
  { key: "Healthy", label: "Healthy" },
  { key: "Japanese", label: "Japanese" },
  { key: "Sandwiches", label: "Sandwiches" },
  { key: "Wings", label: "Wings" },
];

const deliveryUpperMinutes = (t: string) => {
  const nums = t.match(/\d+/g);
  if (!nums) return 99;
  return parseInt(nums[nums.length - 1], 10);
};

function fisherYates<T>(input: T[]): T[] {
  const a = input.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function FoodExperience({ prefs }: { prefs: FoodPrefs | null }) {
  const [search, setSearch] = useState("");
  const [activePill, setActivePill] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<{
    popular: boolean;
    fastest: boolean;
    topRated: boolean;
  }>({ popular: false, fastest: false, topRated: false });

  // Server render and the first client render use the JSON order to
  // avoid hydration mismatches; the effect below rolls a fresh
  // random order on mount so the All Restaurants section doesn't
  // show the same names up top every visit. Sorted sections (Most
  // popular, Fastest, Top rated) re-sort by their own criteria, so
  // they aren't affected by this shuffle.
  const [all, setAll] = useState<Restaurant[]>(restaurants as Restaurant[]);
  useEffect(() => {
    setAll(fisherYates(restaurants as Restaurant[]));
  }, []);

  const baseOrdered = useMemo(() => {
    const preferred = (prefs?.cuisines ?? []) as Cuisine[];
    if (preferred.length === 0) return all;
    return [
      ...all.filter((r) => preferred.includes(r.cuisine)),
      ...all.filter((r) => !preferred.includes(r.cuisine)),
    ];
  }, [all, prefs]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return baseOrdered.filter((r) => {
      if (activePill && r.cuisine !== activePill) return false;
      if (!q) return true;
      return (
        r.name.toLowerCase().includes(q) ||
        r.cuisine.toLowerCase().includes(q)
      );
    });
  }, [baseOrdered, search, activePill]);

  const mostPopularAll = useMemo(
    () => [...filtered].sort((a, b) => b.rating - a.rating),
    [filtered],
  );
  const fastestAll = useMemo(
    () =>
      [...filtered].sort(
        (a, b) => deliveryUpperMinutes(a.deliveryTime) - deliveryUpperMinutes(b.deliveryTime),
      ),
    [filtered],
  );
  const topRatedAll = useMemo(
    () =>
      [...filtered]
        .filter((r) => r.rating > 4.5)
        .sort((a, b) => b.rating - a.rating),
    [filtered],
  );

  const hasResults = filtered.length > 0;
  const searchTerm = search.trim();
  const emptyLabel = searchTerm || activePill || "";

  return (
    <div className="space-y-5 pb-4">
      {/* Hero header */}
      <header className="flex items-start justify-between gap-3 pt-2">
        <div className="min-w-0 flex-1">
          <h1 className="type-hero-food text-[48px] leading-tight tracking-tight md:text-[64px]">
            Food for you!
          </h1>
          <button
            type="button"
            className="pill-glass mt-2 inline-flex items-center gap-1.5 rounded-pill px-3 py-1.5 text-[13px] font-semibold text-ink transition active:scale-[0.98]"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden
              className="text-brand"
            >
              <path
                d="M12 22s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12Z"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />
              <circle cx="12" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.8" />
            </svg>
            Austin, TX
            <svg
              width="12"
              height="12"
              viewBox="0 0 16 16"
              fill="none"
              aria-hidden
              className="text-ink-muted"
            >
              <path
                d="M4 6l4 4 4-4"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-3">
          <CartButton kind="food" />
          <LandingMascot src="/onboarding/dopiq-dog4.png" />
        </div>
      </header>

      {/* Search */}
      <div className="relative">
        <svg
          width="16"
          height="16"
          viewBox="0 0 20 20"
          fill="none"
          aria-hidden
          className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted"
        >
          <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.8" />
          <path d="m14 14 4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search restaurants or cuisines..."
          className="input-glass w-full rounded-pill py-3 pl-11 pr-11 text-[14px] text-ink placeholder:text-ink-faint transition-all duration-150 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch("")}
            aria-label="Clear search"
            className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-surface-alt text-ink-muted transition hover:bg-surface-border"
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden>
              <path
                d="M4 4l8 8M12 4l-8 8"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Cuisine emoji filter row */}
      <div
        className="-mx-4 overflow-x-auto [&::-webkit-scrollbar]:hidden"
        style={{ scrollbarWidth: "none" }}
      >
        <div className="flex gap-2 px-4">
          {/* All — reset pill. Active when no cuisine is selected.
              Sits first so users can return to the unfiltered list
              with one tap, mirroring the Shop page's pill row. */}
          <motion.button
            type="button"
            onClick={() => setActivePill(null)}
            aria-pressed={activePill === null}
            whileTap={{ scale: 0.95 }}
            className={`type-magnetic font-geometric flex flex-none items-center rounded-pill px-4 py-2 text-[13px] font-semibold transition ${
              activePill === null
                ? "pill-glass-active scale-[1.02]"
                : "pill-food text-ink"
            }`}
          >
            All
          </motion.button>
          {PILLS.map((p) => {
            const selected = activePill === p.key;
            return (
              <motion.button
                key={p.key}
                type="button"
                onClick={() => setActivePill(selected ? null : p.key)}
                aria-pressed={selected}
                whileTap={{ scale: 0.95 }}
                className={`type-magnetic font-geometric flex flex-none items-center rounded-pill px-4 py-2 text-[13px] font-semibold transition ${
                  selected
                    ? "pill-glass-active scale-[1.02]"
                    : "pill-food text-ink"
                }`}
              >
                {p.label}
              </motion.button>
            );
          })}
        </div>
      </div>

      {!hasResults ? (
        <div className="surface-food flex flex-col items-center gap-2 p-10 text-center">
          <Plate size={32} className="text-ink-faint" />
          <p className="text-[15px] font-semibold text-ink">
            No restaurants for &ldquo;{emptyLabel || "your search"}&rdquo;.
          </p>
          <p className="text-[13px] text-ink-muted">
            Try a different cuisine or clear your filters.
          </p>
        </div>
      ) : (
        <>
          <CategorySection
            title="Most popular"
            items={mostPopularAll.slice(0, 4)}
            allItems={mostPopularAll}
            expanded={expanded.popular}
            onToggle={() =>
              setExpanded((e) => ({ ...e, popular: !e.popular }))
            }
          />
          <CategorySection
            title="Fastest delivery"
            items={fastestAll.slice(0, 4)}
            allItems={fastestAll}
            expanded={expanded.fastest}
            onToggle={() =>
              setExpanded((e) => ({ ...e, fastest: !e.fastest }))
            }
          />
          {topRatedAll.length > 0 && (
            <CategorySection
              title="Top rated"
              items={topRatedAll}
              allItems={topRatedAll}
              expanded={expanded.topRated}
              onToggle={() =>
                setExpanded((e) => ({ ...e, topRated: !e.topRated }))
              }
            />
          )}

          <section>
            <h2 className="mb-3 text-[17px] font-bold tracking-tight">
              All Restaurants
            </h2>
            <ul className="space-y-4">
              {filtered.map((r, i) => (
                <li key={r.id}>
                  <AmbientBreath duration={4 + ((i % 5) * 0.08)} amplitude={1}>
                    <RestaurantRow r={r} />
                  </AmbientBreath>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}

function CategorySection({
  title,
  items,
  allItems,
  expanded,
  onToggle,
}: {
  title: string;
  items: Restaurant[];
  allItems: Restaurant[];
  expanded: boolean;
  onToggle: () => void;
}) {
  if (allItems.length === 0) return null;
  const display = expanded ? allItems : items;
  const canExpand = allItems.length > items.length;

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-[17px] font-bold tracking-tight">{title}</h2>
        {canExpand && (
          <button
            type="button"
            onClick={onToggle}
            className="text-[13px] font-semibold text-brand transition hover:text-brand-dark"
          >
            {expanded ? "Show less" : "See all"}
          </button>
        )}
      </div>

      {expanded ? (
        <div className="grid grid-cols-2 gap-3">
          {display.map((r, i) => (
            <AmbientBreath
              key={r.id}
              duration={3.6 + ((i % 5) * 0.2)}
              amplitude={1}
            >
              <CompactCard r={r} fullWidth />
            </AmbientBreath>
          ))}
        </div>
      ) : (
        <div
          className="-mx-4 overflow-x-auto [&::-webkit-scrollbar]:hidden"
          style={{ scrollbarWidth: "none" }}
        >
          <div className="flex gap-3 px-4 pb-4 pt-3">
            {display.map((r, i) => (
              <AmbientBreath
                key={r.id}
                duration={3.8 + ((i % 4) * 0.2)}
                amplitude={1}
                className="flex-none"
              >
                <CompactCard r={r} />
              </AmbientBreath>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function CompactCard({
  r,
  fullWidth = false,
}: {
  r: Restaurant;
  fullWidth?: boolean;
}) {
  return (
    <motion.div
      // Card frame inlined (was the shared `.card` utility) so we
      // can swap its 1px surface-border for the 2.5px warm-dark
      // border without touching .card globally — keeps cart /
      // checkout / tracking screens on their existing 1px frame.
      className={`surface-food-fill relative flex-none rounded-card border-[2.5px] shadow-card ${
        fullWidth ? "w-full" : "w-[220px]"
      }`}
      style={{ borderColor: "#2A1F18" }}
      whileHover={cardHover}
      whileTap={{ scale: 0.98 }}
      transition={cardHoverTransition}
    >
      <Link
        href={`/food/${r.id}`}
        className="group block active:scale-[0.995]"
      >
        <div className="relative aspect-square w-full overflow-hidden rounded-t-card bg-surface-alt">
          <RestaurantLogo
            name={r.name}
            imageUrl={r.imageUrl}
            className="h-full w-full"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, transparent 60%, rgba(245,158,11,0.08) 100%)",
            }}
          />
        </div>
        <div className="p-3">
          <p className="truncate font-heading text-[14px] font-bold text-ink">{r.name}</p>
          <div className="mt-1 flex items-center gap-2 text-[12px]">
            <span className="flex items-center gap-1 font-semibold text-ink">
              <StarFilled size={11} />
              {r.rating.toFixed(1)}
            </span>
            <span className="text-ink-muted">·</span>
            <span className="truncate text-ink-muted">{r.deliveryTime}</span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

function RestaurantRow({ r }: { r: Restaurant }) {
  return (
    <motion.div
      // Card frame inlined (was the shared `.card` utility) so the
      // 1px surface-border can be swapped for the 2.5px warm-dark
      // border without touching .card globally.
      className="surface-food-fill relative rounded-card border-[2.5px] shadow-card"
      style={{ borderColor: "#2A1F18" }}
      whileHover={cardHover}
      whileTap={{ scale: 0.98 }}
      transition={cardHoverTransition}
    >
      <Link
        href={`/food/${r.id}`}
        className="group block active:scale-[0.995]"
      >
        <div className="relative h-44 w-full overflow-hidden rounded-t-card bg-surface-alt md:h-52">
          <RestaurantLogo
            name={r.name}
            imageUrl={r.imageUrl}
            variant="banner"
            className="flex h-full w-full items-center justify-center"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, transparent 60%, rgba(245,158,11,0.08) 100%)",
            }}
          />
          <span className="absolute left-3 top-3 flex items-center gap-1.5 rounded-pill bg-navy/80 px-3 py-1.5 backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-brand" />
            </span>
            <span className="text-[11px] font-bold text-white">Open Now</span>
          </span>
        </div>
        <div className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-heading text-[18px] font-bold leading-tight text-ink">
                {r.name}
              </p>
              <p className="mt-0.5 text-[13px] text-ink-muted">{r.cuisine}</p>
            </div>
            <span className="flex-none rounded-pill border border-surface-border px-3 py-1 text-[12px] font-semibold text-ink-muted">
              {r.deliveryTime}
            </span>
          </div>
          <div className="mt-3 flex items-center gap-3 text-[13px]">
            <span className="flex items-center gap-1 font-semibold text-brand">
              ★ {r.rating.toFixed(1)}
            </span>
            <span className="text-ink-muted">·</span>
            <span className="text-ink-muted">
              {formatUSD(r.deliveryFee)} delivery
            </span>
            <span className="text-ink-muted">·</span>
            <span className="text-ink-muted">Simulated order</span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
