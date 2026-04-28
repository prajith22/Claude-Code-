import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SALT_ROUNDS = 12;
const MIN_PASSWORD_LEN = 8;

/**
 * Email + password signup. Hashes the password with bcrypt at 12
 * rounds, creates the User row with emailVerified=null, generates a
 * verification token, and sends the verification email. The client
 * is then routed to /verify-email — not signed in until the user
 * clicks the link.
 *
 * Lives at /api/signup (not /api/auth/signup) because the entire
 * /api/auth/* namespace is owned by the NextAuth catch-all route.
 */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as
    | { email?: string; password?: string }
    | null;

  const email = body?.email?.toLowerCase().trim();
  const password = body?.password;

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required." },
      { status: 400 },
    );
  }
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json(
      { error: "Enter a valid email address." },
      { status: 400 },
    );
  }
  if (password.length < MIN_PASSWORD_LEN) {
    return NextResponse.json(
      { error: `Password must be at least ${MIN_PASSWORD_LEN} characters.` },
      { status: 400 },
    );
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "An account with that email already exists." },
      { status: 409 },
    );
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const emailVerificationToken = crypto.randomBytes(32).toString("hex");
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      emailVerified: null,
      emailVerificationToken,
    },
  });

  // Fire the verification email. We surface failures back to the
  // client so the SignUpForm can show "couldn't send email" state
  // and offer a manual retry via the resend endpoint.
  const send = await sendVerificationEmail(email, emailVerificationToken);
  if (!send.ok) {
    return NextResponse.json(
      {
        ok: true,
        userId: user.id,
        emailSent: false,
        error: "Account created but we couldn't send the verification email.",
      },
      { status: 200 },
    );
  }

  return NextResponse.json({ ok: true, userId: user.id, emailSent: true });
}
