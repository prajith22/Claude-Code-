import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { americanOddsImpliedProb } from "@/lib/utils";

export async function POST(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const bet = await prisma.bet.findUnique({ where: { id: params.id } });
  if (!bet || bet.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (bet.status !== "open") {
    return NextResponse.json({ error: "Already resolved" }, { status: 400 });
  }

  const winProb = americanOddsImpliedProb(bet.odds);
  const won = Math.random() < winProb;
  const payout = won ? bet.amount + bet.potentialPayout : 0;

  const [updated] = await prisma.$transaction([
    prisma.bet.update({
      where: { id: bet.id },
      data: {
        status: "resolved",
        result: won ? "win" : "loss",
      },
    }),
    ...(payout > 0
      ? [
          prisma.fakeWallet.update({
            where: { userId: session.user.id },
            data: { balance: { increment: payout } },
          }),
        ]
      : []),
  ]);

  return NextResponse.json({ id: updated.id, result: updated.result });
}
