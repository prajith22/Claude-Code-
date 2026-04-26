import Stripe from "stripe";

export const stripe = new Stripe(
  process.env.STRIPE_SECRET_KEY || "sk_test_placeholder_not_a_real_key",
  { typescript: true },
);

export const TRIAL_DAYS = 7;
export const UNLIMITED_LIMIT = 999_999;
export const BILLING_CYCLE_DAYS = 30;

export type PlanId = "lite" | "plus" | "pro";

export type Plan = {
  id: PlanId;
  name: string;
  priceUsd: number;
  /** Sentinel UNLIMITED_LIMIT means no cap. */
  simulationsLimit: number;
  priceId: string;
  features: string[];
  ctaLabel: string;
  highlighted?: boolean;
};

export const PLANS: Record<PlanId, Plan> = {
  lite: {
    id: "lite",
    name: "Dopiq Lite",
    priceUsd: 3.99,
    simulationsLimit: 75,
    priceId: process.env.STRIPE_LITE_PRICE_ID ?? "",
    features: [
      "75 simulations per month",
      "Shop and Food simulators",
      "Sports betting simulator",
      "Daily spin wheel",
    ],
    ctaLabel: "Start Free Trial",
  },
  plus: {
    id: "plus",
    name: "Dopiq Plus",
    priceUsd: 6.99,
    simulationsLimit: 600,
    priceId: process.env.STRIPE_PLUS_PRICE_ID ?? "",
    features: [
      "600 simulations per month",
      "All Lite features",
      "Priority access to new features",
      "Flash deals and exclusive drops",
    ],
    ctaLabel: "Start Free Trial",
    highlighted: true,
  },
  pro: {
    id: "pro",
    name: "Dopiq Pro",
    priceUsd: 12.99,
    simulationsLimit: UNLIMITED_LIMIT,
    priceId: process.env.STRIPE_PRO_PRICE_ID ?? "",
    features: [
      "Unlimited simulations",
      "All Plus features",
      "Never hit a limit",
      "Early access to beta features",
    ],
    ctaLabel: "Go Unlimited",
  },
};

export function planFromPriceId(priceId: string | null | undefined): PlanId | null {
  if (!priceId) return null;
  for (const p of Object.values(PLANS)) {
    if (p.priceId && p.priceId === priceId) return p.id;
  }
  return null;
}

export function isUnlimited(limit: number): boolean {
  return limit >= UNLIMITED_LIMIT;
}
