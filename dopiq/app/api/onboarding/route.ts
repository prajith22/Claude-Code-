import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body || !Array.isArray(body.shoppingPrefs) || !body.foodPrefs) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const shoppingPrefs = (body.shoppingPrefs as string[]).slice(0, 5);
  const foodPrefs = {
    cuisines: Array.isArray(body.foodPrefs.cuisines)
      ? (body.foodPrefs.cuisines as string[]).slice(0, 6)
      : [],
    orderSize:
      typeof body.foodPrefs.orderSize === "string"
        ? body.foodPrefs.orderSize
        : "Just me",
    sports: body.sportsPrefs ?? { nfl: true, nba: true },
  };

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      shoppingPrefs,
      foodPrefs,
      onboardingCompleted: true,
    },
  });

  return NextResponse.json({ ok: true });
}
