import Link from "next/link";
import { TICKETS_BRAND } from "@/data/tickets";
import { SimDisclaimer } from "@/components/SimDisclaimer";

export const dynamic = "force-dynamic";

type CategoryCard = {
  href: string;
  title: string;
  subtitle: string;
  emoji: string;
  bg: string;
  fg: string;
};

// Three of the home-grid SimCard tints reused here so the Tickets
// hub reads as part of the same card vocabulary (lavender / sky /
// soft yellow). Each fg is dark enough that the title, subtitle,
// and arrow all clear WCAG-large on the tinted surface.
const CATEGORIES: CategoryCard[] = [
  {
    href: "/tickets/concerts",
    title: "Concerts",
    subtitle: "Stadium acts, indie darlings, and DJs who go on at 2am.",
    emoji: "🎤",
    bg: "#E8E3FF",
    fg: "#4C1D95",
  },
  {
    href: "/tickets/sports",
    title: "Sports",
    subtitle: "Cheer for a team you'll convince yourself you've always liked.",
    emoji: "🏟️",
    bg: "#DBEAFE",
    fg: "#1E3A8A",
  },
  {
    href: "/tickets/travel",
    title: "Travel",
    subtitle: "Flights to somewhere you'd rather be. Allegedly.",
    emoji: "✈️",
    bg: "#FFF3CD",
    fg: "#78350F",
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
        <h1
          className="text-[32px] font-extrabold leading-tight tracking-tight"
          style={{ color: TICKETS_BRAND.ink }}
        >
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
            className="group block rounded-2xl p-5 transition active:scale-[0.99]"
            style={{
              backgroundColor: cat.bg,
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
            }}
          >
            <div className="flex items-center gap-4">
              <div
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/60 text-3xl backdrop-blur-sm"
                aria-hidden
              >
                {cat.emoji}
              </div>
              <div className="min-w-0 flex-1">
                <div
                  className="text-[20px] font-extrabold leading-tight"
                  style={{ color: cat.fg }}
                >
                  {cat.title}
                </div>
                <div
                  className="mt-1 text-[13px] leading-snug"
                  style={{ color: cat.fg, opacity: 0.75 }}
                >
                  {cat.subtitle}
                </div>
              </div>
              <div
                className="text-2xl transition group-hover:translate-x-0.5"
                style={{ color: cat.fg }}
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
