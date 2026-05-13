import { notFound } from "next/navigation";
import { findGame } from "@/data/tickets";
import { SportsBooking } from "@/components/tickets/SportsBooking";

export const dynamic = "force-dynamic";

// Auth + subscription enforced upstream by (app)/layout.tsx.
export default function SportsDetailPage({
  params,
}: {
  params: { gameId: string };
}) {
  const game = findGame(params.gameId);
  if (!game) {
    notFound();
  }

  return <SportsBooking game={game} />;
}
