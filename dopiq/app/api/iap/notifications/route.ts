import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { mapProductIdToPlan } from "@/lib/apple-iap";
import { PLANS } from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ⚠️ TODO — JWS signature verification is NOT implemented yet.
//
// Apple's v2 server-to-server notifications arrive as a single
// `signedPayload` JWS (JSON Web Signature) signed with Apple's CA
// chain. To verify authenticity we need to:
//
//   1. Decode the JWS header to get the x5c cert chain.
//   2. Validate that chain against Apple's known root CAs.
//   3. Verify the JWS signature using the leaf cert's public key.
//
// Apple's official Node SDK (`@apple/app-store-server-library`)
// handles all of this. It is NOT yet in package.json — adding
// native deps mid-foundation work risks bricking the build, so
// signature verification is deferred to a follow-up. Until that
// lands, this endpoint trusts the payload it receives. Anyone
// who knows the URL can post a forged notification and flip a
// user's subscriptionStatus.
//
// Mitigations until verification is wired up:
//   - The endpoint URL is registered with Apple in App Store
//     Connect; reasonable obscurity against drive-by abuse.
//   - We always re-verify the receipt against Apple before
//     activating a user (verify-receipt route does this), so a
//     forged DID_RENEW can't grant access on its own — it can
//     only flip an already-existing IAP user's state.
//   - A forged EXPIRED / REFUND can revoke a real user's access,
//     which is annoying but not catastrophic; they'd recover on
//     the next legitimate notification or via support.
//
// Add `@apple/app-store-server-library` and verify the JWS before
// enabling this endpoint in production traffic at scale.
console.warn(
  "[iap.notifications] JWS signature verification not implemented — see TODO at top of file. Production notifications will be processed without authenticity checks until @apple/app-store-server-library is wired up.",
);

type AppleNotificationV2 = {
  signedPayload?: string;
};

type DecodedNotification = {
  notificationType?: string;
  subtype?: string;
  data?: {
    appAppleId?: number;
    bundleId?: string;
    bundleVersion?: string;
    environment?: "Sandbox" | "Production";
    signedTransactionInfo?: string;
    signedRenewalInfo?: string;
  };
  // We extract these from the signed payload manually below.
  [key: string]: unknown;
};

type DecodedTransaction = {
  originalTransactionId?: string;
  transactionId?: string;
  productId?: string;
  expiresDate?: number;
  purchaseDate?: number;
  [key: string]: unknown;
};

// Decode a JWS payload WITHOUT verifying the signature. base64url
// decode the middle segment and parse it as JSON. This is the bit
// that needs to be replaced with a verifying decoder once the Apple
// SDK is wired up.
function unsafeDecodeJWS<T>(jws: string): T | null {
  try {
    const [, payload] = jws.split(".");
    if (!payload) return null;
    const padded =
      payload.replace(/-/g, "+").replace(/_/g, "/") +
      "=".repeat((4 - (payload.length % 4)) % 4);
    const json = Buffer.from(padded, "base64").toString("utf8");
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

/**
 * POST /api/iap/notifications
 *
 * Apple App Store Server Notifications v2 endpoint. Apple POSTs
 * subscription lifecycle events here (renewals, expirations,
 * refunds, billing failures). No auth — Apple's servers call us
 * directly, identified by the JWS signature that we currently
 * trust without verifying (see TODO above).
 *
 * Always returns 200 on processed events so Apple doesn't retry.
 * 500 only on internal errors that are worth a retry from
 * Apple's side.
 */
export async function POST(req: Request) {
  let body: AppleNotificationV2;
  try {
    body = (await req.json()) as AppleNotificationV2;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body.signedPayload) {
    return NextResponse.json(
      { error: "signedPayload missing" },
      { status: 400 },
    );
  }

  const decoded = unsafeDecodeJWS<DecodedNotification>(body.signedPayload);
  if (!decoded) {
    return NextResponse.json(
      { error: "signedPayload could not be decoded" },
      { status: 400 },
    );
  }

  const txn = decoded.data?.signedTransactionInfo
    ? unsafeDecodeJWS<DecodedTransaction>(decoded.data.signedTransactionInfo)
    : null;
  const originalTransactionId = txn?.originalTransactionId;
  if (!originalTransactionId) {
    console.warn(
      "[iap.notifications] Notification has no originalTransactionId; ignoring.",
      { type: decoded.notificationType, subtype: decoded.subtype },
    );
    return NextResponse.json({ ok: true });
  }

  // Look up the user this notification belongs to.
  const user = await prisma.user.findUnique({
    where: { appleOriginalTransactionId: originalTransactionId },
  });
  if (!user) {
    // Either a stale notification (subscription on a deleted user)
    // or a bug. 200 so Apple doesn't retry — they'd just keep
    // hitting the same dead end.
    console.warn(
      "[iap.notifications] No user for originalTransactionId:",
      originalTransactionId,
      decoded.notificationType,
    );
    return NextResponse.json({ ok: true });
  }

  const type = decoded.notificationType;
  try {
    switch (type) {
      case "DID_RENEW": {
        // Successful auto-renewal. Reset the monthly cap and bump
        // billingCycleStart so the simulations counter rolls
        // forward, mirroring how the Stripe webhook handles
        // invoice.paid for renewals.
        const productId = txn?.productId ?? null;
        const plan = productId ? mapProductIdToPlan(productId) : null;
        await prisma.user.update({
          where: { id: user.id },
          data: {
            subscriptionStatus: "active",
            subscriptionSource: "ios",
            ...(plan
              ? {
                  plan,
                  simulationsLimit: PLANS[plan].simulationsLimit,
                }
              : {}),
            simulationsUsed: 0,
            billingCycleStart: new Date(),
          },
        });
        break;
      }

      case "EXPIRED": {
        // Subscription expired and auto-renew is off (or final
        // grace-period attempt failed). Mirror the Stripe
        // "canceled" terminal state so computeAccessState bounces
        // the user to /paywall on their next request.
        await prisma.user.update({
          where: { id: user.id },
          data: { subscriptionStatus: "canceled" },
        });
        break;
      }

      case "DID_FAIL_TO_RENEW": {
        // Billing failure. Apple gives a grace period before the
        // subscription actually expires, so we keep status
        // "active" and just log. If the renewal eventually fails
        // permanently, an EXPIRED notification will arrive.
        console.warn(
          "[iap.notifications] DID_FAIL_TO_RENEW for user",
          user.id,
          "subtype",
          decoded.subtype,
        );
        break;
      }

      case "REFUND": {
        // Apple issued a refund. Revoke access immediately and
        // clear the plan so the user falls back to the paywall.
        await prisma.user.update({
          where: { id: user.id },
          data: {
            subscriptionStatus: "canceled",
            plan: null,
          },
        });
        break;
      }

      default: {
        // Unhandled type — log and move on. Apple has many event
        // types (DID_CHANGE_RENEWAL_STATUS, OFFER_REDEEMED, etc.);
        // we'll add cases as we need them.
        console.info(
          "[iap.notifications] Unhandled notificationType:",
          type,
          decoded.subtype,
        );
      }
    }
  } catch (err) {
    console.error("[iap.notifications] Processing error:", err);
    // Tell Apple to retry. Internal failures (DB hiccups, etc.)
    // get a second chance.
    return NextResponse.json(
      { error: "Internal error" },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
