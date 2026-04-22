import Link from "next/link";
import Image from "next/image";
import products from "@/data/products.json";
import { requireOnboardedSubscribedUser } from "@/lib/session-guards";
import { formatUSD } from "@/lib/utils";
import type { Product, ProductCategory } from "@/types";
import { CartButton } from "@/components/CartButton";

export default async function ShopPage() {
  const user = await requireOnboardedSubscribedUser();
  const prefs = (user.shoppingPrefs ?? []) as ProductCategory[];
  const all = products as Product[];
  const featured =
    prefs.length > 0
      ? [...all.filter((p) => prefs.includes(p.category)), ...all.filter((p) => !prefs.includes(p.category))]
      : all;

  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between pt-2">
        <div>
          <h1 className="text-[24px] font-semibold tracking-tight">Shop</h1>
          <p className="text-sm text-ink-muted">
            {prefs.length > 0
              ? `Picked for you in ${prefs.join(", ")}`
              : "Fake store. Real dopamine."}
          </p>
        </div>
        <CartButton kind="shop" />
      </header>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {featured.map((p) => (
          <Link
            key={p.id}
            href={`/shop/${p.id}`}
            className="card overflow-hidden transition hover:shadow-cardHover active:scale-[0.995]"
          >
            <div className="relative aspect-square bg-surface-alt">
              <Image
                src={p.imageUrl}
                alt={p.name}
                fill
                sizes="(max-width: 768px) 50vw, 33vw"
                className="object-cover"
              />
            </div>
            <div className="p-3">
              <p className="line-clamp-2 text-[14px] font-medium text-ink">
                {p.name}
              </p>
              <div className="mt-1 flex items-center justify-between">
                <p className="text-[15px] font-semibold">{formatUSD(p.price)}</p>
                <p className="text-xs text-ink-muted">
                  ★ {p.rating.toFixed(1)}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
