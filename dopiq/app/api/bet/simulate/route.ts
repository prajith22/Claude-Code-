import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  americanOddsImpliedProb,
  americanOddsToPayout,
} from "@/lib/utils";

// Places and resolves a simulated bet atomically.
// - Rolls win/loss against the implied probability of the odds.
// - On win: wallet += payout (profit; stake was never really removed).
// - On loss: wallet -= stake.
// No bet row is stored — we keep the database free of fake activity.
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  let body: {
    amount?: number;
    odds?: number;
  };
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
  const delta = won ? payout : -amount;

  try {
    const wallet = await prisma.$transaction(async (tx) => {
      const w = await tx.fakeWallet.findUnique({ where: { userId } });
      if (!w) throw new Error("NO_WALLET");
      if (!won && w.balance < amount) throw new Error("INSUFFICIENT_FUNDS");
      return tx.fakeWallet.update({
        where: { userId },
        data: { balance: { increment: delta } },
      });
    });

    return NextResponse.json({
      result: won ? "win" : "loss",
      payout: won ? payout : 0,
      stakeLost: won ? 0 : amount,
      newBalance: wallet.balance,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "INSUFFICIENT_FUNDS") {
      return NextResponse.json(
        { error: "Not enough fake funds." },
        { status: 400 },
      );
    }
    if (msg === "NO_WALLET") {
      return NextResponse.json(
        { error: "Wallet not found." },
        { status: 500 },
      );
    }
    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500 },
    );
  }
}
