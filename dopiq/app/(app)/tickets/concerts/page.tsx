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

      <div className="mx-auto mt-6 max-w-3xl space-y-3">
        {CONCERTS.map((artist) => (
          <Link
            key={artist.id}
            href={`/tickets/concerts/${artist.id}`}
            className="group flex w-full items-stretch overflow-hidden rounded-2xl border-[2.5px] bg-white transition active:scale-[0.99]"
            style={{
              borderColor: "#2A1F18",
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
            }}
          >
            {/* Per-entry pastel bgColor lives here — the one place
                each artist's color identity survives on the browse
                list. */}
            <div
              className="flex w-[120px] flex-none items-center justify-center text-5xl"
              style={{ backgroundColor: artist.bgColor }}
              aria-hidden
            >
              {artist.emoji}
            </div>
            <div className="flex flex-1 flex-col justify-center gap-1.5 py-3 pl-3 pr-3">
              <span
                className="inline-flex w-fit rounded-full border-[1.5px] bg-[#F5F0E6] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-ink"
                style={{ borderColor: "#2A1F18" }}
              >
                {artist.genre}
              </span>
              <div className="font-heading text-[18px] font-bold leading-tight text-ink">
                {artist.name}
              </div>
              <div
                className="line-clamp-2 text-sm leading-snug"
                style={{ color: TICKETS_BRAND.inkSoft }}
              >
                {artist.tagline}
              </div>
              <span
                className="inline-flex w-fit rounded-full border-[1.5px] bg-[#F5F0E6] px-2.5 py-0.5 text-[12px] font-bold text-ink"
                style={{ borderColor: "#2A1F18" }}
              >
                From ${Math.round(artist.basePrice * 0.65)}
              </span>
            </div>
          </Link>
        ))}
      </div>

      <SimDisclaimer text="All artists, tours, and ticket prices are fictional simulations. Dopiq is not affiliated with any artist, label, venue, or ticketing service. No real ticket is ever issued." />
    </div>
  );
}
