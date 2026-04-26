import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { centsToDollars } from "@/lib/savings";
import { streakStatus } from "@/lib/streaks";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Returns the current user's savings + streak summary. Used by the
 * persistent header chip and by the home hero.
 *
 * Query: ?today=YYYY-MM-DD (client-supplied local date)
 */
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const today = url.searchParams.get("today") ?? "";

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      totalSavedCents: true,
      currentStreak: true,
      longestStreak: true,
      lastStreakDate: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const status = streakStatus(user.lastStreakDate, today);

  // If the user's streak is already broken (gap > 1 day), surface 0
  // currentStreak — server doesn't auto-zero on read so today's first
  // touchStreak fixes it. We just don't lie to the UI.
  const currentStreak =
    status.state === "broken" ? 0 : user.currentStreak;

  return NextResponse.json({
    totalSavedCents: user.totalSavedCents,
    totalSaved: centsToDollars(user.totalSavedCents),
    currentStreak,
    longestStreak: user.longestStreak,
    lastStreakDate: user.lastStreakDate,
    streakStatus: status.state,
  });
}
