import { notFound } from "next/navigation";
import { requireSubscribedUser } from "@/lib/session-guards";
import { findDestination } from "@/data/tickets";
import { TravelBooking } from "@/components/tickets/TravelBooking";

export const dynamic = "force-dynamic";

export default async function TravelDetailPage({
  params,
}: {
  params: { destinationId: string };
}) {
  await requireSubscribedUser();
  const destination = findDestination(params.destinationId);
  if (!destination) {
    notFound();
  }

  return <TravelBooking destination={destination} />;
}
