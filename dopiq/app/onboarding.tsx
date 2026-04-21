import { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useOnboarding } from '@/store/useOnboarding';
import { Colors, Spacing, Radius } from '@/constants/theme';
import { ShoppingCategory, FoodCuisine, OrderSize, Sport } from '@/store/types';

const { width } = Dimensions.get('window');

const SHOPPING_CATEGORIES: ShoppingCategory[] = ['Clothes', 'Electronics', 'Home Goods', 'Beauty', 'Sports'];
const FOOD_CUISINES: FoodCuisine[] = ['Pizza', 'Chinese', 'Mexican', 'Burgers', 'Sushi', 'Italian'];
const ORDER_SIZES: OrderSize[] = ['Just me', 'Me + 1', 'Group order'];
const SPORTS: Sport[] = ['NFL', 'NBA'];

const STEPS = ['shopping', 'food', 'sports'] as const;
type Step = typeof STEPS[number];

export default function Onboarding() {
  const insets = useSafeAreaInsets();
  const { setOnboarding } = useOnboarding();

  const [step, setStep] = useState<Step>('shopping');
  const [shoppingCategories, setShoppingCategories] = useState<ShoppingCategory[]>([]);
  const [foodCuisines, setFoodCuisines] = useState<FoodCuisine[]>([]);
  const [orderSize, setOrderSize] = useState<OrderSize>('Just me');
  const [sports, setSports] = useState<Sport[]>(['NFL', 'NBA']);

  const slideAnim = useRef(new Animated.Value(0)).current;

  const stepIndex = STEPS.indexOf(step);
  const progress = (stepIndex + 1) / STEPS.length;

  const animateNext = (nextStep: Step) => {
    Animated.sequence([
      Animated.timing(slideAnim, { toValue: -30, duration: 150, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 0, useNativeDriver: true }),
    ]).start();
    setStep(nextStep);
  };

  const toggleShop = (cat: ShoppingCategory) => {
    setShoppingCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const toggleCuisine = (c: FoodCuisine) => {
    setFoodCuisines((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
    );
  };

  const toggleSport = (s: Sport) => {
    setSports((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  };

  const handleFinish = async () => {
    await setOnboarding({
      shoppingCategories,
      foodCuisines,
      orderSize,
      sports,
      completed: true,
    });
    router.replace('/(tabs)');
  };

  const canContinue = () => {
    if (step === 'shopping') return shoppingCategories.length > 0;
    if (step === 'food') return foodCuisines.length > 0;
    if (step === 'sports') return sports.length > 0;
    return false;
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + Spacing.md }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>dopiq</Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
        <Text style={styles.stepLabel}>{stepIndex + 1} of {STEPS.length}</Text>
      </View>

      <Animated.View style={[styles.content, { transform: [{ translateY: slideAnim }] }]}>
        {step === 'shopping' && (
          <>
            <Text style={styles.question}>What do you usually shop for?</Text>
            <Text style={styles.sub}>Select all that apply</Text>
            <View style={styles.chips}>
              {SHOPPING_CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.chip, shoppingCategories.includes(cat) && styles.chipActive]}
                  onPress={() => toggleShop(cat)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.chipText, shoppingCategories.includes(cat) && styles.chipTextActive]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {step === 'food' && (
          <>
            <Text style={styles.question}>What cuisines do you usually order?</Text>
            <Text style={styles.sub}>Select all that apply</Text>
            <View style={styles.chips}>
              {FOOD_CUISINES.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[styles.chip, foodCuisines.includes(c) && styles.chipActive]}
                  onPress={() => toggleCuisine(c)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.chipText, foodCuisines.includes(c) && styles.chipTextActive]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={[styles.question, { marginTop: Spacing.xl }]}>Typical order size?</Text>
            <View style={styles.chips}>
              {ORDER_SIZES.map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[styles.chip, orderSize === s && styles.chipActive]}
                  onPress={() => setOrderSize(s)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.chipText, orderSize === s && styles.chipTextActive]}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {step === 'sports' && (
          <>
            <Text style={styles.question}>Which sports do you follow?</Text>
            <Text style={styles.sub}>Both selected by default</Text>
            <View style={styles.chips}>
              {SPORTS.map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[styles.chip, sports.includes(s) && styles.chipActive]}
                  onPress={() => toggleSport(s)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.chipText, sports.includes(s) && styles.chipTextActive]}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}
      </Animated.View>

      {/* CTA */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.lg }]}>
        <TouchableOpacity
          style={[styles.cta, !canContinue() && styles.ctaDisabled]}
          onPress={() => {
            if (!canContinue()) return;
            if (step === 'shopping') animateNext('food');
            else if (step === 'food') animateNext('sports');
            else handleFinish();
          }}
          activeOpacity={0.85}
        >
          <Text style={styles.ctaText}>
            {step === 'sports' ? "Let's go" : 'Continue'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: { paddingHorizontal: Spacing.lg, marginBottom: Spacing.xl },
  logo: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.accent,
    letterSpacing: -1,
    marginBottom: Spacing.lg,
  },
  progressBar: {
    height: 4,
    backgroundColor: Colors.bgElevated,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.accent,
    borderRadius: Radius.full,
  },
  stepLabel: {
    color: Colors.textMuted,
    fontSize: 12,
    marginTop: Spacing.xs,
    textAlign: 'right',
  },
  content: { flex: 1, paddingHorizontal: Spacing.lg },
  question: { fontSize: 26, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.xs },
  sub: { fontSize: 14, color: Colors.textSecondary, marginBottom: Spacing.lg },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.bgCard,
  },
  chipActive: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accentGlow,
  },
  chipText: { color: Colors.textSecondary, fontSize: 15, fontWeight: '500' },
  chipTextActive: { color: Colors.accentLight, fontWeight: '600' },
  footer: { paddingHorizontal: Spacing.lg },
  cta: {
    backgroundColor: Colors.accent,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md + 2,
    alignItems: 'center',
  },
  ctaDisabled: { opacity: 0.4 },
  ctaText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
