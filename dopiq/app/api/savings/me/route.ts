import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { centsToDollars, sumUrgesSince } from "@/lib/savings";
import { streakStatus } from "@/lib/streaks";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Returns the current user's saved-today + streak summary. Used by the
 * persistent header chip and the home hero.
 *
 * Query:
 *   ?today=YYYY-MM-DD          local-date string for streak status
 *   ?since=<ISO datetime>      user's local-midnight in UTC for the
 *                              daily-reset counter
 *
 * `lifetimeSaved` is also returned (cumulative — never resets) in
 * case a future surface wants to brag about the all-time number.
 */
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const today = url.searchParams.get("today") ?? "";
  const sinceParam = url.searchParams.get("since");
  // Default to "last 24h" if the client doesn't pass an explicit local
  // midnight — keeps the API tolerant of older callers / SSR.
  const since = sinceParam
    ? new Date(sinceParam)
    : new Date(Date.now() - 24 * 60 * 60 * 1000);

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

  const todaySavedCents = await sumUrgesSince(session.user.id, since);
  const status = streakStatus(user.lastStreakDate, today);

  // Hide a stale streak number on read if today's date proves the
  // streak is broken — server doesn't auto-zero on read so the next
  // touchStreak call will fix it. We just don't lie to the UI.
  const currentStreak =
    status.state === "broken" ? 0 : user.currentStreak;

  return NextResponse.json({
    todaySavedCents,
    todaySaved: centsToDollars(todaySavedCents),
    lifetimeSavedCents: user.totalSavedCents,
    lifetimeSaved: centsToDollars(user.totalSavedCents),
    currentStreak,
    longestStreak: user.longestStreak,
    lastStreakDate: user.lastStreakDate,
    streakStatus: status.state,
  });
}
