import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { encode } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SALT_ROUNDS = 12;
const MIN_PASSWORD_LEN = 8;
const SESSION_MAX_AGE_SEC = 365 * 24 * 60 * 60; // mirrors authOptions

const SESSION_COOKIE_NAME =
  process.env.NODE_ENV === "production"
    ? "__Secure-next-auth.session-token"
    : "next-auth.session-token";

/**
 * POST /api/auth/password-setup/complete
 * Body: { token: string, password: string }
 *
 * Consumes a password-setup token, sets the user's bcrypt password
 * hash, and auto-signs them in by minting a NextAuth JWT and setting
 * the session cookie — the same encode()+cookie pattern proven in
 * /api/auth/verify. Unlike the request endpoint, this one returns
 * specific errors (invalid / expired link, weak password): they're
 * shown on the /set-password page the user already navigated to from
 * their own email, so they aren't an account-existence oracle.
 */
export async function POST(req: Request) {
  let token = "";
  let password = "";
  try {
    const body = (await req.json()) as { token?: unknown; password?: unknown };
    token = String(body?.token ?? "");
    password = String(body?.password ?? "");
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid request." },
      { status: 400 },
    );
  }

  if (!token || !password) {
    return NextResponse.json(
      { ok: false, error: "Missing token or password." },
      { status: 400 },
    );
  }

  if (password.length < MIN_PASSWORD_LEN) {
    return NextResponse.json(
      {
        ok: false,
        error: `Password must be at least ${MIN_PASSWORD_LEN} characters.`,
      },
      { status: 400 },
    );
  }

  const user = await prisma.user.findUnique({
    where: { passwordSetupToken: token },
  });

  if (!user) {
    return NextResponse.json(
      { ok: false, error: "This link is invalid or already used." },
      { status: 400 },
    );
  }

  if (
    !user.passwordSetupTokenExpires ||
    user.passwordSetupTokenExpires.getTime() < Date.now()
  ) {
    return NextResponse.json(
      { ok: false, error: "This link has expired. Request a new one." },
      { status: 400 },
    );
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      // Single-use: clear the token + expiry so the link can't be
      // replayed. passwordSetupRequestedAt is intentionally left as
      // the historical cooldown marker — it's harmless once a
      // password exists (the request route short-circuits on
      // passwordHash before ever reading it).
      passwordSetupToken: null,
      passwordSetupTokenExpires: null,
    },
  });

  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    // Password is saved; the user can still sign in manually. Don't
    // 500 — just report that the auto-sign-in step was skipped.
    console.error("[password-setup] NEXTAUTH_SECRET is not set");
    return NextResponse.json({ ok: true, autoSignIn: false });
  }

  // Mirror lib/auth.ts's jwt callback shape (id + sub) so the
  // session-augmenting callback finds an `id` claim, exactly as
  // /api/auth/verify does post-verification.
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

  const res = NextResponse.json({ ok: true, autoSignIn: true });
  res.cookies.set(SESSION_COOKIE_NAME, sessionJwt, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_MAX_AGE_SEC,
  });
  return res;
}
