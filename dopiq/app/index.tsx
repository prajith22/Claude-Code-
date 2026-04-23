import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useOnboarding } from '@/store/useOnboarding';
import { useSubscription } from '@/store/useSubscription';
import { Colors } from '@/constants/theme';

export default function Entry() {
  const { onboarding, loading: onboardingLoading } = useOnboarding();
  const { hasAccess, startTrial } = useSubscription();

  useEffect(() => {
    if (onboardingLoading) return;

    if (!onboarding.completed) {
      router.replace('/onboarding');
      return;
    }

    // Start trial on first launch after onboarding
    startTrial();

    if (!hasAccess) {
      router.replace('/paywall');
      return;
    }

    router.replace('/(tabs)');
  }, [onboardingLoading, onboarding.completed, hasAccess]);

  return (
    <View style={styles.container}>
      <ActivityIndicator color={Colors.accent} size="large" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
