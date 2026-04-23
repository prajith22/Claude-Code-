import { requireOnboardedSubscribedUser } from "@/lib/session-guards";
import type { FoodPrefs } from "@/types";
import { FoodExperience } from "@/components/FoodExperience";

export default async function FoodPage() {
  const user = await requireOnboardedSubscribedUser();
  const prefs = (user.foodPrefs as FoodPrefs | null) ?? null;

  return <FoodExperience prefs={prefs} />;
}
