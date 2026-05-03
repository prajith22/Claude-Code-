import { headers } from "next/headers";

// The iOS Expo shell appends "DopiqIOSApp" to its WebView's
// User-Agent (see dopiq-ios/App.tsx → applicationNameForUserAgent).
// We read that marker here so server components and route handlers
// can branch on "request came from inside the iOS app".
const UA_MARKER = "DopiqIOSApp";

/**
 * True if the current request's User-Agent identifies it as the
 * Dopiq iOS WebView. Safe to call from any server component / route
 * handler; relies on Next.js's request-scoped headers().
 *
 * Required for App Store Review Guideline 3.1.1: the iOS app must
 * not display prices or "Subscribe" CTAs for digital goods sold
 * outside Apple's IAP. The /paywall and other purchase surfaces use
 * this to render an iOS-only "set up on the web" screen with no
 * pricing information.
 */
export function isIOSWebView(): boolean {
  const ua = headers().get("user-agent") ?? "";
  return ua.includes(UA_MARKER);
}
