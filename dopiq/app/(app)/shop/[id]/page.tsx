import { notFound } from "next/navigation";
import products from "@/data/products.json";
import type { Product } from "@/types";
import { formatUSD } from "@/lib/utils";
import { AddToCartControls } from "@/components/AddToCartControls";

export default function ProductDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const product = (products as Product[]).find((p) => p.id === params.id);
  if (!product) notFound();

  const reviews = buildFakeReviews(product);

  return (
    <div className="space-y-6 pb-4">
      {/* Hero image — capped at 600px, centered, never upscaled past natural size */}
      <div className="mx-auto w-full max-w-[600px] overflow-hidden rounded-card bg-surface-alt">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.imageUrl}
          alt={product.name}
          className="mx-auto block h-auto w-auto max-w-full"
        />
      </div>

      {/* Info */}
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="pill-navy">{product.category}</span>
          <span className="pill-brand">No real money</span>
        </div>
        <h1 className="mt-3 text-[26px] font-bold leading-tight tracking-tight text-ink">
          {product.name}
        </h1>
        <div className="mt-2 flex items-center gap-2 text-sm">
          <span className="font-semibold text-brand">★ {product.rating.toFixed(1)}</span>
          <span className="text-ink-muted">·</span>
          <span className="text-ink-muted">
            {product.reviewCount.toLocaleString()} reviews
          </span>
        </div>
        <p className="mt-3 text-[34px] font-bold tracking-tight text-navy money">
          {formatUSD(product.price)}
        </p>
      </div>

      <p className="text-[15px] leading-relaxed text-ink">{product.description}</p>

      {/* Add to cart — sticky on mobile, inline on desktop */}
      <AddToCartControls product={product} />

      {/* Reviews */}
      <section aria-labelledby="reviews-heading" className="pt-2">
        <h2
          id="reviews-heading"
          className="mb-3 text-[17px] font-bold tracking-tight"
        >
          What buyers say
        </h2>
        <ul className="space-y-3">
          {reviews.map((r) => (
            <li key={r.author} className="card p-4">
              <div className="flex items-center justify-between">
                <span className="text-[14px] font-semibold text-ink">{r.author}</span>
                <span className="text-[12px] font-semibold text-brand">★ {r.rating}</span>
              </div>
              <p className="mt-2 text-[14px] leading-relaxed text-ink">
                {r.body}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function buildFakeReviews(p: Product) {
  return [
    {
      author: "Riley M.",
      rating: 5,
      body: `Genuinely better than I expected. ${p.name} showed up exactly as described and I've been using it daily.`,
    },
    {
      author: "Jordan P.",
      rating: 5,
      body: "Looks clean, feels premium. Would buy again without thinking.",
    },
    {
      author: "Alex K.",
      rating: 4,
      body: "Solid for the price. Took me a couple days to notice how much I use it.",
    },
  ];
}
