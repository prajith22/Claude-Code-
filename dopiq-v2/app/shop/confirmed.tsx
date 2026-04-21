import { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Animated, TouchableOpacity,
  ScrollView, StatusBar,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Spacing, Radius } from '@/constants/theme';

// Light palette — this screen is intentionally bright/white
const C = {
  bg: '#f0f2f5',
  card: '#ffffff',
  border: '#e5e7eb',
  textPrimary: '#111827',
  textSecondary: '#6b7280',
  textMuted: '#9ca3af',
  success: '#16a34a',
  successBg: '#dcfce7',
  successBorder: '#bbf7d0',
  teal: '#0d9488',
  tealBg: '#ccfbf1',
  indigoBg: '#ede9fe',
  indigoText: '#5b21b6',
  badge: '#15803d',
  badgeBg: '#dcfce7',
};

const CONFETTI = [
  '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6',
  '#10b981', '#ec4899', '#0d9488', '#f97316',
];

type PieceType = 'circle' | 'square' | 'rect';

interface Piece {
  id: number;
  x: number;
  delay: number;
  color: string;
  shape: PieceType;
  size: number;
}

const PIECES: Piece[] = Array.from({ length: 48 }, (_, i) => ({
  id: i,
  x: 10 + (i * 13.7) % 350,
  delay: i * 55,
  color: CONFETTI[i % CONFETTI.length],
  shape: (['circle', 'square', 'rect'] as PieceType[])[i % 3],
  size: 6 + (i % 4) * 3,
}));

function ConfettiPiece({ p }: { p: Piece }) {
  const y = useRef(new Animated.Value(-20)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const sway = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(p.delay),
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 150, useNativeDriver: true }),
        Animated.timing(y, { toValue: 380, duration: 2000, useNativeDriver: true }),
        Animated.timing(rotate, { toValue: 1, duration: 2000, useNativeDriver: true }),
        Animated.sequence([
          Animated.timing(sway, { toValue: 14, duration: 600, useNativeDriver: true }),
          Animated.timing(sway, { toValue: -14, duration: 600, useNativeDriver: true }),
          Animated.timing(sway, { toValue: 8, duration: 600, useNativeDriver: true }),
          Animated.timing(sway, { toValue: 0, duration: 200, useNativeDriver: true }),
        ]),
      ]),
      Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();
  }, []);

  const spin = rotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '540deg'] });
  const w = p.shape === 'rect' ? p.size * 1.8 : p.size;
  const h = p.shape === 'rect' ? p.size * 0.6 : p.size;
  const br = p.shape === 'circle' ? p.size / 2 : 2;

  return (
    <Animated.View
      style={{
        position: 'absolute',
        top: 0,
        left: p.x,
        width: w,
        height: h,
        borderRadius: br,
        backgroundColor: p.color,
        opacity,
        transform: [{ translateY: y }, { translateX: sway }, { rotate: spin }],
      }}
    />
  );
}

function Step({ label, index, active }: { label: string; index: number; active: boolean }) {
  const fill = useRef(new Animated.Value(0)).current;
  const dotScale = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    if (!active) return;
    Animated.sequence([
      Animated.delay(400 + index * 120),
      Animated.parallel([
        Animated.spring(dotScale, { toValue: 1, tension: 120, friction: 6, useNativeDriver: true }),
        Animated.timing(fill, { toValue: 1, duration: 500, useNativeDriver: false }),
      ]),
    ]).start();
  }, []);

  const lineWidth = fill.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <View style={stepStyles.wrap}>
      <Animated.View style={[stepStyles.dot, active && stepStyles.dotActive, { transform: [{ scale: dotScale }] }]}>
        {active && <View style={stepStyles.dotInner} />}
      </Animated.View>
      {index < 3 && (
        <View style={stepStyles.track}>
          <Animated.View style={[stepStyles.trackFill, active && { width: lineWidth }]} />
        </View>
      )}
      <Text style={[stepStyles.label, active && stepStyles.labelActive]} numberOfLines={2}>
        {label}
      </Text>
    </View>
  );
}

const stepStyles = StyleSheet.create({
  wrap: { alignItems: 'center', flex: 1 },
  dot: {
    width: 14, height: 14, borderRadius: 7,
    backgroundColor: '#e5e7eb', borderWidth: 2, borderColor: '#d1d5db',
    alignItems: 'center', justifyContent: 'center',
  },
  dotActive: { backgroundColor: C.success, borderColor: C.success },
  dotInner: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#fff' },
  track: {
    position: 'absolute', top: 5, left: '50%', right: '-50%',
    height: 3, backgroundColor: '#e5e7eb', overflow: 'hidden',
  },
  trackFill: { height: '100%', backgroundColor: C.success },
  label: { color: C.textMuted, fontSize: 9, marginTop: 6, textAlign: 'center', lineHeight: 12 },
  labelActive: { color: C.success, fontWeight: '700' },
});

export default function OrderConfirmed() {
  const insets = useSafeAreaInsets();
  const { orderNum } = useLocalSearchParams<{ orderNum: string }>();

  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, tension: 80, friction: 6, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  const displayOrder = orderNum ?? '#DQ-' + Math.floor(10000 + Math.random() * 90000);
  const now = new Date();
  const deliveryDate = new Date(now.getTime() + 3 * 86400000);
  const deliveryStr = deliveryDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

      {/* Confetti */}
      <View style={styles.confettiLayer} pointerEvents="none">
        {PIECES.map((p) => <ConfettiPiece key={p.id} p={p} />)}
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Check circle */}
        <Animated.View style={[styles.checkWrap, { transform: [{ scale: scaleAnim }], opacity: fadeAnim }]}>
          <View style={styles.checkCircle}>
            <Text style={styles.checkMark}>✓</Text>
          </View>
        </Animated.View>

        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <Text style={styles.title}>Order Confirmed!</Text>
          <Text style={styles.sub}>
            Your virtual order is placed.{'\n'}No real money was spent. 🎉
          </Text>

          {/* Order card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Order {displayOrder}</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>Confirmed</Text>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Placed at</Text>
                <Text style={styles.metaValue}>{timeStr}</Text>
              </View>
              <View style={styles.metaSep} />
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Payment</Text>
                <Text style={styles.metaValue}>Dopiq Pay</Text>
              </View>
              <View style={styles.metaSep} />
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Items</Text>
                <Text style={styles.metaValue}>See cart</Text>
              </View>
            </View>
          </View>

          {/* Progress steps */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Order Status</Text>
            <View style={styles.stepsRow}>
              {['Order\nPlaced', 'Processing', 'Shipped', 'Delivered'].map((label, i) => (
                <Step key={label} label={label} index={i} active={i === 0} />
              ))}
            </View>
          </View>

          {/* Delivery card */}
          <View style={styles.deliveryCard}>
            <View style={styles.deliveryLeft}>
              <Text style={styles.deliveryLabel}>Estimated Delivery</Text>
              <Text style={styles.deliveryDate}>{deliveryStr}</Text>
              <Text style={styles.deliverySub}>3–5 business days • Standard shipping</Text>
            </View>
            <View style={styles.freeTag}>
              <Text style={styles.freeText}>FREE</Text>
            </View>
          </View>

          {/* Savings nudge */}
          <View style={styles.nudgeCard}>
            <Text style={styles.nudgeEmoji}>💜</Text>
            <View style={styles.nudgeText}>
              <Text style={styles.nudgeTitle}>You saved $12.00 today</Text>
              <Text style={styles.nudgeSub}>Dopiq members save an avg. of $47/mo</Text>
            </View>
          </View>
        </Animated.View>
      </ScrollView>

      {/* Footer CTA */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.sm }]}>
        <TouchableOpacity
          style={styles.cta}
          onPress={() => router.replace('/(tabs)/shop')}
          activeOpacity={0.88}
        >
          <Text style={styles.ctaText}>Keep Shopping</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.homeBtn}
          onPress={() => router.replace('/(tabs)')}
          activeOpacity={0.7}
        >
          <Text style={styles.homeBtnText}>Go to Home</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  confettiLayer: {
    position: 'absolute', top: 0, left: 0, right: 0,
    height: 420, overflow: 'hidden', zIndex: 10,
  },
  content: { alignItems: 'center', paddingHorizontal: Spacing.md, paddingTop: 48 },

  checkWrap: { marginBottom: Spacing.lg },
  checkCircle: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: C.success,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: C.success, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35, shadowRadius: 16, elevation: 10,
  },
  checkMark: { fontSize: 44, color: '#fff', fontWeight: '800', lineHeight: 52 },

  title: {
    fontSize: 28, fontWeight: '800', color: C.textPrimary,
    textAlign: 'center', marginBottom: Spacing.xs,
  },
  sub: {
    fontSize: 15, color: C.textSecondary, textAlign: 'center',
    lineHeight: 22, marginBottom: Spacing.lg,
  },

  card: {
    backgroundColor: C.card, borderRadius: Radius.lg,
    padding: Spacing.md, width: '100%',
    borderWidth: 1, borderColor: C.border,
    marginBottom: Spacing.sm,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  cardTitle: { fontSize: 15, fontWeight: '700', color: C.textPrimary },
  badge: { backgroundColor: C.badgeBg, paddingHorizontal: 10, paddingVertical: 3, borderRadius: Radius.full },
  badgeText: { color: C.badge, fontSize: 11, fontWeight: '700' },
  divider: { height: 1, backgroundColor: C.border, marginBottom: Spacing.sm },
  metaRow: { flexDirection: 'row', alignItems: 'center' },
  metaItem: { flex: 1, alignItems: 'center' },
  metaLabel: { fontSize: 11, color: C.textMuted, marginBottom: 2 },
  metaValue: { fontSize: 13, fontWeight: '600', color: C.textPrimary },
  metaSep: { width: 1, height: 28, backgroundColor: C.border },

  sectionTitle: { fontSize: 13, fontWeight: '600', color: C.textSecondary, marginBottom: Spacing.md },
  stepsRow: { flexDirection: 'row', alignItems: 'flex-start' },

  deliveryCard: {
    backgroundColor: C.card, borderRadius: Radius.lg,
    padding: Spacing.md, width: '100%',
    borderWidth: 1, borderColor: C.border,
    marginBottom: Spacing.sm, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'space-between',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  deliveryLeft: { flex: 1 },
  deliveryLabel: { fontSize: 11, color: C.textMuted, marginBottom: 2 },
  deliveryDate: { fontSize: 16, fontWeight: '700', color: C.textPrimary, marginBottom: 2 },
  deliverySub: { fontSize: 12, color: C.textSecondary },
  freeTag: {
    backgroundColor: C.tealBg, paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: Radius.full,
  },
  freeText: { color: C.teal, fontSize: 13, fontWeight: '800', letterSpacing: 0.5 },

  nudgeCard: {
    backgroundColor: C.indigoBg, borderRadius: Radius.lg,
    padding: Spacing.md, width: '100%',
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  nudgeEmoji: { fontSize: 24 },
  nudgeText: { flex: 1 },
  nudgeTitle: { fontSize: 14, fontWeight: '700', color: C.indigoText },
  nudgeSub: { fontSize: 12, color: '#7c3aed', marginTop: 1 },

  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: C.card, paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: C.border,
    gap: Spacing.xs,
  },
  cta: {
    backgroundColor: C.teal, borderRadius: Radius.lg,
    paddingVertical: 15, alignItems: 'center',
    shadowColor: C.teal, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },
  ctaText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  homeBtn: { paddingVertical: Spacing.sm, alignItems: 'center' },
  homeBtnText: { color: C.textSecondary, fontSize: 14 },
});
