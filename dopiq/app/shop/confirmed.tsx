import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, ScrollView } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, Radius } from '@/constants/theme';

function ConfettiDot({ delay, color, x }: { delay: number; color: string; x: number }) {
  const y = useRef(new Animated.Value(-20)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(y, { toValue: 300, duration: 1800, useNativeDriver: true }),
      ]),
      Animated.timing(opacity, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        top: 0,
        left: x,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: color,
        opacity,
        transform: [{ translateY: y }],
      }}
    />
  );
}

const CONFETTI_COLORS = [Colors.accent, Colors.shop, Colors.food, Colors.sport, Colors.warning, '#ff6b9d'];

export default function OrderConfirmed() {
  const insets = useSafeAreaInsets();
  const { orderNum } = useLocalSearchParams<{ orderNum: string }>();

  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, tension: 80, friction: 6, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  const confettiDots = Array.from({ length: 24 }).map((_, i) => ({
    delay: i * 60,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    x: 20 + (i * 15) % 320,
  }));

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {/* Confetti */}
      <View style={styles.confettiLayer} pointerEvents="none">
        {confettiDots.map((dot, i) => (
          <ConfettiDot key={i} {...dot} />
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View style={[styles.checkCircle, { transform: [{ scale: scaleAnim }], opacity: opacityAnim }]}>
          <Text style={styles.checkMark}>✓</Text>
        </Animated.View>

        <Animated.View style={{ opacity: opacityAnim }}>
          <Text style={styles.title}>Order Confirmed!</Text>
          <Text style={styles.sub}>
            Your fake order is on its way.{'\n'}No real money was spent. 🎉
          </Text>

          <View style={styles.orderCard}>
            <Text style={styles.orderLabel}>Order Number</Text>
            <Text style={styles.orderNum}>{orderNum}</Text>
          </View>

          <View style={styles.steps}>
            {['Order placed', 'Processing', 'Shipped', 'Delivered'].map((step, i) => (
              <View key={step} style={styles.step}>
                <View style={[styles.stepDot, i === 0 && styles.stepDotActive]} />
                {i < 3 && <View style={[styles.stepLine, i === 0 && styles.stepLineActive]} />}
                <Text style={[styles.stepLabel, i === 0 && styles.stepLabelActive]}>{step}</Text>
              </View>
            ))}
          </View>

          <View style={styles.estimateCard}>
            <Text style={styles.estimateLabel}>Estimated Delivery</Text>
            <Text style={styles.estimateValue}>3–5 Business Days</Text>
          </View>
        </Animated.View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.sm }]}>
        <TouchableOpacity style={styles.cta} onPress={() => router.replace('/(tabs)/shop')} activeOpacity={0.85}>
          <Text style={styles.ctaText}>Keep Shopping</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.home} onPress={() => router.replace('/(tabs)')} >
          <Text style={styles.homeText}>Go to Home</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  confettiLayer: { position: 'absolute', top: 0, left: 0, right: 0, height: 400, overflow: 'hidden' },
  content: { alignItems: 'center', paddingHorizontal: Spacing.xl, paddingTop: 60, paddingBottom: 40 },
  checkCircle: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: Colors.success,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.xl,
    shadowColor: Colors.success,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 10,
  },
  checkMark: { fontSize: 52, color: '#fff', fontWeight: '800' },
  title: { fontSize: 32, fontWeight: '800', color: Colors.textPrimary, textAlign: 'center', marginBottom: Spacing.sm },
  sub: { fontSize: 15, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: Spacing.xl },
  orderCard: {
    backgroundColor: Colors.bgCard, borderRadius: Radius.lg,
    padding: Spacing.lg, alignItems: 'center', width: '100%',
    borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.xl,
  },
  orderLabel: { color: Colors.textSecondary, fontSize: 13, marginBottom: 4 },
  orderNum: { color: Colors.textPrimary, fontSize: 22, fontWeight: '800', letterSpacing: 1 },
  steps: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: Spacing.xl, gap: 0 },
  step: { alignItems: 'center', flex: 1 },
  stepDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: Colors.bgElevated, borderWidth: 2, borderColor: Colors.border },
  stepDotActive: { backgroundColor: Colors.success, borderColor: Colors.success },
  stepLine: { height: 2, backgroundColor: Colors.border, position: 'absolute', top: 5, left: '50%', right: '-50%' },
  stepLineActive: { backgroundColor: Colors.success },
  stepLabel: { color: Colors.textMuted, fontSize: 10, marginTop: 6, textAlign: 'center' },
  stepLabelActive: { color: Colors.success, fontWeight: '600' },
  estimateCard: {
    backgroundColor: Colors.accentGlow, borderRadius: Radius.md,
    padding: Spacing.md, alignItems: 'center', width: '100%',
    borderWidth: 1, borderColor: Colors.accent,
  },
  estimateLabel: { color: Colors.textSecondary, fontSize: 12, marginBottom: 2 },
  estimateValue: { color: Colors.accentLight, fontSize: 16, fontWeight: '700' },
  footer: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, gap: Spacing.sm },
  cta: {
    backgroundColor: Colors.shop, borderRadius: Radius.lg,
    paddingVertical: Spacing.md + 2, alignItems: 'center',
  },
  ctaText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  home: { paddingVertical: Spacing.sm, alignItems: 'center' },
  homeText: { color: Colors.textSecondary, fontSize: 15 },
});
