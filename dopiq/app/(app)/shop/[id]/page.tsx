import Image from "next/image";
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
    <div className="space-y-6">
      <div className="relative -mx-4 aspect-square overflow-hidden bg-surface-alt md:mx-0 md:rounded-2xl">
        <Image
          src={product.imageUrl}
          alt={product.name}
          fill
          sizes="(max-width: 768px) 100vw, 40rem"
          priority
          className="object-cover"
        />
      </div>

      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">
          {product.category}
        </p>
        <h1 className="mt-1 text-[24px] font-semibold leading-tight tracking-tight">
          {product.name}
        </h1>
        <div className="mt-2 flex items-center gap-2 text-sm text-ink-muted">
          <span>★ {product.rating.toFixed(1)}</span>
          <span>·</span>
          <span>{product.reviewCount.toLocaleString()} reviews</span>
        </div>
        <p className="mt-4 text-[28px] font-semibold tracking-tight">
          {formatUSD(product.price)}
        </p>
      </div>

      <p className="text-[15px] leading-relaxed text-ink">
        {product.description}
      </p>

      <AddToCartControls product={product} />

      <section aria-labelledby="reviews" className="pt-2">
        <h2 id="reviews" className="text-[17px] font-semibold">
          What buyers say
        </h2>
        <ul className="mt-3 space-y-3">
          {reviews.map((r) => (
            <li
              key={r.author}
              className="card p-4"
            >
              <div className="flex items-center justify-between text-xs text-ink-muted">
                <span className="font-medium text-ink">{r.author}</span>
                <span>★ {r.rating}</span>
              </div>
              <p className="mt-2 text-[14px] text-ink">{r.body}</p>
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
