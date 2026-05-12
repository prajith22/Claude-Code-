import Link from "next/link";
import { requireSubscribedUser } from "@/lib/session-guards";
import { SPORTS_GAMES, TICKETS_BRAND } from "@/data/tickets";
import { SimDisclaimer } from "@/components/SimDisclaimer";

export const dynamic = "force-dynamic";

export default async function SportsBrowsePage() {
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
          Sports
        </h1>
        <p
          className="mt-1 text-[15px]"
          style={{ color: TICKETS_BRAND.inkSoft }}
        >
          Twelve games. Twelve excuses to wear a foam finger.
        </p>
      </header>

      <div className="mx-auto mt-6 grid max-w-3xl gap-3 md:grid-cols-2">
        {SPORTS_GAMES.map((game) => (
          <Link
            key={game.id}
            href={`/tickets/sports/${game.id}`}
            className="group block overflow-hidden rounded-2xl transition active:scale-[0.99]"
            style={{
              backgroundColor: game.bgColor,
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
            }}
          >
            <div className="flex items-center gap-4 p-4">
              <div
                className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/60 text-4xl backdrop-blur-sm"
                aria-hidden
              >
                {game.emoji}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span
                    className="rounded-full bg-white/70 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider backdrop-blur-sm"
                    style={{ color: game.fgColor }}
                  >
                    {game.sport}
                  </span>
                </div>
                <div
                  className="mt-1 text-[15px] font-extrabold leading-tight"
                  style={{ color: game.fgColor }}
                >
                  {game.homeTeam}
                </div>
                <div
                  className="text-[12px] font-semibold"
                  style={{ color: game.fgColor, opacity: 0.85 }}
                >
                  vs {game.awayTeam}
                </div>
                <div
                  className="mt-1.5 text-[11px]"
                  style={{ color: game.fgColor, opacity: 0.7 }}
                >
                  {game.date} · {game.venue}
                </div>
              </div>
              <div
                className="rounded-full bg-white/70 px-2 py-1 text-[12px] font-bold backdrop-blur-sm"
                style={{ color: game.fgColor }}
              >
                From ${Math.round(game.basePrice * 0.65)}
              </div>
            </div>
          </Link>
        ))}
      </div>

      <SimDisclaimer text="All teams, venues, dates, and ticket prices are fictional simulations. Dopiq is not affiliated with any team, league, venue, or ticketing service. No real ticket is ever issued." />
    </div>
  );
}
