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
    <main className="min-h-[100dvh] bg-[#FAFAF8] md:grid md:grid-cols-2">
      <SignInMarketing excludeBet={ios} />
      <section className="flex min-h-[100dvh] items-center justify-center px-6 py-10 md:py-12">
        <Suspense fallback={null}>
          <SignInForm excludeGoogle={ios} />
        </Suspense>
      </section>
    </main>
  );
}
