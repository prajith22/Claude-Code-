import { getCurrentUser } from "@/lib/session-guards";
import type { FoodPrefs } from "@/types";
import { FoodExperience } from "@/components/FoodExperience";
import { SimDisclaimer } from "@/components/SimDisclaimer";

// Auth + subscription enforced upstream by (app)/layout.tsx; the
// cached getCurrentUser dedupes with the layout's fetch so reading
// foodPrefs here costs zero extra DB work.
export default async function FoodPage() {
  const user = (await getCurrentUser())!;
  const prefs = (user.foodPrefs as FoodPrefs | null) ?? null;

  return (
    <>
      <FoodExperience prefs={prefs} />
      <SimDisclaimer text="All restaurants, menus, and delivery experiences are fictional simulations. Dopiq is not affiliated with any food service. No real order is ever placed." />
    </>
  );
}
