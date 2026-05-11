import { NextResponse, type NextRequest } from "next/server";
import { encode } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { computeAccessState } from "@/lib/access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const SESSION_MAX_AGE_SEC = 365 * 24 * 60 * 60; // mirrors authOptions

const SESSION_COOKIE_NAME =
  process.env.NODE_ENV === "production"
    ? "__Secure-next-auth.session-token"
    : "next-auth.session-token";

// Resolve the canonical app URL at module load. In production we
// refuse to boot if NEXT_PUBLIC_APP_URL is missing so a misconfigured
// Vercel deploy fails at first request instead of silently emitting
// localhost redirects from /api/auth/verify. Local dev keeps the
// localhost fallback.
const APP_URL = (() => {
  const url = process.env.NEXT_PUBLIC_APP_URL;
  if (url) return url;
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "[auth/verify] NEXT_PUBLIC_APP_URL is required in production — post-verification redirects would otherwise point at http://localhost:3000.",
    );
  }
  return "http://localhost:3000";
})();

function appUrl(): string {
  return APP_URL;
}

/**
 * GET /api/auth/verify?token=<token>
 *
 * Validates the verification token, marks the user as verified,
 * issues a NextAuth JWT session cookie, and redirects based on
 * where the user is in the funnel:
 *
 *   - onboarding not yet completed → /onboarding
 *   - onboarded + already-active access (subscription or
 *     reviewer flag)              → /home
 *   - onboarded + no active access → /paywall
 *
 * This priority mirrors how the rest of the app's session guards
 * route users — verify-and-sign-in shouldn't shortcut the
 * onboarding flow that requireSubscribedUser would have enforced
 * on the next page render anyway.
 *
 * Lives at /api/auth/verify — Next.js routes more-specific segments
 * before the [...nextauth] catch-all, so this doesn't collide with
 * NextAuth's own /api/auth/* handlers.
 */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  const errorUrl = new URL("/verify-email/error", appUrl());

  if (!token || typeof token !== "string") {
    return NextResponse.redirect(errorUrl);
  }

  const user = await prisma.user.findUnique({
    where: { emailVerificationToken: token },
  });
  if (!user) {
    return NextResponse.redirect(errorUrl);
  }

  // Token expires 24 hours after the account was created. Anyone
  // late to the party has to sign up again — the resend flow only
  // helps within that 24h window.
  const ageMs = Date.now() - user.createdAt.getTime();
  if (ageMs > TOKEN_TTL_MS) {
    return NextResponse.redirect(errorUrl);
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerified: new Date(),
      emailVerificationToken: null,
    },
  });

  // Mint a NextAuth-compatible JWT and set the session cookie. We
  // mirror the shape that lib/auth.ts's jwt callback produces so
  // the session-augmenting callback finds an `id` claim and the
  // user lands authenticated on /paywall.
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    console.error("[verify] NEXTAUTH_SECRET is not set");
    return NextResponse.redirect(errorUrl);
  }

  const sessionJwt = await encode({
    token: {
      id: user.id,
      sub: user.id,
      email: user.email,
      name: user.name ?? null,
    },
    secret,
    maxAge: SESSION_MAX_AGE_SEC,
  });

  // Route by funnel state. Onboarding always wins because the
  // welcome flow is part of how we activate the account — sending
  // a freshly-verified user past it leaves them on /paywall
  // without the trigger / preference signal we collect in
  // onboarding, and the next /home request would just bounce
  // them back through requireSubscribedUser → /onboarding anyway.
  let destination: "/onboarding" | "/home" | "/paywall";
  if (!user.onboardingCompleted) {
    destination = "/onboarding";
  } else if (computeAccessState(user) === "active") {
    destination = "/home";
  } else {
    destination = "/paywall";
  }

  const res = NextResponse.redirect(new URL(destination, appUrl()));
  res.cookies.set(SESSION_COOKIE_NAME, sessionJwt, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_MAX_AGE_SEC,
  });
  return res;
}
