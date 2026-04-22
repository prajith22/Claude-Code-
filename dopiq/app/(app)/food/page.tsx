import Link from "next/link";
import Image from "next/image";
import restaurants from "@/data/restaurants.json";
import { requireOnboardedSubscribedUser } from "@/lib/session-guards";
import { formatUSD } from "@/lib/utils";
import type { Restaurant, Cuisine, FoodPrefs } from "@/types";
import { CartButton } from "@/components/CartButton";

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
