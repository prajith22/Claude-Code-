import { prisma } from "@/lib/prisma";
import type { SlipSelection } from "@/lib/bet-slip-store";

export type LegOutcome = {
  key: string;
  result: "won" | "lost";
};

export type Resolution = {
  status: "won" | "lost" | "push";
  legs: LegOutcome[];
};

/**
 * Implied probability of a single American-odds leg hitting.
 * +150 → 1/(1+150/100) = 0.40, -150 → 150/(150+100) = 0.60.
 */
function impliedProbability(american: number): number {
  if (american > 0) return 100 / (american + 100);
  return -american / (-american + 100);
}

function resolveLeg(odds: number): "won" | "lost" {
  const p = impliedProbability(odds);
  return Math.random() < p ? "won" : "lost";
}

/**
 * Resolves a ticket's selections. All legs must hit for the ticket to
 * win (parlay rule). Single-leg tickets follow the same path naturally.
 */
export function resolveSelections(selections: SlipSelection[]): Resolution {
  const legs: LegOutcome[] = selections.map((s) => ({
    key: s.key,
    result: resolveLeg(s.odds),
  }));
  const allWon = legs.every((l) => l.result === "won");
  return {
    status: allWon ? "won" : "lost",
    legs,
  };
}

/**
 * Lazily resolves any pending tickets owned by the given user whose
 * resolveAt has elapsed. Called on visit to /bet/tickets.
 */
export async function resolveDueTicketsForUser(userId: string) {
  const due = await prisma.betTicket.findMany({
    where: {
      userId,
      status: "pending",
      resolveAt: { lte: new Date() },
    },
  });

  if (due.length === 0) return 0;

  await prisma.$transaction(
    due.map((ticket) => {
      const selections = ticket.selectionsJson as unknown as SlipSelection[];
      const resolution = resolveSelections(selections);
      return prisma.betTicket.update({
        where: { id: ticket.id },
        data: {
          status: resolution.status,
          resolutionJson: resolution as unknown as object,
          resolvedAt: new Date(),
        },
      });
    }),
  );

  return due.length;
}
