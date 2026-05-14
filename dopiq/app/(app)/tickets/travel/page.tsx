import Link from "next/link";
import { TRAVEL_DESTINATIONS, TICKETS_BRAND } from "@/data/tickets";
import { SimDisclaimer } from "@/components/SimDisclaimer";

export const dynamic = "force-dynamic";

// Auth + subscription enforced upstream by (app)/layout.tsx.
// Restraint pass — destinations now share the same neutral-white +
// warm-dark + dot-texture card treatment as concerts. The
// per-entry bgColor / fgColor live on in the detail-page hero.
export default function TravelBrowsePage() {
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
        <h1 className="mt-4 font-heading text-[28px] font-bold leading-tight tracking-tight text-ink">
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
              className="group block overflow-hidden rounded-2xl border-[2.5px] bg-white transition active:scale-[0.99]"
              style={{
                borderColor: "#2A1F18",
                boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
              }}
            >
              <div
                className="flex aspect-[4/3] items-center justify-center text-6xl"
                style={{ backgroundColor: TICKETS_BRAND.cream }}
                aria-hidden
              >
                {dest.emoji}
              </div>
              <div className="px-3 pb-3 pt-3">
                <div className="text-[15px] font-extrabold leading-tight text-ink">
                  {dest.city}
                </div>
                <div
                  className="text-[11px] font-semibold"
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
                  className="mt-1.5 inline-block rounded-full border-[1.5px] bg-[#F5F0E6] px-2 py-0.5 text-[11px] font-bold text-ink"
                  style={{ borderColor: "#2A1F18" }}
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
