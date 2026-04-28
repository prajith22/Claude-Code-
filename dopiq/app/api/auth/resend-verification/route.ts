import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/auth/resend-verification
 * Body: { email: string }
 *
 * Generates a fresh token, replaces the stored one, and sends the
 * verification email again. Always returns 200 with `ok: true` so
 * we don't reveal whether an account exists for that email — the
 * UI just says "check your inbox" either way.
 */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as
    | { email?: string }
    | null;
  const email = body?.email?.toLowerCase().trim();

  if (!email) {
    return NextResponse.json(
      { ok: false, error: "Email is required." },
      { status: 400 },
    );
  }

  const user = await prisma.user.findUnique({ where: { email } });
  // No-op when there's no matching credentials user pending
  // verification. We still respond ok so the endpoint doesn't act
  // as an account-existence oracle.
  if (!user || !user.passwordHash || user.emailVerified) {
    return NextResponse.json({ ok: true });
  }

  const newToken = crypto.randomBytes(32).toString("hex");
  await prisma.user.update({
    where: { id: user.id },
    data: { emailVerificationToken: newToken },
  });

  const send = await sendVerificationEmail(email, newToken);
  if (!send.ok) {
    return NextResponse.json(
      { ok: false, error: "Couldn't send the email. Try again in a moment." },
      { status: 500 },
    );
  }
  return NextResponse.json({ ok: true });
}
