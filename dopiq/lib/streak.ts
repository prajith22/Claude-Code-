import { prisma } from "@/lib/prisma";

// Everything is computed against UTC day boundaries. Simple and consistent;
// small tradeoff at timezone edges but good enough for a streak counter.
function startOfUtcDay(d: Date): Date {
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()),
  );
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export async function getStreak(userId: string): Promise<number> {
  try {
    const u = await prisma.user.findUnique({
      where: { id: userId },
      select: { currentStreak: true },
    });
    return u?.currentStreak ?? 0;
  } catch {
    // Prisma client not yet regenerated OR columns not yet pushed to the DB.
    // Silently fail so the home page still renders.
    return 0;
  }
}

/**
 * Idempotent per-day streak update.
 * - First-ever login starts the streak at 1.
 * - Same UTC day is a no-op (no write).
 * - Exactly one UTC day later increments by 1.
 * - Two+ UTC days later resets to 1.
 * Returns the streak value AFTER any update, or 0 if the DB/client isn't
 * ready for streak fields yet.
 */
export async function recordLogin(
  userId: string,
): Promise<{ currentStreak: number }> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { currentStreak: true, lastLoginDate: true },
    });
    if (!user) return { currentStreak: 0 };

    const today = startOfUtcDay(new Date());
    const last = user.lastLoginDate ? startOfUtcDay(user.lastLoginDate) : null;

    let nextStreak: number;
    if (!last) {
      nextStreak = 1;
    } else {
      const diffDays = Math.round(
        (today.getTime() - last.getTime()) / MS_PER_DAY,
      );
      if (diffDays <= 0) {
        // Same UTC day — don't touch the count or the timestamp
        return { currentStreak: user.currentStreak };
      }
      if (diffDays === 1) {
        nextStreak = (user.currentStreak ?? 0) + 1;
      } else {
        nextStreak = 1;
      }
    }

    await prisma.user.update({
      where: { id: userId },
      data: { currentStreak: nextStreak, lastLoginDate: today },
    });

    return { currentStreak: nextStreak };
  } catch {
    // Prisma client stale or columns missing — fail soft so the home page
    // still renders. Run `npx prisma generate && npx prisma db push` to fix.
    return { currentStreak: 0 };
  }
}
