import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  AppState,
  type AppStateStatus,
  BackHandler,
  Platform,
  SafeAreaView,
  StyleSheet,
  View,
} from "react-native";
import * as Linking from "expo-linking";
import { StatusBar } from "expo-status-bar";
import {
  WebView,
  type WebViewNavigation,
  type ShouldStartLoadRequest,
} from "react-native-webview";

const TARGET_URL = "https://dopiqapp.com";
const BRAND_GREEN = "#00C853";
const BRAND_BG = "#FAFAF8";

// Hosts that must open in native Safari rather than the in-app
// WebView. Google's OAuth flow returns `disallowed_useragent` when
// it sees a WebView UA, so we punt accounts.google.com out to the
// system browser. The post-auth redirect back to dopiqapp.com is
// caught by the universal-link / AppState handlers below.
const EXTERNAL_HOST_PATTERNS = [/accounts\.google\.com/i];

function shouldOpenExternally(url: string): boolean {
  return EXTERNAL_HOST_PATTERNS.some((rx) => rx.test(url));
}

export default function App() {
  const webRef = useRef<WebView>(null);
  const [canGoBack, setCanGoBack] = useState(false);
  // Tracks whether we've punted the user out to Safari for OAuth.
  // When the app returns to foreground after that, we refresh the
  // WebView so the post-OAuth redirect to dopiqapp.com renders
  // inside the native shell with a fresh page load.
  const externalAuthInFlightRef = useRef(false);

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
    // Also pick up the URL the app was *launched* with (cold start
    // from a universal link).
    Linking.getInitialURL().then((url) => {
      if (url) handle({ url });
    });
    return () => sub.remove();
  }, []);

  // Foreground recovery: if the user manually returns to the app
  // after completing OAuth in Safari (no universal link configured
  // yet, or they swiped back), reload the WebView so the new
  // session cookie set on dopiqapp.com is picked up.
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

  function onShouldStartLoadWithRequest(req: ShouldStartLoadRequest): boolean {
    if (shouldOpenExternally(req.url)) {
      externalAuthInFlightRef.current = true;
      Linking.openURL(req.url).catch(() => {
        // openURL only rejects if the URL is malformed or no app can
        // handle it. Either way we fall through silently — the user
        // will see Google's blocked-useragent screen if we let the
        // WebView handle it, which is worse than nothing.
      });
      return false;
    }
    return true;
  }

  function onNavigationStateChange(navState: WebViewNavigation) {
    setCanGoBack(navState.canGoBack);
  }

  return (
    <View style={styles.root}>
      {/* Light status bar over a tan background so the iOS clock /
          battery icons stay legible against the Dopiq palette. */}
      <StatusBar style="dark" backgroundColor={BRAND_BG} />

      {/* SafeAreaView keeps the WebView edge-to-edge but clipped under
          the top notch / status bar inset on iPhone. */}
      <SafeAreaView style={styles.safeArea}>
        <WebView
          ref={webRef}
          source={{ uri: TARGET_URL }}
          style={styles.webview}
          javaScriptEnabled
          domStorageEnabled
          startInLoadingState
          allowsBackForwardNavigationGestures
          sharedCookiesEnabled
          onShouldStartLoadWithRequest={onShouldStartLoadWithRequest}
          onNavigationStateChange={onNavigationStateChange}
          renderLoading={() => (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={BRAND_GREEN} />
            </View>
          )}
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BRAND_BG,
  },
  safeArea: {
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
    backgroundColor: BRAND_BG,
  },
});
