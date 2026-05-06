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
  Platform,
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

// Each plan card carries:
//   - simulationsLabel: prominent uppercase line under the price,
//     replacing the older "LIGHT ACCESS" / "FULL ACCESS" / etc.
//     This is the single most useful piece of information per
//     plan, so it gets its own visual slot above the bullets.
//   - features: four ✓ bullets mirroring the web paywall's
//     PaywallPlanCard. The Lite tier intentionally drops the
//     "Sports betting simulator" bullet that the web shows: the
//     iOS app hides the entire /bet tree (App Store rules for
//     individual developer accounts), and surfacing it on the
//     paywall would both confuse iOS users and re-flag the app
//     during App Review. We swap in "Streak rewards and
//     milestones" so the bullet count stays at four.
const PRODUCTS: ReadonlyArray<{
  sku: string;
  plan: DopiqPlan;
  name: string;
  simulationsLabel: string;
  features: ReadonlyArray<string>;
  highlighted: boolean;
  bg: string;
  fg: string;
}> = [
  {
    sku: "com.dopiq.app.lite_monthly",
    plan: "lite",
    name: "Dopiq Lite",
    simulationsLabel: "75 SIMULATIONS / MONTH",
    features: [
      "75 simulations per month",
      "Shop and Food simulators",
      "Daily spin wheel",
      "Streak rewards and milestones",
    ],
    highlighted: false,
    bg: PILL_PURPLE,
    fg: PILL_PURPLE_TEXT,
  },
  {
    sku: "com.dopiq.app.plus_monthly",
    plan: "plus",
    name: "Dopiq Plus",
    simulationsLabel: "600 SIMULATIONS / MONTH",
    features: [
      "600 simulations per month",
      "All Lite features",
      "Priority access to new features",
      "Flash deals and exclusive drops",
    ],
    highlighted: false,
    bg: PILL_YELLOW,
    fg: PILL_YELLOW_TEXT,
  },
  {
    sku: "com.dopiq.app.pro_monthly",
    plan: "pro",
    name: "Dopiq Pro",
    simulationsLabel: "UNLIMITED SIMULATIONS",
    features: [
      "Unlimited simulations",
      "All Plus features",
      "Never hit a limit",
      "Early access to beta features",
    ],
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

// Lightweight telemetry surfaced in the debug panel at the bottom
// of the paywall. We track every step of the IAP boot sequence so
// that when the paywall renders with em-dashes for prices we have
// concrete data to point at instead of a generic "couldn't load"
// banner. Reset on every retry.
type Diag = {
  // initConnection result. null = not attempted yet (still on the
  // network), true = succeeded, false = threw.
  initOk: boolean | null;
  initError: string | null;
  // getSubscriptions result. Count is the size of the array Apple
  // returned (note: 0 is a possible "successful" value that still
  // indicates a configuration mismatch — we treat 0 as an error
  // path so the user sees a concrete SKU list instead of empty
  // cards).
  fetchedCount: number;
  fetchError: string | null;
  fetchErrorCode: string | null;
  // The SKUs we asked Apple about. Always equal to SKUS but we copy
  // it into the debug panel so a future SKU change is impossible to
  // misread on-device.
  attemptedSkus: string[];
};

const INITIAL_DIAG: Diag = {
  initOk: null,
  initError: null,
  fetchedCount: 0,
  fetchError: null,
  fetchErrorCode: null,
  attemptedSkus: [...SKUS],
};

function describeError(err: unknown): { message: string; code: string | null } {
  if (err && typeof err === "object") {
    const e = err as { message?: unknown; code?: unknown };
    const message =
      typeof e.message === "string" ? e.message : String(err);
    const code = typeof e.code === "string" ? e.code : null;
    return { message, code };
  }
  return { message: String(err), code: null };
}

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
  const [diag, setDiag] = useState<Diag>(INITIAL_DIAG);

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
      // initConnection is the first failure surface. Track its
      // outcome separately so the debug panel can tell a "Apple
      // refused to start a session" failure from a "session OK
      // but no products returned" failure.
      try {
        await initConnection();
        if (!mounted) return;
        setDiag((d) => ({ ...d, initOk: true, initError: null }));
      } catch (err) {
        if (!mounted) return;
        const { message, code } = describeError(err);
        console.error("[NativePaywall] initConnection failed:", err);
        setDiag((d) => ({
          ...d,
          initOk: false,
          initError: code ? `${message} (${code})` : message,
        }));
        setFetchState({
          kind: "error",
          message:
            "Couldn't connect to the App Store. Check your connection and try again.",
        });
        return;
      }

      purchaseSub = purchaseUpdatedListener(handlePurchaseEvent);
      errorSub = purchaseErrorListener(handlePurchaseError);

      // getSubscriptions is the second surface. Two failure modes
      // we care about:
      //   1. It throws — usually a config issue (paid agreement
      //      not signed, products not yet in App Store Connect).
      //   2. It resolves with [] — usually a SKU mismatch between
      //      the iOS bundle id and the products configured in App
      //      Store Connect, or the products are still in
      //      "Waiting for Review".
      // Both end up in the debug panel below.
      let subs: Subscription[] = [];
      try {
        subs = await getSubscriptions({ skus: SKUS });
      } catch (err) {
        if (!mounted) return;
        const { message, code } = describeError(err);
        console.error("[NativePaywall] getSubscriptions failed:", err);
        setDiag((d) => ({
          ...d,
          fetchError: message,
          fetchErrorCode: code,
          fetchedCount: 0,
        }));
        setFetchState({
          kind: "error",
          message: "Couldn't load subscription options from Apple.",
        });
        return;
      }

      if (!mounted) return;
      setDiag((d) => ({
        ...d,
        fetchedCount: subs.length,
        fetchError: null,
        fetchErrorCode: null,
      }));

      if (subs.length === 0) {
        // No throw, no products. Treat as an error state so the
        // debug panel surfaces the SKU list and the user / tester
        // doesn't sit on em-dashes forever waiting for a load that
        // already returned.
        console.warn(
          "[NativePaywall] getSubscriptions returned 0 products for SKUs:",
          SKUS,
        );
        setFetchState({
          kind: "error",
          message:
            "No products returned by Apple. The SKUs may not match App Store Connect or the agreement isn't active yet.",
        });
        return;
      }

      setFetchState({ kind: "ready", subs });
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
    // Reset diagnostics so the debug panel reflects this retry
    // attempt, not the previous one. Keep initOk because we don't
    // re-call initConnection here.
    setDiag((d) => ({
      ...d,
      fetchedCount: 0,
      fetchError: null,
      fetchErrorCode: null,
    }));
    (async () => {
      let subs: Subscription[] = [];
      try {
        subs = await getSubscriptions({ skus: SKUS });
      } catch (err) {
        const { message, code } = describeError(err);
        console.error("[NativePaywall] retry getSubscriptions failed:", err);
        setDiag((d) => ({
          ...d,
          fetchError: message,
          fetchErrorCode: code,
          fetchedCount: 0,
        }));
        setFetchState({
          kind: "error",
          message:
            "Still couldn't reach the App Store. Try again in a moment.",
        });
        return;
      }
      setDiag((d) => ({
        ...d,
        fetchedCount: subs.length,
        fetchError: null,
        fetchErrorCode: null,
      }));
      if (subs.length === 0) {
        setFetchState({
          kind: "error",
          message:
            "No products returned by Apple. The SKUs may not match App Store Connect or the agreement isn't active yet.",
        });
        return;
      }
      setFetchState({ kind: "ready", subs });
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
                    simulationsLabel={p.simulationsLabel}
                    features={p.features}
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

            <DebugPanel diag={diag} fetchState={fetchState} />

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
  simulationsLabel,
  features,
  bg,
  fg,
  highlighted,
  price,
  busy,
  disabled,
  onSubscribe,
}: {
  name: string;
  simulationsLabel: string;
  features: ReadonlyArray<string>;
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
      <Text style={[styles.cardSimulations, { color: fg }]}>
        {simulationsLabel}
      </Text>

      <View style={styles.featureList}>
        {features.map((feature) => (
          <View key={feature} style={styles.featureRow}>
            <Text style={styles.featureCheck}>✓</Text>
            <Text style={[styles.featureText, { color: fg }]}>{feature}</Text>
          </View>
        ))}
      </View>

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

      <Text style={[styles.trialCaption, { color: fg }]}>
        7-day free trial — cancel anytime
      </Text>
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

// Debug panel for diagnosing "products won't load" failures on a
// real device. Visibility rules:
//   - __DEV__ (Expo Go / dev client) → always visible.
//   - production / TestFlight + 0 products fetched → visible.
//   - production / TestFlight + ≥1 product fetched → hidden.
// The panel is intentionally ugly — small monospace text on a
// soft yellow card — so a tester reads it as "this is data, not
// the real UI". When products eventually load correctly the panel
// disappears and the paywall is back to its production look.
function DebugPanel({
  diag,
  fetchState,
}: {
  diag: Diag;
  fetchState: FetchState;
}) {
  const productsEmpty =
    fetchState.kind !== "ready" || fetchState.subs.length === 0;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const isDev = typeof __DEV__ !== "undefined" ? (__DEV__ as boolean) : false;
  if (!isDev && !productsEmpty) return null;

  const initLabel =
    diag.initOk === null
      ? "pending"
      : diag.initOk
        ? "ok"
        : `failed: ${diag.initError ?? "unknown"}`;

  const fetchLabel = diag.fetchError
    ? `failed: ${diag.fetchError}${diag.fetchErrorCode ? ` (${diag.fetchErrorCode})` : ""}`
    : `${diag.fetchedCount} product(s)`;

  return (
    <View style={styles.debugPanel}>
      <Text style={styles.debugTitle}>IAP debug</Text>
      <Text style={styles.debugLine}>init: {initLabel}</Text>
      <Text style={styles.debugLine}>getSubscriptions: {fetchLabel}</Text>
      <Text style={styles.debugLine}>SKUs requested:</Text>
      {diag.attemptedSkus.map((sku) => (
        <Text key={sku} style={styles.debugLine}>
          • {sku}
        </Text>
      ))}
      {fetchState.kind === "error" && (
        <Text style={styles.debugLine}>banner: {fetchState.message}</Text>
      )}
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
  cardSimulations: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    opacity: 0.75,
  },
  featureList: {
    marginTop: 14,
    gap: 8,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  featureCheck: {
    color: BRAND_GREEN,
    fontSize: 15,
    fontWeight: "800",
    lineHeight: 20,
    width: 16,
    textAlign: "center",
  },
  featureText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
    opacity: 0.95,
  },
  trialCaption: {
    marginTop: 8,
    fontSize: 11,
    textAlign: "center",
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
  debugPanel: {
    marginTop: 20,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#FFF9E6",
    borderWidth: 1,
    borderColor: "#F2E4B7",
  },
  debugTitle: {
    fontFamily: Platform.select({ ios: "Menlo", default: "monospace" }),
    fontSize: 11,
    fontWeight: "700",
    color: "#5D4037",
    marginBottom: 4,
  },
  debugLine: {
    fontFamily: Platform.select({ ios: "Menlo", default: "monospace" }),
    fontSize: 11,
    lineHeight: 16,
    color: "#5D4037",
  },
});
