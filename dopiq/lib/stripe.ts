import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "sk_test_placeholder", {
  apiVersion: "2024-10-28.acacia",
  typescript: true,
});

export const SUBSCRIPTION_PRICE_ID = process.env.STRIPE_PRICE_ID ?? "";
export const SUBSCRIPTION_PRICE_USD = 3.99;
export const TRIAL_DAYS = 30;
