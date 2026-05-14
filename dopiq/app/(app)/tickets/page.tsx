import Link from "next/link";
import { TICKETS_BRAND } from "@/data/tickets";
import { SimDisclaimer } from "@/components/SimDisclaimer";

export const dynamic = "force-dynamic";

type CategoryCard = {
  href: string;
  title: string;
  subtitle: string;
  emoji: string;
};

// Per-category pastel backgrounds previously lived here. Stripped
// in the restraint pass — every category card now uses the same
// neutral white surface + warm-dark border + dot texture, so the
// only color on each card is the emoji. Aligns the landing with
// the rest of the app's card vocabulary (Shop ProductCard, home
// hero cards, etc.).
const CATEGORIES: CategoryCard[] = [
  {
    href: "/tickets/concerts",
    title: "Concerts",
    subtitle: "Stadium acts, indie darlings, and DJs who go on at 2am.",
    emoji: "🎤",
  },
  {
    href: "/tickets/sports",
    title: "Sports",
    subtitle: "Cheer for a team you'll convince yourself you've always liked.",
    emoji: "🏟️",
  },
  {
    href: "/tickets/travel",
    title: "Travel",
    subtitle: "Flights to somewhere you'd rather be. Allegedly.",
    emoji: "✈️",
  },
];

// Auth + subscription enforced upstream by (app)/layout.tsx.
export default function TicketsLandingPage() {
  return (
    <div
      className="-mx-4 -mt-4 px-4 pt-6 pb-10"
      style={{ backgroundColor: TICKETS_BRAND.cream }}
    >
      <header className="mx-auto max-w-2xl pt-2">
        <h1 className="font-heading text-[28px] font-bold leading-tight tracking-tight text-ink">
          Tickets
        </h1>
        <p
          className="mt-1 text-[15px]"
          style={{ color: TICKETS_BRAND.inkSoft }}
        >
          Pick a fantasy. We&rsquo;ll handle the fees.
        </p>
      </header>

      <div className="mx-auto mt-6 grid max-w-2xl gap-4">
        {CATEGORIES.map((cat) => (
          <Link
            key={cat.href}
            href={cat.href}
            className="group block rounded-2xl border-[2.5px] bg-white p-5 transition active:scale-[0.99]"
            style={{
              borderColor: "#2A1F18",
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
            }}
          >
            <div className="flex items-center gap-4">
              <div
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-3xl"
                style={{ backgroundColor: TICKETS_BRAND.cream }}
                aria-hidden
              >
                {cat.emoji}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[20px] font-extrabold leading-tight text-ink">
                  {cat.title}
                </div>
                <div
                  className="mt-1 text-[13px] leading-snug"
                  style={{ color: TICKETS_BRAND.inkSoft }}
                >
                  {cat.subtitle}
                </div>
              </div>
              <div
                className="text-2xl text-ink transition group-hover:translate-x-0.5"
                aria-hidden
              >
                →
              </div>
            </div>
          </Link>
        ))}
      </div>

      <SimDisclaimer text="All artists, teams, venues, airlines, and ticket prices are fictional simulations. Dopiq is not affiliated with any artist, team, league, venue, airline, or ticketing service. No real ticket or booking is ever issued." />
    </div>
  );
}
