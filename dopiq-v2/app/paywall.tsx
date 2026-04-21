import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSubscription } from '@/store/useSubscription';
import { Colors, Spacing, Radius } from '@/constants/theme';

export default function Paywall() {
  const insets = useSafeAreaInsets();
  const { setSubscribed } = useSubscription();

  const handleSubscribe = () => {
    // In production this calls Purchases.purchasePackage() via RevenueCat
    // For now we simulate a successful purchase
    Alert.alert(
      'Subscribe to Dopiq',
      '$3.99/month after 30-day free trial.\n\nPayment will be charged to your Apple ID account.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Subscribe',
          onPress: async () => {
            await setSubscribed(true);
            router.replace('/(tabs)');
          },
        },
      ]
    );
  };

  const handleRestore = () => {
    Alert.alert('Restore Purchases', 'No previous purchases found.');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.inner}>
        {/* Icon */}
        <View style={styles.iconWrap}>
          <Text style={styles.icon}>⚡</Text>
        </View>

        <Text style={styles.title}>Your free trial has ended</Text>
        <Text style={styles.sub}>
          Subscribe to keep using all of Dopiq's simulators and spending tracker.
        </Text>

        {/* Feature list */}
        <View style={styles.features}>
          {[
            '🛍️  Shopping Simulator',
            '🍔  Food Ordering Simulator',
            '🏈  Sports Betting Simulator',
            '📊  Real Spending Tracker',
            '🔒  All future features',
          ].map((f) => (
            <View key={f} style={styles.featureRow}>
              <Text style={styles.featureText}>{f}</Text>
            </View>
          ))}
        </View>

        {/* Price card */}
        <View style={styles.priceCard}>
          <Text style={styles.priceAmount}>$3.99</Text>
          <Text style={styles.pricePer}>/month</Text>
        </View>
        <Text style={styles.trialNote}>Includes a 30-day free trial</Text>

        <TouchableOpacity style={styles.cta} onPress={handleSubscribe} activeOpacity={0.85}>
          <Text style={styles.ctaText}>Start Free Trial</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.restore} onPress={handleRestore}>
          <Text style={styles.restoreText}>Restore Purchases</Text>
        </TouchableOpacity>

        <Text style={styles.legal}>
          Cancel anytime in Settings → Apple ID → Subscriptions. Billed monthly.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  inner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: Radius.xl,
    backgroundColor: Colors.accentGlow,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  icon: { fontSize: 36 },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  sub: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },
  features: {
    width: '100%',
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  featureRow: { paddingVertical: 2 },
  featureText: { color: Colors.textPrimary, fontSize: 15, fontWeight: '500' },
  priceCard: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: Spacing.xs,
  },
  priceAmount: { fontSize: 48, fontWeight: '800', color: Colors.textPrimary, lineHeight: 52 },
  pricePer: { fontSize: 18, color: Colors.textSecondary, marginBottom: 8, marginLeft: 4 },
  trialNote: { fontSize: 13, color: Colors.accent, marginBottom: Spacing.xl },
  cta: {
    width: '100%',
    backgroundColor: Colors.accent,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md + 2,
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  ctaText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  restore: { paddingVertical: Spacing.sm },
  restoreText: { color: Colors.textSecondary, fontSize: 14 },
  legal: {
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: Spacing.md,
    lineHeight: 16,
  },
});
