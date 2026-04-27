import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = ["/", "/signin", "/signup", "/paywall"];
const ALWAYS_ALLOW_PREFIXES = [
  "/api/auth",
  "/api/signup",
  "/api/webhooks/",
  "/api/dev/",
  "/_next",
  "/favicon.ico",
  "/icon",
  "/apple-icon",
  "/robots.txt",
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (ALWAYS_ALLOW_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // authOptions uses strategy:"database" — the cookie holds a plain session ID,
  // not a JWT. getToken() only decodes JWTs so it always returns null here.
  // We check cookie presence instead; the real auth validation (DB lookup) happens
  // in getServerSession() inside each page's requireUser() server-side guard.
  const sessionToken =
    req.cookies.get("next-auth.session-token")?.value ??
    req.cookies.get("__Secure-next-auth.session-token")?.value;

  if (!sessionToken) {
    if (PUBLIC_PATHS.includes(pathname)) return NextResponse.next();
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
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
