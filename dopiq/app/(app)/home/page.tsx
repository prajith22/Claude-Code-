import { requireSubscribedUser } from "@/lib/session-guards";
import { DailySpinWheel } from "@/components/DailySpinWheel";
import { SimCard } from "@/components/SimCard";
import { HomeStreakHero } from "@/components/HomeStreakHero";
import { streakStatus } from "@/lib/streaks";

export default async function HomePage() {
  const user = await requireSubscribedUser();
  const firstName = user.name?.trim().split(/\s+/)[0] || "there";

  // Initial paint: streak fields render correctly off the User row, but
  // the daily-saved counter needs the user's local midnight which the
  // server doesn't know — start at 0 and let the client fetch the
  // real value (matches /api/savings/me using ?since=local-midnight).
  const status = streakStatus(user.lastStreakDate, "");
  const initialSummary = {
    todaySaved: 0,
    currentStreak: status.state === "broken" ? 0 : user.currentStreak,
    longestStreak: user.longestStreak,
    streakStatus: status.state,
  };

  return (
    <div className="space-y-8 pb-4 pt-4 md:space-y-10">
      {/* Personalized greeting — first name from the NextAuth session */}
      <h1 className="text-[44px] font-extrabold leading-[1.05] tracking-tight text-ink md:text-[64px]">
        Hey, {firstName}.
      </h1>

      {/* Money saved + streak hero */}
      <HomeStreakHero initial={initialSummary} />

      {/* Three simulator cards */}
      <div className="grid grid-cols-3 gap-3 md:gap-4">
        <SimCard
          href="/shop"
          label="Shop"
          bg="bg-white border border-surface-border"
          title="text-ink"
          icon={<BagIcon />}
          delay={0}
        />
        <SimCard
          href="/food"
          label="Food"
          bg="bg-white border border-surface-border"
          title="text-ink"
          icon={<ForkIcon />}
          delay={0.15}
        />
        <SimCard
          href="/bet"
          label="Bet"
          bg="bg-white border border-surface-border"
          title="text-ink"
          icon={<TicketIcon />}
          delay={0.3}
        />
      </div>

      {/* Daily spin wheel */}
      <DailySpinWheel />
    </div>
  );
}

function BagIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 8h14l-1 12H6L5 8Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M9 8a3 3 0 1 1 6 0"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ForkIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M8 3v7a3 3 0 0 0 3 3v8M14 3c2 0 3 2 3 5s-1 5-3 5v7"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function TicketIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4V8Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  );
}
