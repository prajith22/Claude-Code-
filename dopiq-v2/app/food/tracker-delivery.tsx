import { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, Radius } from '@/constants/theme';

const STAGES = [
  { label: 'Order Received', emoji: '✅', duration: 3000 },
  { label: 'Preparing Your Food', emoji: '👨‍🍳', duration: 5000 },
  { label: 'Driver Picked Up', emoji: '🛵', duration: 4000 },
  { label: 'On the Way', emoji: '📍', duration: 6000 },
  { label: 'Delivered!', emoji: '🎉', duration: 0 },
];

export default function DeliveryTracker() {
  const insets = useSafeAreaInsets();
  const [currentStage, setCurrentStage] = useState(0);
  const [done, setDone] = useState(false);

  const progressAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Pulse the current stage emoji
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 600, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [currentStage]);

  // Advance stages
  useEffect(() => {
    if (currentStage >= STAGES.length - 1) {
      setDone(true);
      Animated.timing(progressAnim, { toValue: 1, duration: 400, useNativeDriver: false }).start();
      return;
    }
    const { duration } = STAGES[currentStage];

    Animated.timing(progressAnim, {
      toValue: (currentStage + 1) / (STAGES.length - 1),
      duration: duration * 0.9,
      useNativeDriver: false,
    }).start();

    const timer = setTimeout(() => {
      setCurrentStage((s) => s + 1);
    }, duration);

    return () => clearTimeout(timer);
  }, [currentStage]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.inner}>
        {/* Header */}
        <Text style={styles.title}>{done ? 'Delivered! 🎉' : 'Your food is on its way'}</Text>
        <Text style={styles.sub}>
          {done ? 'Enjoy your (fake) meal!' : 'Sit tight, your order is being prepared'}
        </Text>

        {/* Progress bar */}
        <View style={styles.progressWrap}>
          <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
        </View>

        {/* Stages */}
        <View style={styles.stages}>
          {STAGES.map((stage, i) => {
            const isActive = i === currentStage;
            const isDone = i < currentStage;
            return (
              <View key={stage.label} style={styles.stageRow}>
                <Animated.Text
                  style={[
                    styles.stageEmoji,
                    isActive && { transform: [{ scale: pulseAnim }] },
                    !isActive && !isDone && { opacity: 0.3 },
                  ]}
                >
                  {isDone ? '✓' : stage.emoji}
                </Animated.Text>
                <Text
                  style={[
                    styles.stageLabel,
                    isActive && styles.stageLabelActive,
                    isDone && styles.stageLabelDone,
                  ]}
                >
                  {stage.label}
                </Text>
                {isActive && !done && (
                  <View style={styles.activeDot}>
                    <Text style={styles.activeDotText}>Now</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* Fake driver info */}
        {currentStage >= 2 && (
          <View style={styles.driverCard}>
            <Text style={styles.driverEmoji}>🛵</Text>
            <View>
              <Text style={styles.driverName}>Marcus R. — Your driver</Text>
              <Text style={styles.driverSub}>★ 4.9  ·  247 deliveries</Text>
            </View>
          </View>
        )}

        {done && (
          <TouchableOpacity style={styles.doneBtn} onPress={() => router.replace('/(tabs)/food')} activeOpacity={0.85}>
            <Text style={styles.doneBtnText}>Back to Restaurants</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  inner: { flex: 1, paddingHorizontal: Spacing.xl, paddingTop: Spacing.xxl, alignItems: 'stretch' },
  title: { fontSize: 26, fontWeight: '800', color: Colors.textPrimary, marginBottom: Spacing.xs },
  sub: { fontSize: 14, color: Colors.textSecondary, marginBottom: Spacing.xl },
  progressWrap: {
    height: 6, backgroundColor: Colors.bgElevated,
    borderRadius: Radius.full, overflow: 'hidden', marginBottom: Spacing.xl,
  },
  progressFill: {
    height: '100%', backgroundColor: Colors.food,
    borderRadius: Radius.full,
  },
  stages: { gap: Spacing.lg, marginBottom: Spacing.xl },
  stageRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  stageEmoji: { fontSize: 26, width: 36, textAlign: 'center' },
  stageLabel: { fontSize: 16, color: Colors.textMuted, fontWeight: '500', flex: 1 },
  stageLabelActive: { color: Colors.textPrimary, fontWeight: '700' },
  stageLabelDone: { color: Colors.success },
  activeDot: {
    backgroundColor: Colors.food, borderRadius: Radius.full,
    paddingHorizontal: 8, paddingVertical: 2,
  },
  activeDotText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  driverCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.bgCard, borderRadius: Radius.lg,
    padding: Spacing.md, borderWidth: 1, borderColor: Colors.border,
    marginBottom: Spacing.xl,
  },
  driverEmoji: { fontSize: 32 },
  driverName: { color: Colors.textPrimary, fontWeight: '600', fontSize: 15 },
  driverSub: { color: Colors.textSecondary, fontSize: 13 },
  doneBtn: {
    backgroundColor: Colors.food, borderRadius: Radius.lg,
    paddingVertical: Spacing.md + 2, alignItems: 'center',
  },
  doneBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
