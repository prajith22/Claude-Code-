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

// Authed-only paths that don't live under (app) — the middleware's
// signed-out check still bounces unauthed visitors to /signin, but
// the page itself doesn't get the gated TopNav/BottomNav chrome.
// /onboarding renders the 3-screen welcome flow as a full-screen
// overlay so the chrome would just get in the way.

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (ALWAYS_ALLOW_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // We only check for cookie PRESENCE here — we don't decode the JWT
  // in middleware. Real session validation (and the user lookup off
  // the token id) happens in getServerSession() inside each page's
  // requireUser() / requireSubscribedUser() guard.
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
