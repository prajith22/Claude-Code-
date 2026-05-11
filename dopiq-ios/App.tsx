import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  AppState,
  type AppStateStatus,
  BackHandler,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import * as Linking from "expo-linking";
import { StatusBar } from "expo-status-bar";
import {
  WebView,
  type WebViewNavigation,
  type ShouldStartLoadRequest,
  type WebViewErrorEvent,
  type WebViewHttpErrorEvent,
  type WebViewMessageEvent,
} from "react-native-webview";
import { NativePaywall, type DopiqPlan } from "./components/NativePaywall";
import { restoreLatestPurchase } from "./lib/iap";

const TARGET_URL = "https://dopiqapp.com";
const BRAND_GREEN = "#00C853";
const BRAND_BG = "#FAFAF8";

// Tag the WebView's User-Agent string so the Next.js server can
// detect requests coming from inside the iOS shell. The web app's
// /paywall route reads for this marker and renders a no-pricing
// "Finish setup on the web" screen on iOS to comply with App Store
// Review Guideline 3.1.1.
const WEBVIEW_UA_MARKER = "DopiqIOSApp";

// Reliability tuning
const LOAD_TIMEOUT_MS = 10_000;
const RETRY_DELAY_MS = 2_000;

// Hosts that must open in native Safari rather than the in-app
// WebView.
//   - accounts.google.com: Google's OAuth flow returns
//     `disallowed_useragent` when it sees a WebView UA. SFSafari
//     would also be blocked, so this is one of the few URLs we
//     route to Linking.openURL (standalone Safari).
//
// /paywall and /finish-setup are NO LONGER routed externally —
// they're caught below and replaced with the native StoreKit
// paywall (NativePaywall component) so iOS purchases happen via
// Apple IAP, never via the web Stripe flow.
const EXTERNAL_URL_PATTERNS = [/accounts\.google\.com/i];

function shouldOpenExternally(url: string): boolean {
  return EXTERNAL_URL_PATTERNS.some((rx) => rx.test(url));
}

// Any of these URL patterns trigger the native paywall and abort
// the WebView navigation. /paywall is the canonical Stripe paywall
// route on the web; /finish-setup was the old "go to web to
// subscribe" hand-off that's now obsoleted by native IAP.
const PAYWALL_URL_PATTERN =
  /^https:\/\/dopiqapp\.com\/(paywall|finish-setup)(?:[/?#]|$)/i;

function isPaywallUrl(url: string): boolean {
  return PAYWALL_URL_PATTERN.test(url);
}

export default function App() {
  const webRef = useRef<WebView>(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hadError, setHadError] = useState(false);
  // Native StoreKit paywall presentation. Triggered when the WebView
  // tries to navigate to /paywall or /finish-setup, OR when the user
  // taps "Manage subscription" / similar surfaces that resolve to
  // those URLs. Web users never see this — it's purely an iOS shell.
  const [paywallVisible, setPaywallVisible] = useState(false);
  // Captured from session-info postMessages so the paywall can show
  // "Signed in as <email>" without re-fetching from the WebView.
  const [userEmail, setUserEmail] = useState<string | null>(null);
  // Universal Link cold-start URL. iOS hands a dopiqapp.com URL to
  // the app when the user taps a verification / reset / OAuth-
  // callback link in Mail or Messages while the app is closed. We
  // resolve it before the first WebView render so the WebView's
  // initial navigation IS that URL — no flash of the home page
  // followed by a JS-driven redirect.
  const [initialUrl, setInitialUrl] = useState<string | null>(null);
  // Defends against the postMessage-driven Restore from running
  // while one is already in flight (the WebView Settings button is
  // a fire-and-forget message; it doesn't disable itself locally).
  const restoreInFlightRef = useRef(false);

  // Tracks whether we've punted the user out to Safari for OAuth.
  // When the app returns to foreground after that, we refresh the
  // WebView so the post-OAuth redirect to dopiqapp.com renders
  // inside the native shell with a fresh page load.
  const externalAuthInFlightRef = useRef(false);

  // Watchdog timers — see startWatchdog / scheduleRetry below.
  const watchdogRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function clearWatchdog() {
    if (watchdogRef.current) {
      clearTimeout(watchdogRef.current);
      watchdogRef.current = null;
    }
  }
  function clearRetry() {
    if (retryRef.current) {
      clearTimeout(retryRef.current);
      retryRef.current = null;
    }
  }

  // 10-second watchdog. If the WebView hasn't fired onLoad in time
  // we assume it's hung on a white screen and force a reload. Restarted
  // automatically every onLoadStart, cleared on onLoad/onError.
  function startWatchdog() {
    clearWatchdog();
    watchdogRef.current = setTimeout(() => {
      webRef.current?.reload();
    }, LOAD_TIMEOUT_MS);
  }

  // Schedule a one-shot reload after a transient failure.
  function scheduleRetry() {
    clearRetry();
    retryRef.current = setTimeout(() => {
      webRef.current?.reload();
    }, RETRY_DELAY_MS);
  }

  // Wire the Android hardware back button to the WebView's history so
  // users navigate within the web app instead of exiting the native
  // shell. iOS doesn't have a hardware back, so this is a no-op there
  // and we rely on the in-page back affordances + edge swipe.
  useEffect(() => {
    if (Platform.OS !== "android") return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (canGoBack && webRef.current) {
        webRef.current.goBack();
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [canGoBack]);

  // Universal Link plumbing. Two paths:
  //
  //   1. Cold start — iOS launches Dopiq from a tapped link while
  //      the app wasn't running. Linking.getInitialURL() returns the
  //      URL, we stash it in initialUrl, and the WebView's source
  //      below uses it as the first navigation. No JS injection
  //      needed because the WebView hasn't rendered yet.
  //
  //   2. Warm start — link tapped while the app is already running.
  //      The addEventListener("url", …) handler fires with the new
  //      URL; we inject window.location.href so the WebView leaves
  //      whatever page it was on and loads the Universal Link's
  //      target.
  //
  // Both paths filter to URLs that start with https://dopiqapp.com
  // so unrelated `expo-linking` events (custom schemes, etc.) can't
  // hijack the WebView.
  useEffect(() => {
    Linking.getInitialURL()
      .then((url) => {
        if (!url || !url.startsWith(TARGET_URL)) return;
        setInitialUrl(url);
      })
      .catch(() => {});

    const sub = Linking.addEventListener("url", ({ url }) => {
      if (!url || !url.startsWith(TARGET_URL)) return;
      // Reset the external-auth-in-flight ref so the AppState
      // foreground listener doesn't double-reload on top of the
      // navigation we're about to do.
      externalAuthInFlightRef.current = false;
      if (webRef.current) {
        const safe = JSON.stringify(url);
        webRef.current.injectJavaScript(
          `window.location.href = ${safe}; true;`,
        );
      } else {
        // WebView ref isn't ready yet — fall back to initialUrl so
        // the first render picks it up.
        setInitialUrl(url);
      }
    });
    return () => sub.remove();
  }, []);

  // Foreground recovery: if the user returns to the app after
  // completing OAuth in Safari (no universal link configured yet,
  // or they swiped back), reload the WebView so the new session
  // cookie set on dopiqapp.com is picked up.
  useEffect(() => {
    const onChange = (state: AppStateStatus) => {
      if (state !== "active") return;
      if (!externalAuthInFlightRef.current) return;
      externalAuthInFlightRef.current = false;
      webRef.current?.reload();
    };
    const sub = AppState.addEventListener("change", onChange);
    return () => sub.remove();
  }, []);

  // Cleanup any pending timers on unmount so they don't fire after
  // the WebView is gone.
  useEffect(() => {
    return () => {
      clearWatchdog();
      clearRetry();
    };
  }, []);

  function onShouldStartLoadWithRequest(req: ShouldStartLoadRequest): boolean {
    // Intercept the paywall URL family BEFORE the WebView starts
    // loading anything, so the user never sees a flash of the web
    // paywall before the native sheet covers it. The request is
    // dropped (return false) and the React Modal is shown.
    if (isPaywallUrl(req.url)) {
      setPaywallVisible(true);
      return false;
    }
    if (shouldOpenExternally(req.url)) {
      externalAuthInFlightRef.current = true;
      Linking.openURL(req.url).catch(() => {
        // openURL only rejects if the URL is malformed or no app can
        // handle it. Either way we fall through silently.
      });
      return false;
    }
    return true;
  }

  // ---- Native paywall plumbing ------------------------------------

  const onPurchaseSuccess = useCallback((_plan: DopiqPlan) => {
    // Drop the Modal and bounce the WebView to /home. The user is
    // now an active subscriber server-side (verify-receipt updated
    // the User row), so /home will render normally.
    setPaywallVisible(false);
    webRef.current?.injectJavaScript(
      `window.location.href = ${JSON.stringify(`${TARGET_URL}/home`)}; true;`,
    );
  }, []);

  const onPaywallClose = useCallback(() => {
    // Apple HIG says no close affordance on the paywall, but expose
    // a handler so future flows (e.g., a dev override) have a way
    // out. Fall back by reloading the WebView so the underlying
    // page state is fresh.
    setPaywallVisible(false);
    webRef.current?.reload();
  }, []);

  // ---- WebView postMessage protocol -------------------------------
  //
  // Messages from the web app (sent via window.ReactNativeWebView
  // .postMessage(...)) are JSON envelopes with a `type` discriminator.
  // Currently supported types:
  //
  //   { type: "session", email: string | null }
  //     Sent on every session-aware page render so the native shell
  //     can keep `userEmail` fresh for the paywall display.
  //
  //   { type: "restore_purchases" }
  //     Sent by the iOS-only "Restore Purchases" button on the
  //     in-WebView Settings page. Triggers getAvailablePurchases +
  //     verify-receipt and surfaces the result via Alert.alert.
  //
  // Unknown types are ignored — the protocol is intentionally
  // additive so the iOS app and web app can ship at different
  // cadences.
  async function handleRestoreFromSettings() {
    if (restoreInFlightRef.current) return;
    restoreInFlightRef.current = true;
    try {
      const plan = await restoreLatestPurchase();
      Alert.alert(
        "Subscription restored",
        `You're now on the Dopiq ${plan.charAt(0).toUpperCase() + plan.slice(1)} plan.`,
        [
          {
            text: "OK",
            onPress: () => webRef.current?.reload(),
          },
        ],
      );
    } catch (err) {
      Alert.alert(
        "Restore Purchases",
        err instanceof Error
          ? err.message
          : "Couldn't restore purchases. Please try again.",
      );
    } finally {
      restoreInFlightRef.current = false;
    }
  }

  function onWebViewMessage(event: WebViewMessageEvent) {
    let parsed: { type?: string; email?: string | null } | null = null;
    try {
      parsed = JSON.parse(event.nativeEvent.data) as typeof parsed;
    } catch {
      return;
    }
    if (!parsed || typeof parsed.type !== "string") return;
    switch (parsed.type) {
      case "session":
        setUserEmail(parsed.email ?? null);
        return;
      case "restore_purchases":
        void handleRestoreFromSettings();
        return;
      default:
        return;
    }
  }

  // target="_blank" links inside the WebView fire this handler on
  // iOS instead of going through onShouldStartLoadWithRequest. The
  // "Continue setup on the web" link in IOSSetupScreen is one; we
  // route it (and any other _blank link) straight to Safari.
  function onOpenWindow(
    e: { nativeEvent: { targetUrl: string } } | { targetUrl: string },
  ) {
    const targetUrl =
      "nativeEvent" in e ? e.nativeEvent.targetUrl : e.targetUrl;
    if (!targetUrl) return;
    externalAuthInFlightRef.current = true;
    Linking.openURL(targetUrl).catch(() => {});
  }

  function onNavigationStateChange(navState: WebViewNavigation) {
    setCanGoBack(navState.canGoBack);
    // Belt-and-suspenders for the paywall intercept. Some iOS WKWebView
    // paths reach a /paywall or /finish-setup URL WITHOUT firing
    // onShouldStartLoadWithRequest first — most commonly a Next.js
    // server redirect (302/307) chained from /onboarding/complete or
    // a JS router.push() invoked by an in-page interaction. Without
    // this fallback the WebView would land on the web Stripe paywall
    // and the user could initiate a Stripe checkout, which Apple
    // rejects under 3.1.1. The shared isPaywallUrl helper keeps the
    // pattern in one place so this and onShouldStartLoadWithRequest
    // can never disagree.
    if (isPaywallUrl(navState.url) && !paywallVisible) {
      setPaywallVisible(true);
    }
  }

  function onLoadStart() {
    setIsLoading(true);
    startWatchdog();
  }

  function onLoad() {
    setIsLoading(false);
    setHadError(false);
    clearWatchdog();
    clearRetry();
  }

  function onError(_e: WebViewErrorEvent) {
    setIsLoading(false);
    setHadError(true);
    clearWatchdog();
    scheduleRetry();
  }

  function onHttpError(e: WebViewHttpErrorEvent) {
    // Only retry on 4xx/5xx for the main document load. Subresource
    // 4xx (e.g., a missing image) shouldn't blank the app.
    const status = e.nativeEvent.statusCode;
    if (status < 400) return;
    if (e.nativeEvent.url !== TARGET_URL) return;
    setIsLoading(false);
    setHadError(true);
    clearWatchdog();
    scheduleRetry();
  }

  function manualReload() {
    setHadError(false);
    setIsLoading(true);
    clearRetry();
    webRef.current?.reload();
  }

  return (
    // Edge-to-edge: a plain View instead of SafeAreaView, so the
    // WebView fills the whole screen including under the iOS notch
    // and home indicator.
    <View style={styles.root}>
      <StatusBar style="dark" translucent backgroundColor="transparent" />

      <WebView
        ref={webRef}
        source={{ uri: initialUrl ?? TARGET_URL }}
        style={styles.webview}
        contentInsetAdjustmentBehavior="never"
        automaticallyAdjustContentInsets={false}
        javaScriptEnabled
        domStorageEnabled
        startInLoadingState
        allowsBackForwardNavigationGestures
        sharedCookiesEnabled
        // Append a stable marker to the WebView's User-Agent. The
        // Next.js /paywall route reads this to decide whether to
        // render the App Store-compliant no-pricing setup screen.
        applicationNameForUserAgent={WEBVIEW_UA_MARKER}
        // Cache the page so cold starts paint the last known UI
        // instantly while a fresh fetch happens in the background.
        // cacheMode is Android-only in RNWebView; harmless on iOS.
        cacheEnabled
        cacheMode="LOAD_CACHE_ELSE_NETWORK"
        // target="_blank" handling — Android: setSupportMultipleWindows
        // false routes the click through onShouldStartLoadWithRequest.
        // iOS: WKWebView fires onOpenWindow for _blank links instead,
        // so we handle both. Either path ends in Linking.openURL.
        setSupportMultipleWindows={false}
        onOpenWindow={onOpenWindow}
        onShouldStartLoadWithRequest={onShouldStartLoadWithRequest}
        onNavigationStateChange={onNavigationStateChange}
        onMessage={onWebViewMessage}
        onLoadStart={onLoadStart}
        onLoad={onLoad}
        onError={onError}
        onHttpError={onHttpError}
      />

      {/* Native StoreKit paywall — rendered on top of the WebView
          when the WebView would otherwise navigate to /paywall or
          /finish-setup. Apple IAP only; no Stripe surface visible
          inside the iOS app. */}
      <NativePaywall
        isVisible={paywallVisible}
        userEmail={userEmail}
        onPurchaseSuccess={onPurchaseSuccess}
        onClose={onPaywallClose}
      />

      {/* Branded loading veneer — hides the WebView's white "no
          paint yet" first frame behind the Dopiq green so the
          launch reads as intentional. Stacked on top of the
          WebView and removed once onLoad fires. */}
      {isLoading && (
        <View style={styles.loadingOverlay} pointerEvents="none">
          <ActivityIndicator size="large" color="#FFFFFF" />
        </View>
      )}

      {/* Manual reload escape hatch — only visible after we've
          surfaced an error, so the user has a way out without
          force-quitting the app. The auto-retry already runs at
          2s; this button covers the case where retries keep
          failing (e.g., long offline window). */}
      {hadError && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Reload"
          onPress={manualReload}
          style={styles.reloadButton}
        >
          <Text style={styles.reloadGlyph}>↻</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BRAND_BG,
  },
  webview: {
    flex: 1,
    backgroundColor: BRAND_BG,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: BRAND_GREEN,
  },
  reloadButton: {
    position: "absolute",
    top: 56,
    right: 16,
    height: 40,
    width: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  reloadGlyph: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "700",
    lineHeight: 24,
  },
});
