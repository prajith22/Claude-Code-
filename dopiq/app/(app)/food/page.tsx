import { requireSubscribedUser } from "@/lib/session-guards";
import type { FoodPrefs } from "@/types";
import { FoodExperience } from "@/components/FoodExperience";
import { SimDisclaimer } from "@/components/SimDisclaimer";

export default async function FoodPage() {
  const user = await requireSubscribedUser();
  const prefs = (user.foodPrefs as FoodPrefs | null) ?? null;

  return (
    <>
      <FoodExperience prefs={prefs} />
      <SimDisclaimer text="All restaurants, menus, and delivery experiences are fictional simulations. Dopiq is not affiliated with any food service. No real order is ever placed." />
    </>
  );
}
