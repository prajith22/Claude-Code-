import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  mapProductIdToPlan,
  pickLatestTransaction,
  verifyReceiptWithApple,
} from "@/lib/apple-iap";
import { PLANS, type PlanId } from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/iap/verify-receipt
 * Body: { receiptData: string }
 *
 * Called by the iOS app right after a successful StoreKit purchase
 * to tell our backend "this user just paid via Apple IAP, please
 * activate their subscription". The route:
 *
 *   1. Authenticates the caller via the NextAuth session cookie.
 *   2. Posts the base64 receipt to Apple's verifyReceipt endpoint
 *      (sandbox fallback handled inside the helper).
 *   3. Confirms status === 0 and pulls the most recent transaction
 *      out of latest_receipt_info.
 *   4. Maps the Apple productId to one of our internal plan ids
 *      (lite | plus | pro). Unknown products are rejected.
 *   5. Activates the user with subscriptionSource="ios" and stashes
 *      the original-transaction id so future server-to-server
 *      notifications can find this user. Stripe fields are left
 *      untouched — they remain null for IAP-sourced subscriptions.
 *
 * The response shape mirrors the shape the iOS client expects so it
 * can refresh its local state immediately.
 */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as
    | { receiptData?: string }
    | null;
  const receiptData = body?.receiptData;
  if (!receiptData || typeof receiptData !== "string") {
    return NextResponse.json(
      { error: "receiptData is required" },
      { status: 400 },
    );
  }

  let appleResponse;
  try {
    appleResponse = await verifyReceiptWithApple(receiptData);
  } catch (err) {
    console.error("[iap.verify-receipt] verify failed:", err);
    return NextResponse.json(
      { error: "Receipt verification failed. Try again." },
      { status: 500 },
    );
  }

  if (appleResponse.status !== 0) {
    console.warn(
      "[iap.verify-receipt] Apple returned non-zero status:",
      appleResponse.status,
    );
    return NextResponse.json(
      { error: "Apple rejected the receipt.", appleStatus: appleResponse.status },
      { status: 400 },
    );
  }

  const txn = pickLatestTransaction(appleResponse.latest_receipt_info);
  if (!txn || !txn.product_id || !txn.original_transaction_id) {
    return NextResponse.json(
      { error: "Receipt did not contain a usable transaction." },
      { status: 400 },
    );
  }

  const plan: PlanId | null = mapProductIdToPlan(txn.product_id);
  if (!plan) {
    console.error(
      "[iap.verify-receipt] Unknown product id:",
      txn.product_id,
    );
    return NextResponse.json(
      { error: "Unknown product id." },
      { status: 400 },
    );
  }

  // Activate. We don't write into stripeCustomerId / stripeSubscriptionId
  // for IAP users — those columns stay null and subscriptionSource
  // tells downstream code which payment system this user belongs to.
  // simulationsUsed reset + billingCycleStart bumped to mirror what
  // the Stripe webhook does on a fresh subscription.
  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      subscriptionStatus: "active",
      subscriptionSource: "ios",
      plan,
      simulationsLimit: PLANS[plan].simulationsLimit,
      simulationsUsed: 0,
      billingCycleStart: new Date(),
      appleOriginalTransactionId: txn.original_transaction_id,
      appleLatestReceiptData: appleResponse.latest_receipt ?? receiptData,
    },
  });

  return NextResponse.json({ success: true, plan });
}
