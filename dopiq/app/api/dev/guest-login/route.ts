import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const GUEST_EMAIL = "guest@dopiq.local";
const SESSION_COOKIE = "next-auth.session-token";
const SESSION_DAYS = 30;

export async function POST() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const user = await prisma.user.upsert({
    where: { email: GUEST_EMAIL },
    update: {
      onboardingCompleted: true,
      subscriptionStatus: "active",
    },
    create: {
      email: GUEST_EMAIL,
      name: "Guest Tester",
      onboardingCompleted: true,
      subscriptionStatus: "active",
      trialStartDate: new Date(),
      shoppingPrefs: [
        "Clothes",
        "Electronics",
        "Home Goods",
        "Beauty",
        "Sports",
      ],
      foodPrefs: {
        cuisines: ["Pizza", "Burgers", "Sushi"],
        orderSize: "Just me",
        sports: { nfl: true, nba: true },
      },
    },
  });

  await prisma.fakeWallet.upsert({
    where: { userId: user.id },
    update: {},
    create: { userId: user.id, balance: 1000 },
  });

  const sessionToken = randomUUID();
  const expires = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await prisma.session.create({
    data: { sessionToken, userId: user.id, expires },
  });

  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, sessionToken, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    expires,
  });
  return res;
}
