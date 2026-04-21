import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useWallet } from '@/store/useWallet';
import { Colors, Spacing, Radius } from '@/constants/theme';

function formatOdds(n: number) {
  return n > 0 ? `+${n}` : `${n}`;
}

export default function BetConfirmed() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    betId: string; selection: string; odds: string; stake: string; payout: string;
  }>();
  const { balance } = useWallet();

  const odds = Number(params.odds);
  const stake = Number(params.stake);
  const payout = Number(params.payout);
  const profit = payout - stake;

  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, tension: 80, friction: 6, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.inner}>
        <Animated.View style={[styles.iconWrap, { transform: [{ scale: scaleAnim }], opacity: opacityAnim }]}>
          <Text style={styles.icon}>🎯</Text>
        </Animated.View>

        <Animated.View style={{ opacity: opacityAnim, alignItems: 'center' }}>
          <Text style={styles.title}>Bet Placed!</Text>
          <Text style={styles.sub}>Your bet is live. Good luck! 🤞</Text>

          <View style={styles.betSummary}>
            <Text style={styles.betSelection}>{params.selection}</Text>
            <Text style={[styles.betOdds, odds > 0 ? styles.oddsPos : styles.oddsNeg]}>
              {formatOdds(odds)}
            </Text>
          </View>

          <View style={styles.detailsCard}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Stake</Text>
              <Text style={styles.detailValue}>${stake.toFixed(2)}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Potential payout</Text>
              <Text style={[styles.detailValue, { color: Colors.success }]}>${payout.toFixed(2)}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Potential profit</Text>
              <Text style={[styles.detailValue, { color: Colors.success }]}>+${profit.toFixed(2)}</Text>
            </View>
            <View style={[styles.detailRow, styles.balanceRow]}>
              <Text style={styles.detailLabel}>Remaining balance</Text>
              <Text style={styles.detailValue}>${balance.toFixed(2)}</Text>
            </View>
          </View>

          <Text style={styles.resolveNote}>
            Bets resolve automatically when the game ends.
          </Text>
        </Animated.View>
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.sm }]}>
        <TouchableOpacity style={styles.primaryBtn} onPress={() => router.replace('/(tabs)/bet')} activeOpacity={0.85}>
          <Text style={styles.primaryBtnText}>Browse More Games</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.replace('/(tabs)')} >
          <Text style={styles.secondaryBtnText}>Go to Home</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  inner: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.xl },
  iconWrap: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: 'rgba(59,130,246,0.2)', alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.lg,
    shadowColor: Colors.sport, shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5, shadowRadius: 20, elevation: 10,
  },
  icon: { fontSize: 44 },
  title: { fontSize: 30, fontWeight: '800', color: Colors.textPrimary, marginBottom: 6 },
  sub: { fontSize: 15, color: Colors.textSecondary, marginBottom: Spacing.xl },
  betSummary: {
    alignItems: 'center', backgroundColor: Colors.bgCard, borderRadius: Radius.lg,
    padding: Spacing.lg, width: '100%', marginBottom: Spacing.md,
    borderWidth: 1, borderColor: Colors.border,
  },
  betSelection: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary, textAlign: 'center', marginBottom: 6 },
  betOdds: { fontSize: 36, fontWeight: '900' },
  oddsPos: { color: Colors.success },
  oddsNeg: { color: Colors.error },
  detailsCard: {
    width: '100%', backgroundColor: Colors.bgCard, borderRadius: Radius.lg,
    padding: Spacing.md, borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.md,
  },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5 },
  detailLabel: { color: Colors.textSecondary, fontSize: 14 },
  detailValue: { color: Colors.textPrimary, fontSize: 14, fontWeight: '700' },
  balanceRow: { borderTopWidth: 1, borderTopColor: Colors.border, marginTop: 4, paddingTop: 8 },
  resolveNote: { color: Colors.textMuted, fontSize: 12, textAlign: 'center' },
  footer: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, gap: Spacing.sm },
  primaryBtn: {
    backgroundColor: Colors.sport, borderRadius: Radius.lg,
    paddingVertical: Spacing.md + 2, alignItems: 'center',
  },
  primaryBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  secondaryBtn: { paddingVertical: Spacing.sm, alignItems: 'center' },
  secondaryBtnText: { color: Colors.textSecondary, fontSize: 15 },
});
