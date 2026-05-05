// dopiq-ios/lib/iap.ts
//
// Tiny shared helpers for talking to the Dopiq backend's IAP routes.
// Used by NativePaywall (fresh purchase + restore button) and by
// App.tsx (postMessage-driven Restore Purchases flow from the
// in-WebView Settings page). Lives outside the component so the
// receipt-POST + restore logic doesn't drift between call sites.

import {
  getAvailablePurchases,
  type Purchase,
} from "react-native-iap";

const VERIFY_URL = "https://dopiqapp.com/api/iap/verify-receipt";

export type DopiqPlan = "lite" | "plus" | "pro";

/**
 * POST a base64 Apple receipt to /api/iap/verify-receipt and return
 * the activated plan id.
 *
 * Auth note: react-native-webview is configured with
 * `sharedCookiesEnabled: true`, which writes WKWebView's cookies
 * into iOS's HTTPCookieStorage.shared. RN's fetch (NSURLSession on
 * iOS) reads from the same store, so the NextAuth session cookie
 * is attached automatically. `credentials: "include"` is symmetric
 * but the real plumbing is the shared cookie storage.
 */
export async function verifyReceiptOnBackend(
  receipt: string,
): Promise<DopiqPlan> {
  const res = await fetch(VERIFY_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ receiptData: receipt }),
  });
  const data = (await res.json().catch(() => ({}))) as {
    success?: boolean;
    plan?: DopiqPlan;
    error?: string;
  };
  if (!res.ok || !data.success || !data.plan) {
    throw new Error(
      data.error ?? `Verification failed (HTTP ${res.status}).`,
    );
  }
  return data.plan;
}

/**
 * Pick the most recent transaction from a list of past purchases.
 * Apple doesn't formally guarantee `transactionDate` order, so we
 * sort defensively.
 */
export function pickLatestPurchase(purchases: Purchase[]): Purchase | null {
  if (!purchases.length) return null;
  return [...purchases].sort((a, b) => {
    const aMs = Number(a.transactionDate ?? 0);
    const bMs = Number(b.transactionDate ?? 0);
    return bMs - aMs;
  })[0]!;
}

/**
 * Restore Purchases: query Apple for active subscriptions on the
 * current Apple ID, send the latest receipt to our backend for
 * verification, and resolve to the activated plan.
 *
 * Throws on no-purchases / no-receipt / verify-rejected so callers
 * can surface a single friendly message via try/catch.
 */
export async function restoreLatestPurchase(): Promise<DopiqPlan> {
  const purchases = await getAvailablePurchases();
  const latest = pickLatestPurchase(purchases);
  if (!latest) {
    throw new Error("No previous purchases found on this Apple ID.");
  }
  const receipt = latest.transactionReceipt;
  if (!receipt) {
    throw new Error("Couldn't read the latest receipt for restore.");
  }
  return await verifyReceiptOnBackend(receipt);
}
