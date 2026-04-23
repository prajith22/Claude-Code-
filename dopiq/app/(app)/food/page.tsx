import Link from "next/link";
import Image from "next/image";
import restaurants from "@/data/restaurants.json";
import { requireOnboardedSubscribedUser } from "@/lib/session-guards";
import { formatUSD } from "@/lib/utils";
import type { Restaurant, Cuisine, FoodPrefs } from "@/types";
import { CartButton } from "@/components/CartButton";
import { FoodPromoBanner } from "@/components/FoodPromoBanner";

export default async function FoodPage() {
  const user = await requireOnboardedSubscribedUser();
  const prefs = (user.foodPrefs as FoodPrefs | null) ?? null;
  const preferred = (prefs?.cuisines ?? []) as Cuisine[];
  const all = restaurants as Restaurant[];
  const ordered =
    preferred.length > 0
      ? [
          ...all.filter((r) => preferred.includes(r.cuisine)),
          ...all.filter((r) => !preferred.includes(r.cuisine)),
        ]
      : all;

  return (
    <div className="space-y-5 pb-4">
      <header className="flex items-center justify-between pt-2">
        <div>
          <h1 className="text-[26px] font-bold tracking-tight">Food</h1>
          <p className="mt-0.5 text-sm text-ink-muted">
            {preferred.length > 0
              ? `Favorites: ${preferred.join(", ")}`
              : "Order in. No one actually cooks."}
          </p>
        </div>
        <CartButton kind="food" />
      </header>

      {/* Address bar */}
      <div className="flex items-center gap-3 rounded-pill border border-surface-border bg-white px-4 py-2.5">
        <span
          aria-hidden
          className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-brand-light text-brand"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden
          >
            <path
              d="M12 22s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12Z"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
            <circle cx="12" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.8" />
          </svg>
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-ink-muted">
            Deliver to
          </p>
          <p className="truncate text-[13px] font-bold text-ink">
            Home · 1 Dopamine Way
          </p>
        </div>
        <svg
          width="14"
          height="14"
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden
          className="flex-none text-ink-muted"
        >
          <path
            d="M4 6l4 4 4-4"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* Promo banner (dismissable) */}
      <FoodPromoBanner />

      <ul className="space-y-4">
        {ordered.map((r) => (
          <li key={r.id}>
            <Link
              href={`/food/${r.id}`}
              className="group card overflow-hidden transition-all duration-150 hover:shadow-cardHover active:scale-[0.995]"
            >
              {/* Large banner image */}
              <div className="relative h-44 w-full overflow-hidden bg-surface-alt md:h-52">
                <Image
                  src={r.imageUrl}
                  alt={r.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 48rem"
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
                {/* Open Now badge */}
                <span className="absolute left-3 top-3 flex items-center gap-1.5 rounded-pill bg-navy/80 px-3 py-1.5 backdrop-blur-sm">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-brand" />
                  </span>
                  <span className="text-[11px] font-bold text-white">Open Now</span>
                </span>
              </div>

              {/* Info */}
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[18px] font-bold text-ink leading-tight">
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
          </li>
        ))}
      </ul>
    </div>
  );
}
