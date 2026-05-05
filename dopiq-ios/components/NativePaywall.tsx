// dopiq-ios/components/NativePaywall.tsx
//
// Native StoreKit-backed paywall replacing the web /paywall URL when
// the WebView would otherwise navigate to it. Ships the three Dopiq
// subscription products (Lite / Plus / Pro), drives Apple's purchase
// flow, posts the resulting receipt to /api/iap/verify-receipt for
// server-side validation, and dismisses with a green "Welcome to
// Dopiq" celebration on success.
//
// Cookie / auth note:
// react-native-webview is configured with `sharedCookiesEnabled: true`
// in App.tsx, which writes WebKit's cookie jar into iOS's
// HTTPCookieStorage.shared. React Native's fetch (via NSURLSession)
// reads from the same store, so a POST to dopiqapp.com from this
// component automatically carries the user's NextAuth session
// cookie. We pass `credentials: "include"` for symmetry, but the
// real plumbing is the shared HTTPCookieStorage.
//
// Sandbox-tester setup (for QA):
//   1. App Store Connect → Users and Access → Sandbox Testers →
//      create a tester (a fake email is fine; doesn't need to receive
//      real mail).
//   2. On the test iPhone: Settings → App Store → Sandbox Account →
//      sign out of any real Apple ID, sign in with the tester.
//   3. Launch the app — every IAP transaction now hits Apple's
//      sandbox environment instead of charging real money.
//   4. Sandbox subscriptions renew on a compressed clock (1 month →
//      5 minutes, 1 year → 1 hour) so renewal flows are testable.
//   5. The /api/verify-receipt route auto-falls-back to the sandbox
//      verifyReceipt endpoint when Apple returns status 21007, so no
//      backend toggle is required for sandbox-vs-prod.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  endConnection,
  finishTransaction,
  getSubscriptions,
  initConnection,
  purchaseErrorListener,
  purchaseUpdatedListener,
  requestSubscription,
  type Purchase,
  type PurchaseError,
  type Subscription,
  type SubscriptionIOS,
} from "react-native-iap";
import {
  restoreLatestPurchase,
  verifyReceiptOnBackend,
  type DopiqPlan,
} from "../lib/iap";

export type { DopiqPlan };

const BRAND_GREEN = "#00C853";
const BRAND_BG = "#FAFAF8";
const TEXT_INK = "#0A0F1E";
const TEXT_MUTED = "#6B7280";
const TEXT_FAINT = "#9CA3AF";
const PILL_PURPLE = "#F3E8FF";
const PILL_PURPLE_TEXT = "#4A148C";
const PILL_YELLOW = "#FFF9E6";
const PILL_YELLOW_TEXT = "#5D4037";
const PILL_BLUE = "#E8F0FF";
const PILL_BLUE_TEXT = "#1A237E";

const PRODUCTS: ReadonlyArray<{
  sku: string;
  plan: DopiqPlan;
  name: string;
  description: string;
  highlighted: boolean;
  bg: string;
  fg: string;
}> = [
  {
    sku: "com.dopiq.app.lite_monthly",
    plan: "lite",
    name: "Dopiq Lite",
    description: "Light access",
    highlighted: false,
    bg: PILL_PURPLE,
    fg: PILL_PURPLE_TEXT,
  },
  {
    sku: "com.dopiq.app.plus_monthly",
    plan: "plus",
    name: "Dopiq Plus",
    description: "Full access",
    highlighted: false,
    bg: PILL_YELLOW,
    fg: PILL_YELLOW_TEXT,
  },
  {
    sku: "com.dopiq.app.pro_monthly",
    plan: "pro",
    name: "Dopiq Pro",
    description: "Unlimited everything",
    highlighted: true,
    bg: PILL_BLUE,
    fg: PILL_BLUE_TEXT,
  },
];

const SKUS = PRODUCTS.map((p) => p.sku);

type Props = {
  isVisible: boolean;
  userEmail: string | null;
  onPurchaseSuccess: (plan: DopiqPlan) => void;
  onClose: () => void;
};

type FetchState =
  | { kind: "loading" }
  | { kind: "ready"; subs: Subscription[] }
  | { kind: "error"; message: string };

type PurchaseUIState =
  | { kind: "idle" }
  | { kind: "buying"; sku: string }
  | { kind: "verifying" }
  | { kind: "restoring" }
  | { kind: "success"; plan: DopiqPlan }
  | { kind: "error"; message: string };

function localizedPriceFor(
  subs: Subscription[],
  sku: string,
): string | null {
  const sub = subs.find((s) => s.productId === sku) as
    | SubscriptionIOS
    | undefined;
  return sub?.localizedPrice ?? null;
}

function receiptFromPurchase(p: Purchase): string | null {
  // RNIAP exposes `transactionReceipt` on Purchase across iOS versions.
  // We use the unified receipt instead of per-transaction StoreKit2
  // JWS payloads because the backend posts to verifyReceipt, which
  // expects the legacy base64 receipt.
  return p.transactionReceipt ?? null;
}

export function NativePaywall({
  isVisible,
  userEmail,
  onPurchaseSuccess,
  onClose,
}: Props) {
  const [fetchState, setFetchState] = useState<FetchState>({ kind: "loading" });
  const [uiState, setUIState] = useState<PurchaseUIState>({ kind: "idle" });

  // Track the current "we initiated this purchase from inside the
  // paywall" sku so the global purchaseUpdatedListener can drive the
  // right loading indicator. RNIAP fires the listener for Apple-
  // initiated retries too (e.g., interrupted purchases on relaunch),
  // and we still want to handle those — just without lying about a
  // button being pressed.
  const inFlightSkuRef = useRef<string | null>(null);

  // Successful onPurchaseSuccess fires after a 2s success-screen hold
  // — keep the timer in a ref so unmount cancels it cleanly.
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ---- Connection lifecycle ----------------------------------------
  useEffect(() => {
    let mounted = true;
    let purchaseSub: { remove(): void } | null = null;
    let errorSub: { remove(): void } | null = null;

    (async () => {
      try {
        await initConnection();
        if (!mounted) return;

        purchaseSub = purchaseUpdatedListener(handlePurchaseEvent);
        errorSub = purchaseErrorListener(handlePurchaseError);

        const subs = await getSubscriptions({ skus: SKUS });
        if (!mounted) return;
        setFetchState({ kind: "ready", subs });
      } catch (err) {
        if (!mounted) return;
        console.error("[NativePaywall] init failed:", err);
        setFetchState({
          kind: "error",
          message:
            "Couldn't load subscription options. Check your connection and try again.",
        });
      }
    })();

    return () => {
      mounted = false;
      if (successTimerRef.current) clearTimeout(successTimerRef.current);
      purchaseSub?.remove();
      errorSub?.remove();
      // endConnection is global per process; only call on unmount of
      // the outermost paywall. The paywall is the only consumer in
      // this app today, so safe to clean up here.
      endConnection().catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- Purchase + verification flow --------------------------------

  const handlePurchaseEvent = useCallback(async (purchase: Purchase) => {
    const receipt = receiptFromPurchase(purchase);
    if (!receipt) {
      console.warn("[NativePaywall] purchase has no receipt");
      return;
    }
    setUIState({ kind: "verifying" });
    try {
      const plan = await verifyReceiptOnBackend(receipt);
      // Tell Apple we successfully delivered the entitlement.
      // isConsumable=false because subscriptions are not consumables.
      // Skipping this step would have Apple replay the purchase on
      // next app launch — exactly the safety net we want until
      // verification succeeds, but we want to clear it once it does.
      await finishTransaction({ purchase, isConsumable: false });
      inFlightSkuRef.current = null;

      // Show the success celebration for ~2s, then dismiss.
      setUIState({ kind: "success", plan });
      successTimerRef.current = setTimeout(() => {
        onPurchaseSuccess(plan);
      }, 2000);
    } catch (err) {
      console.error("[NativePaywall] verify failed:", err);
      inFlightSkuRef.current = null;
      // DO NOT call finishTransaction here — leaving the transaction
      // open means Apple replays it on next launch / next paywall
      // open, giving us another chance to verify.
      setUIState({
        kind: "error",
        message:
          err instanceof Error
            ? err.message
            : "Subscription verification failed. Please contact support.",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handlePurchaseError(error: PurchaseError) {
    inFlightSkuRef.current = null;
    // E_USER_CANCELLED is the standard "user backed out of the Apple
    // sheet" code — silent reset is the right response.
    if (error.code === "E_USER_CANCELLED") {
      setUIState({ kind: "idle" });
      return;
    }
    console.warn("[NativePaywall] purchase error:", error);
    setUIState({
      kind: "error",
      message: error.message ?? "Purchase failed. Please try again.",
    });
  }

  async function onSubscribe(sku: string) {
    if (uiState.kind !== "idle") return;
    inFlightSkuRef.current = sku;
    setUIState({ kind: "buying", sku });
    try {
      await requestSubscription({
        sku,
        andDangerouslyFinishTransactionAutomaticallyIOS: false,
      });
      // The actual receipt arrives via purchaseUpdatedListener.
    } catch (err) {
      // requestSubscription rejecting is rare — usually the listener
      // path fires with a PurchaseError instead. Be defensive anyway.
      inFlightSkuRef.current = null;
      console.error("[NativePaywall] requestSubscription threw:", err);
      setUIState({
        kind: "error",
        message:
          err instanceof Error
            ? err.message
            : "Couldn't start the purchase. Please try again.",
      });
    }
  }

  async function onRestore() {
    if (uiState.kind !== "idle") return;
    setUIState({ kind: "restoring" });
    try {
      const plan = await restoreLatestPurchase();
      setUIState({ kind: "success", plan });
      successTimerRef.current = setTimeout(() => {
        onPurchaseSuccess(plan);
      }, 2000);
    } catch (err) {
      console.error("[NativePaywall] restore failed:", err);
      setUIState({
        kind: "error",
        message:
          err instanceof Error
            ? err.message
            : "Couldn't restore purchases. Please try again.",
      });
    }
  }

  function onRetryFetch() {
    setFetchState({ kind: "loading" });
    (async () => {
      try {
        const subs = await getSubscriptions({ skus: SKUS });
        setFetchState({ kind: "ready", subs });
      } catch (err) {
        console.error("[NativePaywall] retry getSubscriptions failed:", err);
        setFetchState({
          kind: "error",
          message:
            "Still couldn't reach the App Store. Try again in a moment.",
        });
      }
    })();
  }

  // ---- Render ------------------------------------------------------

  const showSuccess = uiState.kind === "success";
  const subsArray = useMemo(
    () => (fetchState.kind === "ready" ? fetchState.subs : []),
    [fetchState],
  );

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      // No close button per Apple HIG, but keep onRequestClose so the
      // hardware back button on Android (if we ever ship there) can
      // route to onClose if the parent decides to allow it.
      onRequestClose={onClose}
      presentationStyle="fullScreen"
      transparent={false}
    >
      <View style={styles.container}>
        {showSuccess ? (
          <SuccessCelebration />
        ) : (
          <ScrollView
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.wordmark}>dopiq</Text>

            <Text style={styles.headline}>Choose your plan</Text>
            <Text style={styles.subhead}>
              Try free for 7 days. Cancel anytime.
            </Text>

            {fetchState.kind === "loading" && (
              <View style={styles.fetchState}>
                <ActivityIndicator size="large" color={BRAND_GREEN} />
                <Text style={styles.muted}>Loading plans…</Text>
              </View>
            )}

            {fetchState.kind === "error" && (
              <View style={styles.fetchState}>
                <Text style={styles.errorText}>{fetchState.message}</Text>
                <Pressable
                  style={[styles.primaryButton, styles.primaryButtonInline]}
                  onPress={onRetryFetch}
                >
                  <Text style={styles.primaryButtonText}>Retry</Text>
                </Pressable>
              </View>
            )}

            {fetchState.kind === "ready" && (
              <View style={styles.cards}>
                {PRODUCTS.map((p) => (
                  <PlanCard
                    key={p.sku}
                    name={p.name}
                    description={p.description}
                    bg={p.bg}
                    fg={p.fg}
                    highlighted={p.highlighted}
                    price={localizedPriceFor(subsArray, p.sku)}
                    onSubscribe={() => onSubscribe(p.sku)}
                    busy={
                      uiState.kind === "buying" && uiState.sku === p.sku
                    }
                    disabled={
                      uiState.kind !== "idle" &&
                      !(uiState.kind === "buying" && uiState.sku === p.sku)
                    }
                  />
                ))}
              </View>
            )}

            {uiState.kind === "verifying" && (
              <View style={styles.statusBanner}>
                <ActivityIndicator color={BRAND_GREEN} />
                <Text style={styles.muted}>Verifying with Apple…</Text>
              </View>
            )}

            {uiState.kind === "error" && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{uiState.message}</Text>
                <Pressable
                  onPress={() => setUIState({ kind: "idle" })}
                  style={styles.secondaryLink}
                >
                  <Text style={styles.secondaryLinkText}>Dismiss</Text>
                </Pressable>
              </View>
            )}

            <Text style={styles.fineprint}>
              Subscriptions auto-renew unless cancelled at least 24 hours
              before the period ends. Manage in iOS Settings → Apple ID →
              Subscriptions.
            </Text>

            <Pressable
              onPress={onRestore}
              disabled={uiState.kind !== "idle"}
              style={styles.restoreLink}
            >
              <Text style={styles.restoreLinkText}>
                {uiState.kind === "restoring"
                  ? "Restoring…"
                  : "Restore Purchases"}
              </Text>
            </Pressable>

            {userEmail ? (
              <Text style={styles.signedInAs}>Signed in as {userEmail}</Text>
            ) : null}
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}

function PlanCard({
  name,
  description,
  bg,
  fg,
  highlighted,
  price,
  busy,
  disabled,
  onSubscribe,
}: {
  name: string;
  description: string;
  bg: string;
  fg: string;
  highlighted: boolean;
  price: string | null;
  busy: boolean;
  disabled: boolean;
  onSubscribe: () => void;
}) {
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: bg },
        highlighted && styles.cardHighlighted,
      ]}
    >
      {highlighted && (
        <View style={styles.popularBadge}>
          <Text style={styles.popularBadgeText}>MOST POPULAR</Text>
        </View>
      )}
      <Text style={[styles.cardName, { color: fg }]}>{name}</Text>
      <View style={styles.priceRow}>
        <Text style={[styles.price, { color: fg }]}>{price ?? "—"}</Text>
        <Text style={[styles.priceSuffix, { color: fg }]}>/month</Text>
      </View>
      <Text style={[styles.cardDescription, { color: fg }]}>
        {description}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Subscribe to ${name}`}
        onPress={onSubscribe}
        disabled={disabled || busy || price === null}
        style={({ pressed }) => [
          styles.primaryButton,
          (disabled || price === null) && styles.primaryButtonDisabled,
          pressed && styles.primaryButtonPressed,
        ]}
      >
        {busy ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.primaryButtonText}>Subscribe</Text>
        )}
      </Pressable>
    </View>
  );
}

function SuccessCelebration() {
  return (
    <View style={styles.successContainer}>
      <View style={styles.successCircle}>
        <Text style={styles.successCheck}>✓</Text>
      </View>
      <Text style={styles.successHeadline}>Welcome to Dopiq</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BRAND_BG,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 64,
    paddingBottom: 48,
    alignItems: "stretch",
  },
  wordmark: {
    alignSelf: "center",
    fontSize: 28,
    fontWeight: "800",
    color: BRAND_GREEN,
    letterSpacing: -0.5,
    marginBottom: 24,
  },
  headline: {
    fontSize: 28,
    fontWeight: "700",
    color: TEXT_INK,
    textAlign: "center",
  },
  subhead: {
    marginTop: 8,
    fontSize: 15,
    color: TEXT_MUTED,
    textAlign: "center",
  },
  fetchState: {
    marginTop: 32,
    alignItems: "center",
    gap: 12,
  },
  cards: {
    marginTop: 28,
    gap: 12,
  },
  card: {
    borderRadius: 20,
    padding: 20,
    position: "relative",
  },
  cardHighlighted: {
    borderWidth: 2,
    borderColor: BRAND_GREEN,
  },
  popularBadge: {
    position: "absolute",
    top: -10,
    alignSelf: "center",
    backgroundColor: BRAND_GREEN,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  popularBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
  },
  cardName: {
    fontSize: 18,
    fontWeight: "700",
  },
  priceRow: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
  },
  price: {
    fontSize: 32,
    fontWeight: "800",
  },
  priceSuffix: {
    fontSize: 14,
    fontWeight: "500",
    opacity: 0.7,
  },
  cardDescription: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
    opacity: 0.7,
  },
  primaryButton: {
    marginTop: 16,
    height: 48,
    borderRadius: 999,
    backgroundColor: BRAND_GREEN,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonInline: {
    marginTop: 16,
    paddingHorizontal: 24,
    alignSelf: "center",
  },
  primaryButtonPressed: {
    opacity: 0.85,
  },
  primaryButtonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  fineprint: {
    marginTop: 28,
    fontSize: 11,
    color: TEXT_FAINT,
    textAlign: "center",
    lineHeight: 16,
  },
  restoreLink: {
    marginTop: 18,
    alignSelf: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  restoreLinkText: {
    color: BRAND_GREEN,
    fontSize: 14,
    fontWeight: "700",
  },
  signedInAs: {
    marginTop: 24,
    fontSize: 12,
    color: TEXT_FAINT,
    textAlign: "center",
  },
  muted: {
    color: TEXT_MUTED,
    fontSize: 13,
  },
  statusBanner: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  errorBanner: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#FEE2E2",
    alignItems: "center",
    gap: 8,
  },
  errorText: {
    color: "#B91C1C",
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },
  secondaryLink: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  secondaryLinkText: {
    color: "#B91C1C",
    fontSize: 12,
    textDecorationLine: "underline",
  },
  successContainer: {
    flex: 1,
    backgroundColor: BRAND_GREEN,
    alignItems: "center",
    justifyContent: "center",
    gap: 24,
  },
  successCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
  },
  successCheck: {
    color: BRAND_GREEN,
    fontSize: 56,
    fontWeight: "800",
    lineHeight: 60,
  },
  successHeadline: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
});
