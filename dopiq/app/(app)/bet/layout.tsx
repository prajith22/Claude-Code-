import { redirect } from "next/navigation";
import { isIOSWebView } from "@/lib/is-ios-webview";

// Per-request gate for the entire /bet/* tree. Apple does not
// permit gambling features in apps from individual developer
// accounts, so any iOS-WebView request to /bet, /bet/tickets,
// /bet/[id], or /bet/confirmed is bounced back to /home before
// the underlying page renders. Web users (mobile Safari, desktop)
// fall through unchanged. We do this in a layout so client
// components further down the tree (/bet/tickets, /bet/confirmed)
// can stay unchanged — they never get to render.
export const dynamic = "force-dynamic";

export default function BetLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (isIOSWebView()) {
    redirect("/home");
  }
  return <>{children}</>;
}
