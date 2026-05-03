import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
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
} from "react-native-webview";

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

// Hosts and paths that must open in native Safari rather than the
// in-app WebView.
//   - accounts.google.com: Google's OAuth flow returns
//     `disallowed_useragent` when it sees a WebView UA.
//   - dopiqapp.com/finish-setup: the web-side Stripe paywall lives
//     here. Apple disallows showing prices / "Subscribe" CTAs
//     inside iOS apps for digital goods, so we punt to Safari for
//     the actual checkout. Universal links + AppState reload pull
//     the user back into the WebView once they're done.
const EXTERNAL_URL_PATTERNS = [
  /accounts\.google\.com/i,
  /^https:\/\/dopiqapp\.com\/finish-setup(?:[/?#]|$)/i,
];

function shouldOpenExternally(url: string): boolean {
  return EXTERNAL_URL_PATTERNS.some((rx) => rx.test(url));
}

export default function App() {
  const webRef = useRef<WebView>(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hadError, setHadError] = useState(false);

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

  // Universal-link return path: iOS hands off the post-OAuth
  // dopiqapp.com URL to the app via Linking when associatedDomains
  // is set up. We forward the URL straight into the WebView so the
  // session callback fires inside the native shell.
  useEffect(() => {
    const handle = ({ url }: { url: string }) => {
      if (!url || !webRef.current) return;
      if (!url.startsWith(TARGET_URL)) return;
      externalAuthInFlightRef.current = false;
      const safe = JSON.stringify(url);
      webRef.current.injectJavaScript(`window.location.href = ${safe}; true;`);
    };
    const sub = Linking.addEventListener("url", handle);
    Linking.getInitialURL().then((url) => {
      if (url) handle({ url });
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
        source={{ uri: TARGET_URL }}
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
        onLoadStart={onLoadStart}
        onLoad={onLoad}
        onError={onError}
        onHttpError={onHttpError}
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
