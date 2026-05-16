import { getCurrentUser } from "@/lib/session-guards";
import { isIOSWebView } from "@/lib/is-ios-webview";
import { DailySpinWheel } from "@/components/DailySpinWheel";
import { SimCard } from "@/components/SimCard";
import { HomeStreakHero } from "@/components/HomeStreakHero";
import { QuickSimHomeCard } from "@/components/QuickSimHomeCard";
import { PlanUsageCard } from "@/components/PlanUsageCard";
import { streakStatus } from "@/lib/streaks";

export default async function HomePage() {
  // Auth + subscription enforced upstream by (app)/layout.tsx. We
  // still need the user row to render the streak hero and plan-
  // usage card — cached call dedupes with the layout's
  // requireSubscribedUser fetch so the page costs zero extra
  // Prisma roundtrips.
  const user = (await getCurrentUser())!;
  // Apple prohibits gambling features for individual developer
  // accounts, so on iOS we hide the Bet simulator card and tell
  // the spin wheel to randomize over Shop / Food only. Web users
  // see every surface unchanged.
  const excludeBet = isIOSWebView();

  // Initial paint: streak fields render correctly off the User row, but
  // the daily-saved counter needs the user's local midnight which the
  // server doesn't know — start at 0 and let the client fetch the
  // real value (matches /api/savings/me using ?since=local-midnight).
  const status = streakStatus(user.lastStreakDate, "");
  const initialSummary = {
    todaySaved: 0,
    // Placeholder like todaySaved — the client fetch fills the real
    // lifetime value from /api/savings/me (server doesn't compute it
    // here to keep the cached getCurrentUser() call cheap).
    lifetimeSaved: 0,
    currentStreak: status.state === "broken" ? 0 : user.currentStreak,
    longestStreak: user.longestStreak,
    streakStatus: status.state,
  };

  return (
    <div className="relative">
      {/* Home-only grain overlay — fixed, very low opacity, never
          interactive. Scoped to this page (not the shared (app)
          layout) so it doesn't bleed onto Shop / Food / etc. */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.035]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      {/* Soft warm radial behind the hero — adds depth without weight.
          Sits behind the page content; pointer-events disabled so it
          never gets in the way of taps. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px]"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 0%, #FBF3E5 0%, rgba(251,243,229,0) 70%)",
        }}
      />

      <div className="space-y-3 pb-4 pt-4">
        {/* Money saved + streak hero */}
        <HomeStreakHero initial={initialSummary} />

        {/* Quick Sim — amplified, breathing entry into the
            simulator flow (same /quick-sim route). */}
        <QuickSimHomeCard />

        {/* Simulator cards — four on web (2x2), three on iOS (single
            row; Apple disallows gambling features for individual
            developer accounts so the Bet card is dropped there).
            Tickets stays on both surfaces — it's parody of the
            event-industry markup, not a gated category. */}
        <div
          className={`grid gap-3 ${
            excludeBet ? "grid-cols-3" : "grid-cols-2"
          }`}
        >
          <SimCard
            href="/shop"
            label="Shop"
            bg="bg-[#E8E3FF]"
            title="text-[#4C1D95]"
            icon="🛍️"
            delay={0}
          />
          <SimCard
            href="/food"
            label="Food"
            bg="bg-[#FFF3CD]"
            title="text-[#78350F]"
            icon="🍔"
            delay={0.15}
          />
          {!excludeBet && (
            <SimCard
              href="/bet"
              label="Bet"
              bg="bg-[#DBEAFE]"
              title="text-[#1E3A8A]"
              icon="🎰"
              delay={0.3}
            />
          )}
          <SimCard
            href="/tickets"
            label="Tickets"
            bg="bg-[#D1FAE5]"
            title="text-[#064E3B]"
            icon="🎟️"
            delay={excludeBet ? 0.3 : 0.45}
          />
        </div>

        {/* Daily Challenge wheel — lands on a dollar amount the user
            commits to staying under for impulse buys today. Pure
            honor system, client-only persistence (localStorage),
            no streak coupling. */}
        <section aria-label="Daily Challenge">
          <h2 className="mb-4 text-center font-heading text-[18px] font-bold tracking-tight text-ink">
            Daily Challenge
          </h2>
          <DailySpinWheel />
        </section>

        {/* Plan usage — sits at the bottom as a quiet reference card.
            Server-renders the initial values straight off the User
            row so the card paints with the right number on first
            frame; the client component keeps it live via the same
            savings-store version bump that drives the other stats. */}
        <PlanUsageCard
          initial={{
            plan: user.plan ?? null,
            simulationsUsed: user.simulationsUsed,
            simulationsLimit: user.simulationsLimit,
          }}
        />
      </div>
    </div>
  );
}
