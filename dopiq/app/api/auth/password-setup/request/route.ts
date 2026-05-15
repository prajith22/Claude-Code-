import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";
import { sendPasswordSetupEmail } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const COOLDOWN_MS = 60 * 1000; // 60 seconds
const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

/**
 * POST /api/auth/password-setup/request
 * Body: { email: string }
 *
 * Issues a one-time "set a password for your Google account" link.
 * ALWAYS responds { ok: true } — independent of email validity,
 * account existence, whether the user already has a password, or
 * the resend cooldown — so the endpoint can't be used as an
 * account-existence / state oracle. The email is only actually sent
 * for a real, password-less account that's outside the 60s cooldown.
 */
export async function POST(req: Request) {
  let email = "";
  try {
    const body = (await req.json()) as { email?: unknown };
    email = String(body?.email ?? "").toLowerCase().trim();
  } catch {
    return NextResponse.json({ ok: true });
  }

  if (!email || !email.includes("@")) {
    return NextResponse.json({ ok: true });
  }

  const user = await prisma.user.findUnique({ where: { email } });

  // No account → silent ok (no oracle).
  if (!user) {
    return NextResponse.json({ ok: true });
  }

  // Already has a password → they can sign in normally; nothing to
  // "set". Silent ok, no email.
  if (user.passwordHash) {
    return NextResponse.json({ ok: true });
  }

  // 60s resend cooldown — silent ok, no email, if too soon.
  if (user.passwordSetupRequestedAt) {
    const elapsed = Date.now() - user.passwordSetupRequestedAt.getTime();
    if (elapsed < COOLDOWN_MS) {
      return NextResponse.json({ ok: true });
    }
  }

  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + TOKEN_TTL_MS);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordSetupToken: token,
      passwordSetupTokenExpires: expires,
      passwordSetupRequestedAt: new Date(),
    },
  });

  // Send is best-effort: the cooldown + token were already committed
  // above, so a transient Resend failure just means the user retries
  // after 60s. Never surface the failure (would leak that the
  // account exists).
  try {
    await sendPasswordSetupEmail(email, token);
  } catch (e) {
    console.warn("[password-setup] email send failed:", e);
  }

  return NextResponse.json({ ok: true });
}
