import { Suspense } from "react";
import { SignInForm } from "@/components/SignInForm";
import { SignInMarketing } from "@/components/SignInMarketing";
import { isIOSWebView } from "@/lib/is-ios-webview";

// /signin's marketing column hides its Bet preview tile when the
// request is from the iOS WebView, so the page must SSR per
// request — not statically cached.
export const dynamic = "force-dynamic";

export default function SignInPage() {
  // Both the marketing column's Bet tile and the SignInForm's
  // Google button are hidden inside the iOS WebView — same UA
  // check, two consumers.
  const ios = isIOSWebView();
  return (
    <main className="relative min-h-[100dvh] bg-[#FAFAF8] md:grid md:grid-cols-2">
      {/* Ambient brand wash — faint emerald bloom from the top
          center fading to cream. Behind the form column (which has
          no own background); the marketing column's opaque fill
          sits over it. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(16,185,129,0.10) 0%, rgba(16,185,129,0) 65%)",
        }}
      />
      <SignInMarketing excludeBet={ios} />
      <section className="flex flex-col items-center px-6 pb-10 pt-2 md:min-h-[100dvh] md:justify-center md:py-12">
        <Suspense fallback={null}>
          <SignInForm excludeGoogle={ios} />
        </Suspense>
      </section>
    </main>
  );
}
