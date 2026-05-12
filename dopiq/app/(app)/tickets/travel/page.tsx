import Link from "next/link";
import { requireSubscribedUser } from "@/lib/session-guards";
import { TRAVEL_DESTINATIONS, TICKETS_BRAND } from "@/data/tickets";
import { SimDisclaimer } from "@/components/SimDisclaimer";

export const dynamic = "force-dynamic";

export default async function TravelBrowsePage() {
  await requireSubscribedUser();

  return (
    <div
      className="-mx-4 -mt-4 px-4 pt-6 pb-10"
      style={{ backgroundColor: TICKETS_BRAND.cream }}
    >
      <header className="mx-auto max-w-3xl pt-2">
        <Link
          href="/tickets"
          className="inline-flex items-center gap-1 text-[13px] font-semibold"
          style={{ color: TICKETS_BRAND.emerald }}
        >
          ← Tickets
        </Link>
        <h1
          className="mt-2 text-[32px] font-extrabold leading-tight tracking-tight"
          style={{ color: TICKETS_BRAND.ink }}
        >
          Travel
        </h1>
        <p
          className="mt-1 text-[15px]"
          style={{ color: TICKETS_BRAND.inkSoft }}
        >
          Twelve cities you keep telling people you&rsquo;ll visit.
        </p>
      </header>

      <div className="mx-auto mt-6 grid max-w-3xl grid-cols-2 gap-3 md:grid-cols-3">
        {TRAVEL_DESTINATIONS.map((dest) => {
          const cheapest = Math.min(...dest.airlines.map((a) => a.basePrice));
          return (
            <Link
              key={dest.id}
              href={`/tickets/travel/${dest.id}`}
              className="group block overflow-hidden rounded-2xl border bg-white transition active:scale-[0.99]"
              style={{
                borderColor: TICKETS_BRAND.creamDeep,
                boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
              }}
            >
              <div
                className="flex aspect-[4/3] items-center justify-center text-6xl"
                style={{ backgroundColor: dest.bgColor }}
                aria-hidden
              >
                {dest.emoji}
              </div>
              <div className="p-3">
                <div
                  className="text-[15px] font-bold leading-tight"
                  style={{ color: TICKETS_BRAND.ink }}
                >
                  {dest.city}
                </div>
                <div
                  className="text-[11px]"
                  style={{ color: TICKETS_BRAND.inkSoft }}
                >
                  {dest.country}
                </div>
                <div
                  className="mt-1 line-clamp-1 text-[11px] italic"
                  style={{ color: TICKETS_BRAND.inkSoft }}
                >
                  {dest.tagline}
                </div>
                <div
                  className="mt-1.5 text-[12px] font-semibold"
                  style={{ color: TICKETS_BRAND.emerald }}
                >
                  From ${cheapest}
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <SimDisclaimer text="All airlines, routes, and fares are fictional simulations. Dopiq is not affiliated with any airline, travel service, or booking platform. No real flight is ever booked." />
    </div>
  );
}
