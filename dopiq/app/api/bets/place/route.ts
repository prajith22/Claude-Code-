import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { SlipSelection } from "@/lib/bet-slip-store";
import { dollarsToCents } from "@/lib/savings";
import { recordSimulatedSpend } from "@/lib/savings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const RESOLVE_DELAY_MS = 4 * 60 * 60 * 1000;

type Body = {
  selections?: SlipSelection[];
  stake?: number;
  combinedOdds?: number;
  potentialReturn?: number;
  reason?: string | null;
  todayDateStr?: string;
};

function isValidSelection(s: unknown): s is SlipSelection {
  if (!s || typeof s !== "object") return false;
  const o = s as Record<string, unknown>;
  return (
    typeof o.key === "string" &&
    typeof o.gameId === "string" &&
    typeof o.matchup === "string" &&
    typeof o.label === "string" &&
    typeof o.odds === "number" &&
    typeof o.sport === "string" &&
    typeof o.type === "string" &&
    typeof o.side === "string"
  );
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as Body | null;
  const selections = body?.selections;
  const stake = body?.stake;
  const combinedOdds = body?.combinedOdds;
  const potentialReturn = body?.potentialReturn;
  const reason = body?.reason ?? null;
  const todayDateStr = body?.todayDateStr;

  if (
    !Array.isArray(selections) ||
    selections.length === 0 ||
    !selections.every(isValidSelection)
  ) {
    return NextResponse.json({ error: "Invalid selections" }, { status: 400 });
  }
  if (typeof stake !== "number" || !Number.isFinite(stake) || stake <= 0) {
    return NextResponse.json({ error: "Invalid stake" }, { status: 400 });
  }
  if (typeof combinedOdds !== "number" || !Number.isFinite(combinedOdds)) {
    return NextResponse.json({ error: "Invalid odds" }, { status: 400 });
  }
  if (typeof potentialReturn !== "number" || !Number.isFinite(potentialReturn)) {
    return NextResponse.json({ error: "Invalid return" }, { status: 400 });
  }
  if (!todayDateStr || !DATE_RE.test(todayDateStr)) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }

  const ticket = await prisma.betTicket.create({
    data: {
      userId: session.user.id,
      selectionsJson: selections as unknown as object,
      stakeCents: dollarsToCents(stake),
      combinedOdds: Math.round(combinedOdds),
      potentialCents: dollarsToCents(potentialReturn),
      resolveAt: new Date(Date.now() + RESOLVE_DELAY_MS),
    },
  });

  // Stake is "money kept off the sportsbook" — credits savings + streak.
  await recordSimulatedSpend({
    userId: session.user.id,
    section: "bet",
    amountDollars: stake,
    reason,
    todayDateStr,
  });

  return NextResponse.json({
    ticketId: ticket.id,
    resolveAt: ticket.resolveAt.toISOString(),
  });
}
