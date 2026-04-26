import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { touchStreak } from "@/lib/streaks";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_SECTIONS = new Set(["shop", "food", "bet"]);
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Logs an urge captured by the universal picker before browsing.
 * Body: { section: "shop"|"food"|"bet", reason: string, todayDateStr: "YYYY-MM-DD" }
 *
 * Logging an urge ALSO touches the streak — opening the app and naming
 * a trigger counts as a "day clean" even if the user doesn't go on to
 * simulate a checkout. That's intentional: the goal is reflection, not
 * just simulation throughput.
 */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as
    | { section?: string; reason?: string; todayDateStr?: string }
    | null;

  const section = body?.section;
  const reason = body?.reason?.trim();
  const todayDateStr = body?.todayDateStr;

  if (!section || !VALID_SECTIONS.has(section)) {
    return NextResponse.json({ error: "Invalid section" }, { status: 400 });
  }
  if (!reason || reason.length > 32) {
    return NextResponse.json({ error: "Invalid reason" }, { status: 400 });
  }
  if (!todayDateStr || !DATE_RE.test(todayDateStr)) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }

  await prisma.urge.create({
    data: {
      userId: session.user.id,
      section,
      reason,
      amountCents: null,
    },
  });

  const streak = await touchStreak(session.user.id, todayDateStr);

  return NextResponse.json({ ok: true, streak });
}
