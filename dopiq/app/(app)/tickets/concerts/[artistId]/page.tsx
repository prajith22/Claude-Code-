import { notFound } from "next/navigation";
import { requireSubscribedUser } from "@/lib/session-guards";
import { findConcert } from "@/data/tickets";
import { ConcertBooking } from "@/components/tickets/ConcertBooking";

export const dynamic = "force-dynamic";

export default async function ConcertDetailPage({
  params,
}: {
  params: { artistId: string };
}) {
  await requireSubscribedUser();
  const artist = findConcert(params.artistId);
  if (!artist) {
    notFound();
  }

  return <ConcertBooking artist={artist} />;
}
