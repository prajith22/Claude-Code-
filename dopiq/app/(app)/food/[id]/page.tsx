import Image from "next/image";
import { notFound } from "next/navigation";
import restaurants from "@/data/restaurants.json";
import type { Restaurant } from "@/types";
import { formatUSD } from "@/lib/utils";
import { AddMenuItemButton } from "@/components/AddMenuItemButton";
import { CartButton } from "@/components/CartButton";

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
    <div className="space-y-6">
      <div className="relative -mx-4 aspect-[16/9] overflow-hidden bg-surface-alt md:mx-0 md:rounded-2xl">
        <Image
          src={r.imageUrl}
          alt={r.name}
          fill
          sizes="(max-width: 768px) 100vw, 40rem"
          priority
          className="object-cover"
        />
      </div>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[24px] font-semibold leading-tight tracking-tight">
            {r.name}
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            {r.cuisine} · ★ {r.rating.toFixed(1)} · {r.deliveryTime} ·{" "}
            {formatUSD(r.deliveryFee)} delivery
          </p>
        </div>
        <CartButton kind="food" />
      </div>

      {Object.entries(byCategory).map(([category, items]) => (
        <section key={category}>
          <h2 className="mb-3 text-[17px] font-semibold">{category}</h2>
          <ul className="space-y-3">
            {items.map((m) => (
              <li key={m.id} className="card flex items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="text-[15px] font-medium">{m.name}</p>
                  <p className="mt-1 line-clamp-2 text-sm text-ink-muted">
                    {m.description}
                  </p>
                  <p className="mt-2 text-[15px] font-semibold">
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
    </div>
  );
}
