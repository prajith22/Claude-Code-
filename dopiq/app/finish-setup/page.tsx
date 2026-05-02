import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeAccessState } from "@/lib/access";
import { PLANS, type Plan } from "@/lib/stripe";
import { PaywallPlanCard } from "@/components/PaywallPlanCard";

// Per-request render — depends on the signed-in user's
// subscription state.
export const dynamic = "force-dynamic";

/**
 * /finish-setup — the web landing page iOS users hit after tapping
 * "Continue setup on the web" inside the iOS shell. Three branches:
 *
 *   1. Not signed in → kick to /signin with this URL as callback so
 *      they come back here once authenticated.
 *   2. Signed in but onboarding incomplete → /onboarding (the
 *      welcome flow always runs first, on web and iOS alike).
 *   3. Signed in + onboarded + no active sub → render the same
 *      Stripe paywall web users see, with a header explaining why
 *      they're here. Reuses PaywallPlanCard so the plan grid is
 *      identical to /paywall.
 *   4. Signed in + active sub (or reviewer) → "all set" screen
 *      that tells them to switch back to the iOS app.
 *
 * Note: this page is only ever loaded in mobile Safari (or any
 * non-WebView browser). The iOS shell punts dopiqapp.com/finish-setup
 * URLs out to Linking.openURL via App.tsx's onShouldStartLoadWithRequest
 * interceptor, so it never renders inside the WebView.
 */
export default async function FinishSetupPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/signin?callbackUrl=%2Ffinish-setup");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });
  if (!user) {
    redirect("/signin?callbackUrl=%2Ffinish-setup");
  }

  if (!user.onboardingCompleted) {
    redirect("/onboarding");
  }

  const isActive = computeAccessState(user) === "active";

  if (isActive) {
    return <AllSet email={user.email} />;
  }

  const order: Plan[] = [PLANS.lite, PLANS.plus, PLANS.pro];

  return (
    <main className="mx-auto flex min-h-[100dvh] max-w-5xl flex-col px-6 pb-12 pt-10 safe-top">
      <header className="text-center">
        <Link href="/home" className="inline-flex items-center gap-3">
          <svg width="44" height="44" viewBox="0 0 44 44" fill="none" aria-hidden>
            <rect width="44" height="44" rx="10" fill="#00C853" />
            <path
              d="M10 10 L10 34 L18 34 Q30 34 30 22 Q30 10 18 10 Z"
              fill="white"
            />
            <line
              x1="10"
              y1="22"
              x2="27"
              y2="22"
              stroke="#00C853"
              strokeWidth="2.5"
            />
          </svg>
          <span className="font-heading text-[28px] font-extrabold leading-none text-ink">
            dopiq
          </span>
        </Link>

        <p className="mx-auto mt-6 max-w-md rounded-pill bg-brand-light px-4 py-1.5 text-[12px] font-bold uppercase tracking-widest text-brand">
          Finish setting up your account
        </p>
        <h1 className="mt-4 font-heading text-[34px] font-bold leading-tight tracking-tight text-ink md:text-[42px]">
          Choose your plan to get started
        </h1>
        <p className="mx-auto mt-3 max-w-md text-[16px] text-ink-muted">
          Pick a plan, start your 7-day free trial, then jump back into the
          Dopiq app on your iPhone. Cancel anytime.
        </p>
      </header>

      <section className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-3">
        {order.map((plan) => (
          <PaywallPlanCard key={plan.id} plan={plan} />
        ))}
      </section>

      <footer className="mt-10 text-center">
        <p className="text-[14px] text-ink-muted">
          Need help?{" "}
          <a
            href="mailto:support@dopiqapp.com"
            className="font-semibold text-ink underline"
          >
            Contact support
          </a>
        </p>
      </footer>
    </main>
  );
}

function AllSet({ email }: { email: string }) {
  return (
    <main className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col items-center justify-center bg-[#FAFAF8] px-6 py-12 text-center safe-top">
      <div className="flex items-center gap-3">
        <svg width="44" height="44" viewBox="0 0 44 44" fill="none" aria-hidden>
          <rect width="44" height="44" rx="10" fill="#00C853" />
          <path
            d="M10 10 L10 34 L18 34 Q30 34 30 22 Q30 10 18 10 Z"
            fill="white"
          />
          <line
            x1="10"
            y1="22"
            x2="27"
            y2="22"
            stroke="#00C853"
            strokeWidth="2.5"
          />
        </svg>
        <span className="font-heading text-[28px] font-extrabold leading-none text-[#0A0F1E]">
          dopiq
        </span>
      </div>

      <div className="mt-9 flex h-16 w-16 items-center justify-center rounded-full bg-[#E8F5E9] text-brand">
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="m5 12.5 5 5 9-10" />
        </svg>
      </div>

      <h1 className="mt-6 font-heading text-[28px] font-bold leading-tight tracking-tight text-[#0A0F1E] md:text-[32px]">
        You&rsquo;re all set!
      </h1>
      <p className="mt-3 max-w-sm font-sans text-[16px] leading-relaxed text-ink-muted">
        Open the Dopiq iOS app and sign in as{" "}
        <span className="font-semibold text-[#0A0F1E]">{email}</span> to
        continue.
      </p>

      <p className="mt-6 max-w-sm font-sans text-[13px] leading-relaxed text-ink-faint">
        If you&rsquo;re already signed in on the iOS app, sign out and back in
        once so it picks up your new subscription.
      </p>
    </main>
  );
}
