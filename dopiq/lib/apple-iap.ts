// Apple In-App Purchase verification helpers. Used by the
// /api/iap/verify-receipt route (when the iOS app says "the user
// just paid, please activate access") and by the
// /api/iap/notifications route (when Apple sends a server-to-
// server subscription event).
//
// All Apple-side communication happens here so the higher-level
// routes don't have to know about endpoint URLs, sandbox-vs-prod
// retries, or product-ID-to-plan mapping.

import type { PlanId } from "@/lib/stripe";

const PROD_VERIFY_URL = "https://buy.itunes.apple.com/verifyReceipt";
const SANDBOX_VERIFY_URL = "https://sandbox.itunes.apple.com/verifyReceipt";

// Apple returns 21007 to signal "this receipt was generated against
// the sandbox; please retry against the sandbox endpoint". We honor
// that automatically so the same code path handles real App Store
// purchases AND TestFlight / sandbox-tester purchases.
const STATUS_RETRY_IN_SANDBOX = 21007;

// App Store Connect product identifiers. These need to match the
// productIds we configure under "In-App Purchases" in App Store
// Connect exactly. Keep in sync with PLANS in lib/stripe.ts so the
// web Stripe plans and the iOS IAP plans line up 1:1.
const PRODUCT_ID_TO_PLAN: Record<string, PlanId> = {
  "com.dopiq.app.lite_monthly": "lite",
  "com.dopiq.app.plus_monthly": "plus",
  "com.dopiq.app.pro_monthly": "pro",
};

export type AppleTransactionInfo = {
  product_id?: string;
  original_transaction_id?: string;
  transaction_id?: string;
  expires_date_ms?: string;
  purchase_date_ms?: string;
  // Apple sends many more fields (web_order_line_item_id,
  // is_trial_period, etc.) — we keep the type loose so we don't
  // have to restate Apple's whole schema, but the fields we
  // actively use are listed here for IDE support.
  [key: string]: unknown;
};

export type ApplePendingRenewalInfo = {
  product_id?: string;
  original_transaction_id?: string;
  auto_renew_status?: string;
  expiration_intent?: string;
  [key: string]: unknown;
};

export type AppleReceiptResponse = {
  status: number;
  environment?: "Production" | "Sandbox";
  receipt?: { in_app?: AppleTransactionInfo[] };
  latest_receipt?: string;
  latest_receipt_info?: AppleTransactionInfo[];
  pending_renewal_info?: ApplePendingRenewalInfo[];
  [key: string]: unknown;
};

function getSharedSecret(): string {
  const secret = process.env.APPLE_IAP_SHARED_SECRET;
  if (secret && secret.length > 0) return secret;
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "[apple-iap] APPLE_IAP_SHARED_SECRET is required in production. Generate an app-specific shared secret in App Store Connect → Apps → Dopiq → App Information → App-Specific Shared Secret.",
    );
  }
  console.warn(
    "[apple-iap] APPLE_IAP_SHARED_SECRET is not set. Receipt verification will fail; using empty secret for local-dev passthrough.",
  );
  return "";
}

async function postReceipt(
  url: string,
  receiptData: string,
  password: string,
): Promise<AppleReceiptResponse> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      "receipt-data": receiptData,
      password,
      "exclude-old-transactions": true,
    }),
  });
  if (!res.ok) {
    throw new Error(
      `[apple-iap] verifyReceipt HTTP ${res.status} from ${url}`,
    );
  }
  return (await res.json()) as AppleReceiptResponse;
}

/**
 * POST a receipt to Apple's verifyReceipt endpoint. Tries the
 * production URL first; if Apple replies with status 21007 (the
 * sandbox-receipt sentinel), retries against the sandbox URL. This
 * dual-endpoint pattern is required by Apple — the same backend
 * code must handle both real-world and TestFlight purchases.
 *
 * Throws on network failures and on missing shared secret in
 * production. Otherwise returns the raw response (callers should
 * inspect `status` and the transaction arrays themselves).
 */
export async function verifyReceiptWithApple(
  receiptData: string,
): Promise<AppleReceiptResponse> {
  const password = getSharedSecret();

  const prodResponse = await postReceipt(PROD_VERIFY_URL, receiptData, password);
  if (prodResponse.status !== STATUS_RETRY_IN_SANDBOX) {
    return prodResponse;
  }
  // Apple told us to retry in the sandbox.
  return await postReceipt(SANDBOX_VERIFY_URL, receiptData, password);
}

/**
 * Translate an App Store Connect product ID into one of our
 * internal plan ids (lite | plus | pro). Returns null for any
 * unknown product so callers can fail loudly instead of silently
 * activating an unmapped plan.
 */
export function mapProductIdToPlan(productId: string): PlanId | null {
  return PRODUCT_ID_TO_PLAN[productId] ?? null;
}

/**
 * Pick the most recent transaction out of `latest_receipt_info`.
 * Apple returns transactions in roughly chronological order but
 * the spec doesn't guarantee it, so we sort by purchase_date_ms
 * descending and take the head.
 */
export function pickLatestTransaction(
  txns: AppleTransactionInfo[] | undefined,
): AppleTransactionInfo | null {
  if (!txns || txns.length === 0) return null;
  const sorted = [...txns].sort((a, b) => {
    const aMs = Number(a.purchase_date_ms ?? 0);
    const bMs = Number(b.purchase_date_ms ?? 0);
    return bMs - aMs;
  });
  return sorted[0] ?? null;
}
