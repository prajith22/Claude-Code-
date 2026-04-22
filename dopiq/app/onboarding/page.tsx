import { redirect } from "next/navigation";
import { requireUser } from "@/lib/session-guards";
import { OnboardingFlow } from "@/components/OnboardingFlow";

export default async function OnboardingPage() {
  const user = await requireUser();
  if (user.onboardingCompleted) redirect("/home");
  return <OnboardingFlow />;
}
