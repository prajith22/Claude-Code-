import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#0a0a0f' } }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="onboarding" />
          <Stack.Screen name="paywall" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="shop/[id]" options={{ presentation: 'card' }} />
          <Stack.Screen name="shop/cart" options={{ presentation: 'card' }} />
          <Stack.Screen name="shop/checkout" options={{ presentation: 'card' }} />
          <Stack.Screen name="shop/confirmed" options={{ presentation: 'modal' }} />
          <Stack.Screen name="food/[id]" options={{ presentation: 'card' }} />
          <Stack.Screen name="food/cart" options={{ presentation: 'card' }} />
          <Stack.Screen name="food/checkout" options={{ presentation: 'card' }} />
          <Stack.Screen name="food/tracker-delivery" options={{ presentation: 'modal' }} />
          <Stack.Screen name="bet/[id]" options={{ presentation: 'card' }} />
          <Stack.Screen name="bet/place" options={{ presentation: 'modal' }} />
          <Stack.Screen name="bet/confirmed" options={{ presentation: 'modal' }} />
          <Stack.Screen name="bet/history" options={{ presentation: 'card' }} />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
