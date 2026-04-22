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
    <div className="space-y-5">
      <header className="flex items-center justify-between pt-2">
        <div>
          <h1 className="text-[24px] font-semibold tracking-tight">Food</h1>
          <p className="text-sm text-ink-muted">
            {preferred.length > 0
              ? `Favorites nearby: ${preferred.join(", ")}`
              : "Order in, no one actually cooks."}
          </p>
        </div>
        <CartButton kind="food" />
      </header>

      <ul className="space-y-3">
        {ordered.map((r) => (
          <li key={r.id}>
            <Link
              href={`/food/${r.id}`}
              className="card flex gap-3 overflow-hidden p-3 transition hover:shadow-cardHover active:scale-[0.995]"
            >
              <div className="relative h-24 w-24 flex-none overflow-hidden rounded-xl bg-surface-alt">
                <Image
                  src={r.imageUrl}
                  alt={r.name}
                  fill
                  sizes="96px"
                  className="object-cover"
                />
              </div>
              <div className="flex min-w-0 flex-1 flex-col justify-between">
                <div>
                  <p className="line-clamp-1 text-[16px] font-semibold">
                    {r.name}
                  </p>
                  <p className="text-xs text-ink-muted">{r.cuisine}</p>
                </div>
                <div className="flex items-center gap-3 text-xs text-ink-muted">
                  <span className="inline-flex items-center gap-1 text-ink">
                    <span aria-hidden>★</span> {r.rating.toFixed(1)}
                  </span>
                  <span>·</span>
                  <span>{r.deliveryTime}</span>
                  <span>·</span>
                  <span>{formatUSD(r.deliveryFee)} delivery</span>
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
