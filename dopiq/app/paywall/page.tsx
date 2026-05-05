import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeAccessState } from "@/lib/access";
import { PLANS, type Plan } from "@/lib/stripe";
import { PaywallPlanCard } from "@/components/PaywallPlanCard";
import { UpdatePaymentButton } from "@/components/UpdatePaymentButton";

// /paywall renders the same Stripe-backed plan grid for every
// caller. iOS shells almost never reach this URL — the native
// app's URL interceptor catches /paywall navigations BEFORE the
// WebView starts loading and presents the StoreKit-backed
// NativePaywall (see dopiq-ios/components/NativePaywall.tsx). If
// an iOS user does land here (e.g., interception fails on a
// server-side redirect chain), the web paywall is a safer
// fallback than the deprecated "go to web to subscribe" screen
// even though the Stripe success URL won't return them to the
// iOS app cleanly. force-dynamic stays so cache is per-request.
export const dynamic = "force-dynamic";

type PaywallReason = "payment_failed" | "canceled";

const REASON_MESSAGES: Record<PaywallReason, string> = {
  payment_failed:
    "Your payment failed. Please update your payment method to continue.",
  canceled:
    "Your subscription was canceled. Choose a plan to keep simulating.",
};

export default async function PaywallPage({
  searchParams,
}: {
  searchParams?: { reason?: string };
}) {
  const session = await getServerSession(authOptions);
  const user = session?.user?.id
    ? await prisma.user.findUnique({ where: { id: session.user.id } })
    : null;

  // Reviewer accounts (computeAccessState returns "active") and
  // already-subscribed users skip the paywall entirely on every
  // surface — including iOS — and land on /home.
  if (user && computeAccessState(user) === "active") {
    redirect("/home");
  }

  // Defense in depth: a logged-in but not-yet-onboarded user should
  // never see the paywall before the welcome flow. Any code path
  // that drops them here gets caught and redirected. Anonymous
  // visitors fall through and see the full pricing page as before.
  if (user && !user.onboardingCompleted) {
    redirect("/onboarding");
  }

  const reasonParam = searchParams?.reason;
  const reason: PaywallReason | null =
    reasonParam === "payment_failed" || reasonParam === "canceled"
      ? reasonParam
      : null;

  const order: Plan[] = [PLANS.lite, PLANS.plus, PLANS.pro];

  return (
    <main className="mx-auto flex min-h-[100dvh] max-w-5xl flex-col px-6 pt-10 pb-12 safe-top">
      <header className="text-center">
        <Link href="/home" className="inline-flex items-center gap-3">
          <svg width="44" height="44" viewBox="0 0 44 44" fill="none" aria-hidden>
            <rect width="44" height="44" rx="10" fill="#00C853" />
            <path d="M10 10 L10 34 L18 34 Q30 34 30 22 Q30 10 18 10 Z" fill="white" />
            <line x1="10" y1="22" x2="27" y2="22" stroke="#00C853" strokeWidth="2.5" />
          </svg>
          <span className="font-heading text-[28px] font-extrabold leading-none text-ink">
            dopiq
          </span>
        </Link>
        <h1 className="mt-5 font-heading text-[34px] font-bold leading-tight tracking-tight text-ink md:text-[42px]">
          Choose your plan to get started
        </h1>
        <p className="mx-auto mt-3 max-w-md text-[16px] text-ink-muted">
          No charge for 7 days. Cancel anytime.
        </p>

        {reason && (
          <div className="mx-auto mt-5 max-w-md rounded-card border border-red-200 bg-red-50 px-4 py-3 text-center text-[14px] font-medium text-red-700">
            <p>{REASON_MESSAGES[reason]}</p>
            {reason === "payment_failed" && user?.stripeCustomerId && (
              <UpdatePaymentButton />
            )}
          </div>
        )}
      </header>

      <section className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-3">
        {order.map((plan) => (
          <PaywallPlanCard key={plan.id} plan={plan} />
        ))}
      </section>

      <footer className="mt-10 text-center">
        <p className="text-[14px] text-ink-muted">
          Already have an account?{" "}
          <Link href="/signin" className="font-semibold text-ink underline">
            Sign in
          </Link>
        </p>
      </footer>
    </main>
  );
}

