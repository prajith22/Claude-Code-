import Link from "next/link";
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
        {/* Personalized greeting — confident dark navy. */}
        <h1 className="text-[44px] font-extrabold leading-[1.05] tracking-tight text-[#0A0F1E] md:text-[64px]">
          Hey, {firstName}.
        </h1>

        {/* Money saved + streak hero */}
        <HomeStreakHero initial={initialSummary} />

        {/* Quick Sim — sibling to the Shop / Food / Bet pastel cards.
            Coral-tinted so it's distinct from the other three but
            still part of the same family. */}
        <Link
          href="/quick-sim"
          className="group relative flex items-center gap-4 overflow-hidden rounded-card bg-[#FFE4E1] p-5 transition active:scale-[0.99]"
        >
          {/* Same dotted texture as the other home sim cards, tinted
              to the title shade. Static SVG id is fine because there's
              only one Quick Sim card per page. */}
          <svg
            aria-hidden
            className="pointer-events-none absolute inset-0 h-full w-full text-[#8B2500] opacity-[0.07]"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <pattern
                id="qs-dots"
                x="0"
                y="0"
                width="14"
                height="14"
                patternUnits="userSpaceOnUse"
              >
                <circle cx="2" cy="2" r="1.4" fill="currentColor" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#qs-dots)" />
          </svg>

          <span
            aria-hidden
            className="relative flex h-12 w-12 flex-none items-center justify-center rounded-2xl bg-white/60 text-[28px] leading-none backdrop-blur-sm"
          >
            ⚡
          </span>
          <div className="relative min-w-0 flex-1">
            <p className="font-heading text-[18px] font-extrabold leading-tight text-[#8B2500]">
              Quick Sim
            </p>
            <p className="mt-0.5 text-[12px] text-[#8B2500]/70">
              Impulse hitting? Sim it in seconds.
            </p>
          </div>
          <span
            aria-hidden
            className="relative flex h-8 w-8 flex-none items-center justify-center rounded-full bg-white/60 text-[#8B2500] backdrop-blur-sm transition group-hover:translate-x-0.5"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path
                d="M9 6l6 6-6 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </Link>

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
