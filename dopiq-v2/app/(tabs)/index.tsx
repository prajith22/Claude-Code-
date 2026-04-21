import { ScrollView, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useOnboarding } from '@/store/useOnboarding';
import { useSubscription } from '@/store/useSubscription';
import { Colors, Spacing, Radius } from '@/constants/theme';

const SIMULATORS = [
  {
    emoji: '🛍️',
    title: 'Shopping',
    sub: 'Browse, add to cart, and check out',
    color: Colors.shop,
    glow: 'rgba(20, 184, 166, 0.15)',
    route: '/shop' as const,
  },
  {
    emoji: '🍔',
    title: 'Food',
    sub: 'Order from fake restaurants and track delivery',
    color: Colors.food,
    glow: 'rgba(249, 115, 22, 0.15)',
    route: '/food' as const,
  },
  {
    emoji: '🏈',
    title: 'Sports Betting',
    sub: 'Bet on real NFL & NBA games with fake money',
    color: Colors.sport,
    glow: 'rgba(59, 130, 246, 0.15)',
    route: '/bet' as const,
  },
  {
    emoji: '📊',
    title: 'Spending Tracker',
    sub: 'Log real spending and watch it decrease',
    color: Colors.tracker,
    glow: 'rgba(34, 197, 94, 0.15)',
    route: '/tracker' as const,
  },
];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { onboarding } = useOnboarding();
  const { daysLeft, isSubscribed } = useSubscription();

  const days = daysLeft();

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + Spacing.lg, paddingBottom: insets.bottom + Spacing.xl },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <Text style={styles.logo}>dopiq</Text>
      <Text style={styles.tagline}>Satisfy the urge. Keep the cash.</Text>

      {/* Trial banner */}
      {!isSubscribed && days > 0 && (
        <TouchableOpacity style={styles.trialBanner} onPress={() => router.push('/paywall')} activeOpacity={0.8}>
          <Text style={styles.trialText}>⚡ {days} days left in your free trial</Text>
          <Text style={styles.trialCta}>Subscribe →</Text>
        </TouchableOpacity>
      )}

      {/* Welcome */}
      <Text style={styles.sectionLabel}>Simulators</Text>
      <Text style={styles.sectionSub}>
        All the dopamine, none of the damage.
      </Text>

      {/* Simulator cards */}
      {SIMULATORS.map((s) => (
        <TouchableOpacity
          key={s.title}
          style={[styles.card, { backgroundColor: s.glow }]}
          onPress={() => router.push(s.route)}
          activeOpacity={0.8}
        >
          <View style={[styles.cardIcon, { backgroundColor: `${s.color}22` }]}>
            <Text style={styles.cardEmoji}>{s.emoji}</Text>
          </View>
          <View style={styles.cardText}>
            <Text style={styles.cardTitle}>{s.title}</Text>
            <Text style={styles.cardSub}>{s.sub}</Text>
          </View>
          <Text style={[styles.cardArrow, { color: s.color }]}>›</Text>
        </TouchableOpacity>
      ))}

      {/* Personalization hint */}
      {onboarding.shoppingCategories.length > 0 && (
        <View style={styles.hint}>
          <Text style={styles.hintText}>
            ✨ Your feed is personalized based on your preferences
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: Colors.bg },
  content: { paddingHorizontal: Spacing.lg },
  logo: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.accent,
    letterSpacing: -1,
    marginBottom: 4,
  },
  tagline: { fontSize: 15, color: Colors.textSecondary, marginBottom: Spacing.lg },
  trialBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.accentGlow,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.accent,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    marginBottom: Spacing.lg,
  },
  trialText: { color: Colors.accentLight, fontSize: 13, fontWeight: '500' },
  trialCta: { color: Colors.accent, fontSize: 13, fontWeight: '700' },
  sectionLabel: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  sectionSub: { fontSize: 14, color: Colors.textSecondary, marginBottom: Spacing.lg },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardIcon: {
    width: 52,
    height: 52,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  cardEmoji: { fontSize: 26 },
  cardText: { flex: 1 },
  cardTitle: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary, marginBottom: 2 },
  cardSub: { fontSize: 13, color: Colors.textSecondary, lineHeight: 18 },
  cardArrow: { fontSize: 28, fontWeight: '300', marginLeft: Spacing.sm },
  hint: {
    marginTop: Spacing.lg,
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
  hintText: { color: Colors.textSecondary, fontSize: 13, textAlign: 'center' },
});
