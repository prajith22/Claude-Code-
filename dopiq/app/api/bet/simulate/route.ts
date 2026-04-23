import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  americanOddsImpliedProb,
  americanOddsToPayout,
} from "@/lib/utils";

// Simulates a bet outcome. No balance is tracked anywhere — we just
// roll win/loss against the implied probability of the odds and hand
// the result back to the UI for display.
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { amount?: number; odds?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const amount = Number(body.amount);
  const odds = Number(body.odds);
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
  }
  if (!Number.isFinite(odds) || odds === 0) {
    return NextResponse.json({ error: "Invalid odds" }, { status: 400 });
  }

  const prob = americanOddsImpliedProb(odds);
  const won = Math.random() < prob;
  const payout = americanOddsToPayout(amount, odds);

  return NextResponse.json({
    result: won ? "win" : "loss",
    payout: won ? payout : 0,
    stakeLost: won ? 0 : amount,
  });
}
