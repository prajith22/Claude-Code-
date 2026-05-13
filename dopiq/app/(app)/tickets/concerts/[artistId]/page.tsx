import { notFound } from "next/navigation";
import { findConcert } from "@/data/tickets";
import { ConcertBooking } from "@/components/tickets/ConcertBooking";

export const dynamic = "force-dynamic";

// Auth + subscription enforced upstream by (app)/layout.tsx.
export default function ConcertDetailPage({
  params,
}: {
  params: { artistId: string };
}) {
  const artist = findConcert(params.artistId);
  if (!artist) {
    notFound();
  }

  return <ConcertBooking artist={artist} />;
}
