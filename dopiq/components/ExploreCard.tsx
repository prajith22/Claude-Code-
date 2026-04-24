"use client";

import Link from "next/link";
import Image from "next/image";
import type { Product } from "@/types";
import { formatUSD } from "@/lib/utils";

export function ExploreCard({ product }: { product: Product }) {
  return (
    <div className="card w-full overflow-hidden">
      <div className="relative h-[320px] w-full bg-surface-alt">
        <Image
          src={product.imageUrl}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 100vw, 600px"
          className="object-cover"
          style={{ filter: "blur(0.8px)" }}
        />
      </div>
      <div className="space-y-3 p-5">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-ink-muted">
          {product.category}
        </p>
        <h3 className="text-[20px] font-bold tracking-tight">{product.name}</h3>
        <div className="flex items-center justify-between">
          <p className="font-mono text-[20px] font-bold tabular-nums text-brand">
            {formatUSD(product.price)}
          </p>
          <StarRating rating={product.rating} reviewCount={product.reviewCount} />
        </div>
        <Link href={`/shop/${product.id}`} className="btn-navy w-full">
          View Product
        </Link>
      </div>
    </div>
  );
}

function StarRating({
  rating,
  reviewCount,
}: {
  rating: number;
  reviewCount: number;
}) {
  const filled = Math.round(rating);
  return (
    <div
      className="flex items-center gap-1.5"
      aria-label={`Rating ${rating.toFixed(1)} of 5 from ${reviewCount} reviews`}
    >
      <div className="flex">
        {[0, 1, 2, 3, 4].map((i) => (
          <svg
            key={i}
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill={i < filled ? "#F59E0B" : "#E5E7EB"}
            aria-hidden
          >
            <path d="M12 2l3.09 6.26 6.91 1.01-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14l-5-4.87 6.91-1.01L12 2z" />
          </svg>
        ))}
      </div>
      <span className="text-[12px] text-ink-muted">({reviewCount})</span>
    </div>
  );
}
