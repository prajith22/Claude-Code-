import { notFound } from "next/navigation";
import { requireSubscribedUser } from "@/lib/session-guards";
import { findGame } from "@/data/tickets";
import { SportsBooking } from "@/components/tickets/SportsBooking";

export const dynamic = "force-dynamic";

export default async function SportsDetailPage({
  params,
}: {
  params: { gameId: string };
}) {
  await requireSubscribedUser();
  const game = findGame(params.gameId);
  if (!game) {
    notFound();
  }

  return <SportsBooking game={game} />;
}
