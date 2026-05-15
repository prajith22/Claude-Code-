import Link from "next/link";
import { SPORTS_GAMES, TICKETS_BRAND } from "@/data/tickets";
import { SimDisclaimer } from "@/components/SimDisclaimer";

export const dynamic = "force-dynamic";

// Auth + subscription enforced upstream by (app)/layout.tsx.
// Restraint pass — cards drop per-entry bgColor/fgColor for a
// neutral white + warm-dark border + dot-texture treatment. The
// game/team identity color survives on the detail-page hero.
export default function SportsBrowsePage() {
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
          Sports
        </h1>
        <p
          className="mt-1 text-[15px]"
          style={{ color: TICKETS_BRAND.inkSoft }}
        >
          Twelve games. Twelve excuses to wear a foam finger.
        </p>
      </header>

      <div className="mx-auto mt-6 max-w-3xl space-y-3">
        {SPORTS_GAMES.map((game) => (
          <Link
            key={game.id}
            href={`/tickets/sports/${game.id}`}
            className="group flex w-full items-stretch overflow-hidden rounded-2xl border-[2.5px] bg-white transition active:scale-[0.99]"
            style={{
              borderColor: "#2A1F18",
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
            }}
          >
            {/* Per-entry pastel bgColor lives here — the one place
                each game's color identity survives on the browse
                list. */}
            <div
              className="flex w-[120px] flex-none items-center justify-center text-5xl"
              style={{ backgroundColor: game.bgColor }}
              aria-hidden
            >
              {game.emoji}
            </div>
            <div className="flex flex-1 flex-col justify-center gap-1.5 py-3 pl-3 pr-3">
              <span
                className="inline-flex w-fit rounded-full border-[1.5px] bg-[#F5F0E6] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-ink"
                style={{ borderColor: "#2A1F18" }}
              >
                {game.sport}
              </span>
              <div className="font-heading text-[18px] font-bold leading-tight text-ink">
                {game.homeTeam}
              </div>
              <div
                className="text-[13px] font-semibold leading-snug"
                style={{ color: TICKETS_BRAND.inkSoft }}
              >
                vs {game.awayTeam}
              </div>
              <div
                className="line-clamp-1 text-[12px] leading-snug"
                style={{ color: TICKETS_BRAND.inkSoft }}
              >
                {game.date} · {game.venue}
              </div>
              <span
                className="inline-flex w-fit rounded-full border-[1.5px] bg-[#F5F0E6] px-2.5 py-0.5 text-[12px] font-bold text-ink"
                style={{ borderColor: "#2A1F18" }}
              >
                From ${Math.round(game.basePrice * 0.65)}
              </span>
            </div>
          </Link>
        ))}
      </div>

      <SimDisclaimer text="All teams, venues, dates, and ticket prices are fictional simulations. Dopiq is not affiliated with any team, league, venue, or ticketing service. No real ticket is ever issued." />
    </div>
  );
}
