import { UNLIMITED_LIMIT } from "./stripe";

export type AccessState = "active" | "paywalled";

type UserLike = {
  subscriptionStatus?: string | null;
  isReviewer?: boolean | null;
};

export function computeAccessState(user: UserLike): AccessState {
  // App Store reviewers bypass the paywall entirely. Flag is set
  // manually in the database for verified review accounts; no
  // user-facing UI ever flips it. Apple's reviewers don't have a
  // Stripe subscription and aren't expected to enter one.
  if (user.isReviewer === true) return "active";
  const status = user.subscriptionStatus;
  if (status === "trialing" || status === "active") return "active";
  return "paywalled";
}

export function paywallReason(
  user: UserLike,
): "payment_failed" | "canceled" | "none" {
  const status = user.subscriptionStatus;
  if (status === "past_due" || status === "unpaid") return "payment_failed";
  if (status === "canceled" || status === "incomplete_expired") return "canceled";
  return "none";
}

export function simulationsRemaining(
  used: number,
  limit: number,
): number | "unlimited" {
  if (limit >= UNLIMITED_LIMIT) return "unlimited";
  return Math.max(0, limit - used);
}
