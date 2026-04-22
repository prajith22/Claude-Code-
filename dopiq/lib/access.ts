import { TRIAL_DAYS } from "./stripe";

export type AccessState = "trialing" | "active" | "paywalled";

export function computeAccessState(params: {
  subscriptionStatus?: string | null;
  trialStartDate?: Date | string | null;
}): AccessState {
  const status = params.subscriptionStatus ?? "trialing";
  if (status === "active" || status === "trialing_paid") return "active";

  const start = params.trialStartDate ? new Date(params.trialStartDate) : new Date();
  const msInDay = 1000 * 60 * 60 * 24;
  const elapsed = (Date.now() - start.getTime()) / msInDay;
  if (elapsed < TRIAL_DAYS) return "trialing";
  return "paywalled";
}

export function trialDaysRemaining(trialStartDate?: Date | string | null): number {
  if (!trialStartDate) return TRIAL_DAYS;
  const start = new Date(trialStartDate);
  const msInDay = 1000 * 60 * 60 * 24;
  const elapsed = (Date.now() - start.getTime()) / msInDay;
  return Math.max(0, Math.ceil(TRIAL_DAYS - elapsed));
}
