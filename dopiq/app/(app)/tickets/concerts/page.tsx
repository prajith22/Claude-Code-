import Link from "next/link";
import { CONCERTS, TICKETS_BRAND } from "@/data/tickets";
import { SimDisclaimer } from "@/components/SimDisclaimer";

export const dynamic = "force-dynamic";

// Auth + subscription enforced upstream by (app)/layout.tsx.
//
// Restraint pass: per-entry pastel bgColor / fgColor are no longer
// consumed by the browse-grid cards. The data fields stay in
// data/tickets.ts because the detail-page hero still uses them as
// the one place each artist's color identity lives.
export default function ConcertsBrowsePage() {
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
          Concerts
        </h1>
        <p
          className="mt-1 text-[15px]"
          style={{ color: TICKETS_BRAND.inkSoft }}
        >
          Tickets selling fast for shows you&rsquo;d only attend in a parallel
          universe.
        </p>
      </header>

      <div className="mx-auto mt-6 grid max-w-3xl grid-cols-2 gap-3 md:grid-cols-3">
        {CONCERTS.map((artist) => (
          <Link
            key={artist.id}
            href={`/tickets/concerts/${artist.id}`}
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
              {artist.emoji}
            </div>
            <div className="px-3 pb-3 pt-3">
              <span
                className="block w-full rounded-full border-[1.5px] bg-[#F5F0E6] px-2 py-0.5 text-left text-[9px] font-bold uppercase tracking-wider text-ink"
                style={{ borderColor: "#2A1F18" }}
              >
                {artist.genre}
              </span>
              <div className="mt-1.5 text-[15px] font-extrabold leading-tight text-ink">
                {artist.name}
              </div>
              <div
                className="mt-0.5 line-clamp-1 text-[11px]"
                style={{ color: TICKETS_BRAND.inkSoft }}
              >
                {artist.tagline}
              </div>
              <div
                className="mt-2 block w-full rounded-full border-[1.5px] bg-[#F5F0E6] px-2.5 py-0.5 text-left text-[11px] font-bold text-ink"
                style={{ borderColor: "#2A1F18" }}
              >
                From ${Math.round(artist.basePrice * 0.65)}
              </div>
            </div>
          </Link>
        ))}
      </div>

      <SimDisclaimer text="All artists, tours, and ticket prices are fictional simulations. Dopiq is not affiliated with any artist, label, venue, or ticketing service. No real ticket is ever issued." />
    </div>
  );
}
