import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { recordSimulatedSpend } from "@/lib/savings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_SECTIONS = new Set(["shop", "food"]);
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Credits a simulated checkout to the user's totalSavedCents counter
 * and touches their streak. Bet placement uses /api/bets/place which
 * records its own savings; this endpoint covers shop + food only.
 */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as
    | { section?: string; amount?: number; reason?: string | null; todayDateStr?: string }
    | null;

  const section = body?.section;
  const amount = body?.amount;
  const reason = body?.reason ?? null;
  const todayDateStr = body?.todayDateStr;

  if (!section || !VALID_SECTIONS.has(section)) {
    return NextResponse.json({ error: "Invalid section" }, { status: 400 });
  }
  if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
  }
  if (!todayDateStr || !DATE_RE.test(todayDateStr)) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }

  await recordSimulatedSpend({
    userId: session.user.id,
    section: section as "shop" | "food",
    amountDollars: amount,
    reason,
    todayDateStr,
  });

  return NextResponse.json({ ok: true });
}
