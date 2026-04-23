import Link from "next/link";
import { requireOnboardedSubscribedUser } from "@/lib/session-guards";
import { DailySpinWheel } from "@/components/DailySpinWheel";

export default async function HomePage() {
  await requireOnboardedSubscribedUser();

  return (
    <div className="space-y-8 pb-4 pt-4 md:space-y-10">
      {/* Hero tagline */}
      <h1 className="text-[44px] font-extrabold leading-[1.05] tracking-tight text-ink md:text-[64px]">
        The urge is real.
        <br />
        The charge isn&rsquo;t.
      </h1>

      {/* Daily spin wheel */}
      <DailySpinWheel />

      {/* Three simulator cards */}
      <div className="grid grid-cols-3 gap-3 md:gap-4">
        <SimCard
          href="/shop"
          label="Shop"
          desc="Fake checkout · Free dopamine"
          bg="bg-[#E8E3FF]"
          title="text-[#4C1D95]"
          sub="text-[#4C1D95]/70"
          icon={<BagIcon />}
        />
        <SimCard
          href="/food"
          label="Food"
          desc="Order it, don't pay it"
          bg="bg-[#FFF3CD]"
          title="text-[#78350F]"
          sub="text-[#78350F]/70"
          icon={<ForkIcon />}
        />
        <SimCard
          href="/bet"
          label="Bet"
          desc="Lose nothing. Win nothing."
          bg="bg-[#DBEAFE]"
          title="text-[#1E3A8A]"
          sub="text-[#1E3A8A]/70"
          icon={<TicketIcon />}
        />
      </div>
    </div>
  );
}

function SimCard({
  href,
  label,
  desc,
  bg,
  title,
  sub,
  icon,
}: {
  href: string;
  label: string;
  desc: string;
  bg: string;
  title: string;
  sub: string;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`group flex min-h-[160px] flex-col justify-between rounded-card p-4 transition-all duration-150 hover:scale-[1.02] hover:shadow-cardHover md:p-5 ${bg}`}
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy text-white">
        {icon}
      </span>
      <div>
        <p className={`text-[20px] font-bold leading-tight md:text-[22px] ${title}`}>
          {label}
        </p>
        <p className={`mt-1 text-[12px] leading-snug md:text-[13px] ${sub}`}>
          {desc}
        </p>
      </div>
    </Link>
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
