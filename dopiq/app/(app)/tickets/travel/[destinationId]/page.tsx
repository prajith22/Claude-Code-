import { notFound } from "next/navigation";
import { findDestination } from "@/data/tickets";
import { TravelBooking } from "@/components/tickets/TravelBooking";

export const dynamic = "force-dynamic";

// Auth + subscription enforced upstream by (app)/layout.tsx.
export default function TravelDetailPage({
  params,
}: {
  params: { destinationId: string };
}) {
  const destination = findDestination(params.destinationId);
  if (!destination) {
    notFound();
  }

  return <TravelBooking destination={destination} />;
}
