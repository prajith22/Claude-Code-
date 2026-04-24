import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const GUEST_EMAIL = "guest@dopiq.local";
const SESSION_COOKIE = "next-auth.session-token";
const SESSION_DAYS = 30;

export async function GET(req: Request) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Prefer the configured canonical URL so links built in this response
  // go back to the same origin the app treats as authoritative.
  const baseUrl = process.env.NEXTAUTH_URL ?? new URL(req.url).origin;

  try {
    // Upsert so repeat clicks preserve existing state (onboarding
    // progress, prefs, etc.) instead of resetting the user each visit.
    const user = await prisma.user.upsert({
      where: { email: GUEST_EMAIL },
      update: {
        subscriptionStatus: "active",
      },
      create: {
        email: GUEST_EMAIL,
        name: "Guest Tester",
        onboardingCompleted: false,
        subscriptionStatus: "active",
        trialStartDate: new Date(),
      },
    });

    const sessionToken = randomUUID();
    const expires = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
    await prisma.session.create({
      data: { sessionToken, userId: user.id, expires },
    });

    const dest = user.onboardingCompleted ? "/home" : "/onboarding";
    const res = NextResponse.redirect(`${baseUrl}${dest}`, { status: 302 });
    res.cookies.set(SESSION_COOKIE, sessionToken, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      expires,
    });
    return res;
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    console.error("[guest-login]", message);
    const url = new URL("/signin", baseUrl);
    url.searchParams.set(
      "error",
      `DB error — run 'npx prisma db push' first. (${message.slice(0, 120)})`,
    );
    return NextResponse.redirect(url.toString(), { status: 302 });
  }
}
