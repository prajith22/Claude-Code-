import { Suspense } from "react";
import { SignUpForm } from "@/components/SignUpForm";
import { SignInMarketing } from "@/components/SignInMarketing";
import { IOSSignInOnlyScreen } from "@/components/IOSSignInOnlyScreen";
import { isIOSWebView } from "@/lib/is-ios-webview";

// /signup must SSR per request because the iOS branch reads the
// request's User-Agent header — Next.js can't statically cache
// the iOS-vs-web split.
export const dynamic = "force-dynamic";

export default function SignUpPage() {
  // App Store Review Guideline 3.1.1 — the iOS app cannot host a
  // sign-up surface because account creation funnels into the
  // web-only Stripe purchase flow. iOS users get a sign-in-only
  // screen instead. Web users see the existing form unchanged.
  if (isIOSWebView()) {
    return <IOSSignInOnlyScreen />;
  }

  return (
    <main className="min-h-[100dvh] bg-white md:grid md:grid-cols-2">
      <SignInMarketing />
      <section className="flex min-h-[100dvh] items-center justify-center px-6 py-10 md:py-12">
        <Suspense fallback={null}>
          <SignUpForm />
        </Suspense>
      </section>
    </main>
  );
}
