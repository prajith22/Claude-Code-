import { requireSubscribedUser } from "@/lib/session-guards";
import type { FoodPrefs } from "@/types";
import { FoodExperience } from "@/components/FoodExperience";
import { UrgePickerModal } from "@/components/UrgePickerModal";

export default async function FoodPage() {
  const user = await requireSubscribedUser();
  const prefs = (user.foodPrefs as FoodPrefs | null) ?? null;

  return (
    <>
      <FoodExperience prefs={prefs} />
      <UrgePickerModal section="food" />
    </>
  );
}
