import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Dev-only diagnostic for the post-login redirect loop. Visit
// /api/dev/whoami in the browser AFTER the failed redirect to see:
//   - which auth cookie names the browser sent
//   - whether NEXTAUTH_URL matches the host
//   - whether getServerSession returns a user
//   - whether the DB has a matching row + the user's subscription fields
// Returns 404 in production.
export async function GET(req: Request) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const cookieHeader = req.headers.get("cookie") ?? "";
  const cookieNames = cookieHeader
    .split(";")
    .map((c) => c.trim().split("=")[0])
    .filter(Boolean);
  const sessionCookie =
    cookieNames.find((n) => n === "next-auth.session-token") ??
    cookieNames.find((n) => n === "__Secure-next-auth.session-token") ??
    null;

  let session: unknown = null;
  let sessionError: string | null = null;
  try {
    session = await getServerSession(authOptions);
  } catch (e) {
    sessionError = e instanceof Error ? e.message : String(e);
  }

  let dbUser: unknown = null;
  let dbError: string | null = null;
  const userId = (session as { user?: { id?: string } } | null)?.user?.id;
  if (userId) {
    try {
      dbUser = await prisma.user.findUnique({ where: { id: userId } });
    } catch (e) {
      dbError = e instanceof Error ? e.message : String(e);
    }
  }

  return NextResponse.json({
    requestUrl: req.url,
    requestOrigin: new URL(req.url).origin,
    nextauthUrl: process.env.NEXTAUTH_URL ?? null,
    cookieNames,
    sessionCookieFound: sessionCookie,
    session,
    sessionError,
    dbUser,
    dbError,
  });
}
