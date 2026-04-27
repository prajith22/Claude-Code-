import { redirect } from "next/navigation";
import { requireUser } from "@/lib/session-guards";
import { OnboardingFlow } from "@/components/OnboardingFlow";

export const dynamic = "force-dynamic";

// Lives outside the (app) group so the 3-screen welcome flow renders
// without TopNav / BottomNav. Authed users only — unauthed visitors
// get bounced to /signin by middleware before they reach this route.
export default async function OnboardingPage() {
  const user = await requireUser();

  // Returning users — anyone who already completed onboarding —
  // skip the flow entirely. Their normal access state determines
  // whether they land on /home or /paywall.
  if (user.onboardingCompleted) {
    redirect("/paywall");
  }

  return <OnboardingFlow />;
}
