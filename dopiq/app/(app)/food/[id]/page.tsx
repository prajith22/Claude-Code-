import { notFound } from "next/navigation";
import restaurants from "@/data/restaurants.json";
import type { Restaurant } from "@/types";
import { formatUSD } from "@/lib/utils";
import { AddMenuItemButton } from "@/components/AddMenuItemButton";
import { RestaurantCheckoutBar } from "@/components/RestaurantCheckoutBar";
import { RestaurantLogo } from "@/components/RestaurantLogo";

export default function RestaurantPage({
  params,
}: {
  params: { id: string };
}) {
  const r = (restaurants as Restaurant[]).find((x) => x.id === params.id);
  if (!r) notFound();

  const byCategory = r.menu.reduce<Record<string, typeof r.menu>>(
    (acc, item) => {
      (acc[item.category] ||= []).push(item);
      return acc;
    },
    {},
  );

  return (
    <div className="space-y-6 pb-28">
      {/* Hero banner */}
      <div className="relative -mx-4 h-[200px] overflow-hidden bg-surface-alt md:mx-0 md:rounded-card">
        <RestaurantLogo
          name={r.name}
          imageUrl={r.imageUrl}
          variant="banner"
          className="absolute inset-0 flex h-full w-full items-center justify-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-navy/60 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4">
          <p className="text-[22px] font-bold text-white leading-tight">{r.name}</p>
          <p className="mt-0.5 text-[13px] text-white/80">
            {r.cuisine} · ★ {r.rating.toFixed(1)} · {r.deliveryTime} ·{" "}
            {formatUSD(r.deliveryFee)} delivery
          </p>
        </div>
      </div>

      {/* Status badge */}
      <div>
        <span className="pill-navy">Open Now</span>
      </div>

      {/* Menu sections */}
      {Object.entries(byCategory).map(([category, items]) => (
        <section key={category}>
          <h2 className="mb-3 text-[17px] font-bold tracking-tight">{category}</h2>
          <ul className="space-y-3">
            {items.map((m) => (
              <li
                key={m.id}
                className="card flex items-center justify-between gap-4 p-4"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-bold text-ink">{m.name}</p>
                  <p className="mt-1 line-clamp-2 text-[13px] leading-snug text-ink-muted">
                    {m.description}
                  </p>
                  <p className="mt-2 text-[16px] font-bold text-navy money">
                    {formatUSD(m.price)}
                  </p>
                </div>
                <AddMenuItemButton
                  restaurantId={r.id}
                  item={m}
                  restaurantName={r.name}
                />
              </li>
            ))}
          </ul>
        </section>
      ))}

      {/* Sticky checkout bar — only visible when cart has items */}
      <RestaurantCheckoutBar />
    </div>
  );
}
