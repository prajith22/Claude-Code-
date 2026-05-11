import { Suspense } from "react";
import { SignUpForm } from "@/components/SignUpForm";
import { SignInMarketing } from "@/components/SignInMarketing";
import { isIOSWebView } from "@/lib/is-ios-webview";

// SSR per-request — iOS branch reads the request UA, not safe to
// statically cache.
export const dynamic = "force-dynamic";

export default function SignUpPage() {
  // Inside the iOS WebView: hide the marketing column's Bet tile
  // AND the SignUpForm's "Continue with Google" button. Same UA
  // check covers both. Apple Sign-In and email + password remain.
  const ios = isIOSWebView();
  return (
    <main className="min-h-[100dvh] bg-white md:grid md:grid-cols-2">
      <SignInMarketing excludeBet={ios} />
      <section className="flex min-h-[100dvh] items-center justify-center px-6 py-10 md:py-12">
        <Suspense fallback={null}>
          <SignUpForm excludeGoogle={ios} />
        </Suspense>
      </section>
    </main>
  );
}
