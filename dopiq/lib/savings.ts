import { prisma } from "@/lib/prisma";
import { touchStreak } from "@/lib/streaks";

export function dollarsToCents(dollars: number): number {
  return Math.max(0, Math.round(dollars * 100));
}

export function centsToDollars(cents: number): number {
  return Math.round(cents) / 100;
}

/**
 * Atomically credits a user's saved-money counter and records the urge
 * that produced the simulation. Also touches their streak. Called at
 * checkout time for shop/food and at bet placement.
 */
export async function recordSimulatedSpend(args: {
  userId: string;
  section: "shop" | "food" | "bet";
  amountDollars: number;
  reason?: string | null;
  todayDateStr: string;
}) {
  const cents = dollarsToCents(args.amountDollars);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: args.userId },
      data: { totalSavedCents: { increment: cents } },
    }),
    prisma.urge.create({
      data: {
        userId: args.userId,
        section: args.section,
        reason: args.reason ?? "unspecified",
        amountCents: cents,
      },
    }),
  ]);

  await touchStreak(args.userId, args.todayDateStr);
}
