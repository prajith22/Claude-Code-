import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { americanOddsToPayout } from "@/lib/utils";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  const { gameLabel, betType, amount, odds, selectionLabel } = body as {
    gameLabel?: string;
    betType?: string;
    amount?: number;
    odds?: number;
    selectionLabel?: string;
  };

  const validTypes = new Set(["moneyline", "spread", "over_under"]);
  if (
    !gameLabel ||
    !betType ||
    !validTypes.has(betType) ||
    typeof amount !== "number" ||
    typeof odds !== "number" ||
    amount <= 0
  ) {
    return NextResponse.json({ error: "Invalid bet" }, { status: 400 });
  }

  const wallet = await prisma.fakeWallet.findUnique({
    where: { userId: session.user.id },
  });
  if (!wallet) return NextResponse.json({ error: "No wallet" }, { status: 400 });
  if (amount > wallet.balance) {
    return NextResponse.json(
      { error: "Insufficient fake funds." },
      { status: 400 },
    );
  }

  const potentialPayout = americanOddsToPayout(amount, odds);

  const [, bet] = await prisma.$transaction([
    prisma.fakeWallet.update({
      where: { userId: session.user.id },
      data: { balance: { decrement: amount } },
    }),
    prisma.bet.create({
      data: {
        userId: session.user.id,
        game: gameLabel,
        betType: `${betType}:${selectionLabel ?? ""}`,
        amount,
        odds,
        potentialPayout,
        status: "open",
      },
    }),
  ]);

  return NextResponse.json({ id: bet.id });
}
