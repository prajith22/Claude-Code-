import { notFound } from "next/navigation";
import games from "@/data/games.json";
import type { Game } from "@/types";
import { requireOnboardedSubscribedUser } from "@/lib/session-guards";
import { prisma } from "@/lib/prisma";
import { BetSlip } from "@/components/BetSlip";
import { formatUSD } from "@/lib/utils";

export default async function GameDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await requireOnboardedSubscribedUser();
  const g = (games as Game[]).find((x) => x.id === params.id);
  if (!g) notFound();
  const wallet = await prisma.fakeWallet.findUnique({
    where: { userId: user.id },
  });

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

      {/* Wallet balance */}
      <div className="card flex items-center justify-between px-5 py-4">
        <span className="text-[13px] font-semibold text-ink-muted">Fake wallet</span>
        <span className="text-[20px] font-bold text-navy money">
          {formatUSD(wallet?.balance ?? 0)}
        </span>
      </div>

      <BetSlip game={g} walletBalance={wallet?.balance ?? 0} />
    </div>
  );
}
