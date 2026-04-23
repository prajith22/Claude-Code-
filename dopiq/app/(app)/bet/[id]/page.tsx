import { notFound } from "next/navigation";
import { requireOnboardedSubscribedUser } from "@/lib/session-guards";
import { getAllOdds } from "@/lib/odds";
import { BetSlip } from "@/components/BetSlip";

export const dynamic = "force-dynamic";

export default async function GameDetailPage({
  params,
}: {
  params: { id: string };
}) {
  await requireOnboardedSubscribedUser();
  const { nfl, nba, mlb, nhl, ncaaf, ncaab, mls, boxing, ufc, golf } =
    await getAllOdds();
  const all = [
    ...nfl,
    ...nba,
    ...mlb,
    ...nhl,
    ...ncaaf,
    ...ncaab,
    ...mls,
    ...boxing,
    ...ufc,
    ...golf,
  ];
  const g = all.find((x) => x.id === params.id);
  if (!g) notFound();

  return (
    <div className="space-y-5 pb-4">
      {/* Game header card */}
      <div className="card-navy px-6 py-5">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-white/40">
          {g.sport} · Simulated
        </p>
        <div className="mt-3 flex items-center justify-between gap-4">
          <div>
            <p className="text-[13px] font-medium text-white/60">Away</p>
            <p className="mt-0.5 text-[20px] font-bold text-white leading-tight">
              {g.awayTeam}
            </p>
          </div>
          <span className="text-[28px] font-black text-white/20">@</span>
          <div className="text-right">
            <p className="text-[13px] font-medium text-white/60">Home</p>
            <p className="mt-0.5 text-[20px] font-bold text-white leading-tight">
              {g.homeTeam}
            </p>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4">
          <p className="text-[12px] text-white/50">
            {new Date(g.startsAt).toLocaleString("en-US", {
              weekday: "long",
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })}
          </p>
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-brand" />
            </span>
            <span className="text-[11px] font-bold text-brand uppercase tracking-wide">
              Live
            </span>
          </div>
        </div>
      </div>

      <BetSlip game={g} />
    </div>
  );
}
