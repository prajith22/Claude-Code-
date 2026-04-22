import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = ["/", "/signin"];
const ALWAYS_ALLOW_PREFIXES = [
  "/api/auth",
  "/api/stripe/webhook",
  "/_next",
  "/favicon.ico",
  "/icon",
  "/apple-icon",
  "/robots.txt",
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (ALWAYS_ALLOW_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (!token) {
    if (PUBLIC_PATHS.includes(pathname)) return NextResponse.next();
    const signin = req.nextUrl.clone();
    signin.pathname = "/signin";
    signin.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signin);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
