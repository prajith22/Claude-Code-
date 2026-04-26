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
    <div className="relative">
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

      <div className="space-y-8 pb-4 pt-4 md:space-y-10">
        {/* Personalized greeting — warm dark brown reads softer than
            pure black against the cream backdrop. */}
        <h1 className="text-[44px] font-extrabold leading-[1.05] tracking-tight text-[#2C1810] md:text-[64px]">
          Hey, {firstName}.
        </h1>

        {/* Money saved + streak hero */}
        <HomeStreakHero initial={initialSummary} />

        {/* Three simulator cards */}
        <div className="grid grid-cols-3 gap-3 md:gap-4">
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
          <SimCard
            href="/bet"
            label="Bet"
            bg="bg-[#DBEAFE]"
            title="text-[#1E3A8A]"
            icon="🎰"
            delay={0.3}
          />
        </div>

        {/* Daily spin wheel */}
        <DailySpinWheel />
      </div>
    </div>
  );
}
