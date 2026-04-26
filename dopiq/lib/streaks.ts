import { prisma } from "@/lib/prisma";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function parseDateStr(s: string): Date | null {
  if (!DATE_RE.test(s)) return null;
  const d = new Date(`${s}T00:00:00Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function daysBetween(earlierStr: string, laterStr: string): number | null {
  const a = parseDateStr(earlierStr);
  const b = parseDateStr(laterStr);
  if (!a || !b) return null;
  const ms = b.getTime() - a.getTime();
  return Math.round(ms / 86_400_000);
}

/**
 * Touch a user's streak for the given local date (YYYY-MM-DD).
 * - same day as last touch → noop
 * - exactly +1 day → increment current, bump longest if needed
 * - any other gap (>1 or earlier) → restart streak at 1
 *
 * Returns the user's post-touch streak state.
 */
export async function touchStreak(userId: string, todayStr: string) {
  if (!DATE_RE.test(todayStr)) {
    throw new Error(`touchStreak: bad date "${todayStr}"`);
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      currentStreak: true,
      longestStreak: true,
      lastStreakDate: true,
    },
  });
  if (!user) return null;

  if (user.lastStreakDate === todayStr) {
    return {
      currentStreak: user.currentStreak,
      longestStreak: user.longestStreak,
      lastStreakDate: user.lastStreakDate,
      changed: false,
    };
  }

  const gap =
    user.lastStreakDate != null
      ? daysBetween(user.lastStreakDate, todayStr)
      : null;

  let nextCurrent: number;
  if (user.lastStreakDate == null || gap == null || gap > 1 || gap < 0) {
    nextCurrent = 1;
  } else {
    // gap === 1
    nextCurrent = user.currentStreak + 1;
  }

  const nextLongest = Math.max(user.longestStreak, nextCurrent);

  await prisma.user.update({
    where: { id: userId },
    data: {
      currentStreak: nextCurrent,
      longestStreak: nextLongest,
      lastStreakDate: todayStr,
    },
  });

  return {
    currentStreak: nextCurrent,
    longestStreak: nextLongest,
    lastStreakDate: todayStr,
    changed: true,
  };
}

/**
 * Computes whether a user's streak is "at risk" (last activity was
 * yesterday — they have today to log something or they break).
 */
export function streakStatus(
  lastStreakDate: string | null,
  todayStr: string,
):
  | { state: "active"; daysSinceLast: 0 }
  | { state: "at_risk"; daysSinceLast: 1 }
  | { state: "broken"; daysSinceLast: number }
  | { state: "none" } {
  if (!lastStreakDate) return { state: "none" };
  const gap = daysBetween(lastStreakDate, todayStr);
  if (gap == null) return { state: "none" };
  if (gap <= 0) return { state: "active", daysSinceLast: 0 };
  if (gap === 1) return { state: "at_risk", daysSinceLast: 1 };
  return { state: "broken", daysSinceLast: gap };
}
