"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Product } from "@/types";
import { formatUSD } from "@/lib/utils";
import { cardHover } from "@/lib/card-hover";
import { Clock } from "@/components/icons";

type Deal = {
  id: string;
  product: Product;
  originalPrice: number;
  discountedPrice: number;
  discountPct: number;
  endsAt: number;
  stockLeft: number;
};

const MIN_MS = 30 * 60 * 1000;
const MAX_MS = 4 * 60 * 60 * 1000;

function makeDeal(product: Product, exclude: Set<string>): Deal {
  const discountPct = Math.floor(Math.random() * 16) + 15; // 15–30
  const discounted = +(product.price * (1 - discountPct / 100)).toFixed(2);
  const dur = Math.floor(Math.random() * (MAX_MS - MIN_MS)) + MIN_MS;
  exclude.add(product.id);
  return {
    id: `${product.id}-${Date.now()}-${Math.floor(Math.random() * 9999)}`,
    product,
    originalPrice: product.price,
    discountedPrice: discounted,
    discountPct,
    endsAt: Date.now() + dur,
    stockLeft: Math.floor(Math.random() * 9) + 1,
  };
}

function pickRandom(products: Product[], exclude: Set<string>): Product | null {
  const pool = products.filter((p) => !exclude.has(p.id));
  if (pool.length === 0) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}

export function FlashDeals({ products }: { products: Product[] }) {
  const [deals, setDeals] = useState<Deal[]>([]);

  useEffect(() => {
    const exclude = new Set<string>();
    const initial: Deal[] = [];
    const count = Math.min(3, products.length);
    for (let i = 0; i < count; i++) {
      const p = pickRandom(products, exclude);
      if (p) initial.push(makeDeal(p, exclude));
    }
    setDeals(initial);
  }, [products]);

  function handleExpired(dealId: string) {
    setTimeout(() => {
      setDeals((prev) => {
        const exclude = new Set(prev.map((d) => d.product.id));
        const replacement = pickRandom(products, exclude);
        if (!replacement) return prev;
        const fresh = makeDeal(replacement, exclude);
        return prev.map((d) => (d.id === dealId ? fresh : d));
      });
    }, 3000);
  }

  if (deals.length === 0) return null;

  return (
    <section>
      <div className="mb-3 flex items-center gap-2">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
        </span>
        <h2 className="text-[18px] font-bold tracking-tight">Flash Deals</h2>
        <span className="text-[12px] font-medium text-ink-muted">
          Live · ends today
        </span>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <AnimatePresence mode="popLayout" initial={false}>
          {deals.map((deal) => (
            <DealCard key={deal.id} deal={deal} onExpired={handleExpired} />
          ))}
        </AnimatePresence>
      </div>
    </section>
  );
}

function DealCard({
  deal,
  onExpired,
}: {
  deal: Deal;
  onExpired: (id: string) => void;
}) {
  const [now, setNow] = useState(() => Date.now());
  const expiredFiredRef = useRef(false);

  useEffect(() => {
    expiredFiredRef.current = false;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [deal.id]);

  const remaining = Math.max(0, deal.endsAt - now);
  const expired = remaining === 0;

  useEffect(() => {
    if (expired && !expiredFiredRef.current) {
      expiredFiredRef.current = true;
      onExpired(deal.id);
    }
  }, [expired, deal.id, onExpired]);

  if (expired) {
    return (
      <motion.div
        layout
        initial={{ opacity: 1 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.25 }}
        className="card flex min-h-[220px] flex-col items-center justify-center gap-2 p-5 text-center"
      >
        <Clock size={28} className="text-ink-faint" />
        <p className="text-[15px] font-bold text-ink">Deal Expired</p>
        <p className="text-[12px] text-ink-muted">A new drop is loading…</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      whileHover={cardHover}
      transition={{ duration: 0.3 }}
      className="card relative overflow-hidden"
    >
      <Link href={`/shop/${deal.product.id}`} className="block">
        <div className="relative h-[200px] overflow-hidden bg-surface-alt">
          {/* Raw <img> to match the grid and detail page — keeps local
              /products/*.webp paths out of the Next image optimizer. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={deal.product.imageUrl}
            alt={deal.product.name}
            className="h-full w-full object-cover"
            style={{ filter: "blur(0.8px)" }}
          />
          <span className="absolute left-3 top-3 rounded-pill bg-red-600 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">
            Flash Deal
          </span>
          <span className="absolute right-3 top-3 rounded-pill bg-navy/85 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur-sm">
            -{deal.discountPct}%
          </span>
        </div>
        <div className="p-3">
          <p className="line-clamp-1 text-[14px] font-bold text-ink">
            {deal.product.name}
          </p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="font-mono text-[16px] font-bold text-red-600">
              {formatUSD(deal.discountedPrice)}
            </span>
            <span className="font-mono text-[12px] text-ink-muted line-through">
              {formatUSD(deal.originalPrice)}
            </span>
          </div>
          <Countdown ms={remaining} />
          <p className="mt-1 text-[11px] font-semibold text-orange-600">
            Only {deal.stockLeft} left!
          </p>
        </div>
      </Link>
    </motion.div>
  );
}

function Countdown({ ms }: { ms: number }) {
  const totalSec = Math.floor(ms / 1000);
  const hh = String(Math.floor(totalSec / 3600)).padStart(2, "0");
  const mm = String(Math.floor((totalSec % 3600) / 60)).padStart(2, "0");
  const ss = String(totalSec % 60).padStart(2, "0");
  return (
    <p className="mt-1.5 font-mono text-[13px] font-bold tabular-nums text-navy">
      {hh}:{mm}:{ss}
    </p>
  );
}
