import { TRIAL_DAYS, UNLIMITED_LIMIT } from "./stripe";

export type AccessState = "trial" | "active" | "paywalled";

type UserLike = {
  plan?: string | null;
  subscriptionStatus?: string | null;
  trialStartDate?: Date | string | null;
  trialEndDate?: Date | string | null;
};

function computeTrialEnd(start?: Date | string | null): Date {
  const startDate = start ? new Date(start) : new Date();
  return new Date(startDate.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000);
}

export function isTrialActive(user: UserLike): boolean {
  const end = user.trialEndDate
    ? new Date(user.trialEndDate)
    : computeTrialEnd(user.trialStartDate);
  return end.getTime() > Date.now();
}

export function trialDaysRemaining(user: UserLike): number {
  const end = user.trialEndDate
    ? new Date(user.trialEndDate)
    : computeTrialEnd(user.trialStartDate);
  const ms = end.getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

export function computeAccessState(user: UserLike): AccessState {
  const status = user.subscriptionStatus ?? "trial";
  if (status === "active" || status === "trialing_paid") return "active";
  if (isTrialActive(user)) return "trial";
  return "paywalled";
}

export function simulationsRemaining(
  used: number,
  limit: number,
): number | "unlimited" {
  if (limit >= UNLIMITED_LIMIT) return "unlimited";
  return Math.max(0, limit - used);
}
