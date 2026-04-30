import { useRef, useState } from "react";
import {
  ActivityIndicator,
  BackHandler,
  Platform,
  SafeAreaView,
  StyleSheet,
  View,
} from "react-native";
import { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { WebView, type WebViewNavigation } from "react-native-webview";

const TARGET_URL = "https://dopiqapp.com";
const BRAND_GREEN = "#00C853";
const BRAND_BG = "#FAFAF8";

export default function App() {
  const webRef = useRef<WebView>(null);
  const [canGoBack, setCanGoBack] = useState(false);

  // Wire the Android hardware back button to the WebView's history so
  // users navigate within the web app instead of exiting the native
  // shell. iOS doesn't have a hardware back, so this is a no-op there
  // and we rely on the in-page back affordances.
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
