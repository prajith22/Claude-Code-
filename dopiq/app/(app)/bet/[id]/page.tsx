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
    <div className="space-y-5">
      <header className="pt-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
          {g.sport}
        </p>
        <h1 className="mt-1 text-[22px] font-semibold leading-tight tracking-tight">
          {g.awayTeam} <span className="text-ink-muted">@</span> {g.homeTeam}
        </h1>
        <p className="mt-1 text-sm text-ink-muted">
          {new Date(g.startsAt).toLocaleString("en-US", {
            weekday: "long",
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
          })}
        </p>
      </header>

      <div className="card flex items-center justify-between px-4 py-3">
        <span className="text-sm text-ink-muted">Fake wallet</span>
        <span className="text-[17px] font-semibold">
          {formatUSD(wallet?.balance ?? 0)}
        </span>
      </div>

      <BetSlip game={g} walletBalance={wallet?.balance ?? 0} />
    </div>
  );
}
