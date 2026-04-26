import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { resolveDueTicketsForUser } from "@/lib/bet-resolution";
import { centsToDollars } from "@/lib/savings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Returns the user's bet tickets, lazily resolving any that are due.
 * Called by /bet/tickets on visit.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await resolveDueTicketsForUser(session.user.id);

  const tickets = await prisma.betTicket.findMany({
    where: { userId: session.user.id },
    orderBy: { placedAt: "desc" },
    take: 50,
  });

  return NextResponse.json({
    tickets: tickets.map((t) => ({
      id: t.id,
      selections: t.selectionsJson,
      stake: centsToDollars(t.stakeCents),
      combinedOdds: t.combinedOdds,
      potentialReturn: centsToDollars(t.potentialCents),
      status: t.status,
      placedAt: t.placedAt.toISOString(),
      resolveAt: t.resolveAt.toISOString(),
      resolvedAt: t.resolvedAt?.toISOString() ?? null,
      resolution: t.resolutionJson,
    })),
  });
}
