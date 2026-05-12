import Link from "next/link";
import { requireSubscribedUser } from "@/lib/session-guards";
import { CONCERTS, TICKETS_BRAND } from "@/data/tickets";
import { SimDisclaimer } from "@/components/SimDisclaimer";

export const dynamic = "force-dynamic";

export default async function ConcertsBrowsePage() {
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
            className="group block overflow-hidden rounded-2xl transition active:scale-[0.99]"
            style={{
              backgroundColor: artist.bgColor,
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
            }}
          >
            <div
              className="flex aspect-[4/3] items-center justify-center text-6xl"
              aria-hidden
            >
              {artist.emoji}
            </div>
            <div className="px-3 pb-3">
              <div className="flex items-center gap-1.5">
                <span
                  className="rounded-full bg-white/70 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider backdrop-blur-sm"
                  style={{ color: artist.fgColor }}
                >
                  {artist.genre}
                </span>
              </div>
              <div
                className="mt-1.5 text-[15px] font-extrabold leading-tight"
                style={{ color: artist.fgColor }}
              >
                {artist.name}
              </div>
              <div
                className="mt-0.5 line-clamp-1 text-[11px]"
                style={{ color: artist.fgColor, opacity: 0.75 }}
              >
                {artist.tagline}
              </div>
              <div
                className="mt-2 inline-block rounded-full bg-white/70 px-2 py-0.5 text-[11px] font-bold backdrop-blur-sm"
                style={{ color: artist.fgColor }}
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
