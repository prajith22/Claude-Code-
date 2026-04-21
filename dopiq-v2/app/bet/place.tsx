import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useWallet } from '@/store/useWallet';
import { Colors, Spacing, Radius } from '@/constants/theme';
import { BetType, PlacedBet } from '@/store/types';

function calcPayout(stake: number, americanOdds: number): number {
  if (americanOdds > 0) return stake * (americanOdds / 100) + stake;
  return stake * (100 / Math.abs(americanOdds)) + stake;
}

function formatOdds(n: number) {
  return n > 0 ? `+${n}` : `${n}`;
}

const QUICK_AMOUNTS = [10, 25, 50, 100];

export default function PlaceBet() {
  const insets = useSafeAreaInsets();
  const { balance, placeBet } = useWallet();
  const params = useLocalSearchParams<{
    gameId: string; homeTeam: string; awayTeam: string;
    sport: string; betType: string; selection: string; odds: string;
  }>();

  const odds = Number(params.odds);
  const [stakeStr, setStakeStr] = useState('');
  const stake = parseFloat(stakeStr) || 0;
  const payout = calcPayout(stake, odds);
  const profit = payout - stake;

  const handleConfirm = () => {
    if (stake <= 0) {
      Alert.alert('Enter a stake', 'Please enter an amount to bet.');
      return;
    }
    if (stake > balance) {
      Alert.alert('Insufficient balance', `You only have $${balance.toFixed(2)} in your fake wallet.`);
      return;
    }

    const bet: PlacedBet = {
      id: `bet_${Date.now()}`,
      gameId: params.gameId,
      homeTeam: params.homeTeam,
      awayTeam: params.awayTeam,
      sport: params.sport as 'NFL' | 'NBA',
      betType: params.betType as BetType,
      selection: params.selection,
      odds,
      stake,
      potentialPayout: payout,
      status: 'pending',
      placedAt: new Date().toISOString(),
    };

    placeBet(bet);
    router.replace({ pathname: '/bet/confirmed', params: { betId: bet.id, selection: bet.selection, odds: String(odds), stake: String(stake), payout: String(payout) } });
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.nav}>
          <TouchableOpacity onPress={() => router.back()}><Text style={styles.back}>✕ Cancel</Text></TouchableOpacity>
          <Text style={styles.navTitle}>Place Bet</Text>
          <View style={{ width: 70 }} />
        </View>

        {/* Bet info */}
        <View style={styles.betCard}>
          <Text style={styles.betSelection}>{params.selection}</Text>
          <Text style={styles.betMatchup}>{params.awayTeam} @ {params.homeTeam}</Text>
          <Text style={styles.betTypeLabel}>{(params.betType as string).replace('_', ' / ').toUpperCase()}</Text>
          <Text style={[styles.betOdds, odds > 0 ? styles.oddsPos : styles.oddsNeg]}>{formatOdds(odds)}</Text>
        </View>

        {/* Balance */}
        <View style={styles.balanceRow}>
          <Text style={styles.balanceLabel}>Fake wallet balance</Text>
          <Text style={styles.balanceValue}>${balance.toFixed(2)}</Text>
        </View>

        {/* Stake input */}
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>Stake amount</Text>
          <View style={styles.inputWrap}>
            <Text style={styles.inputDollar}>$</Text>
            <TextInput
              style={styles.input}
              value={stakeStr}
              onChangeText={setStakeStr}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor={Colors.textMuted}
              maxLength={7}
            />
          </View>

          {/* Quick amounts */}
          <View style={styles.quickRow}>
            {QUICK_AMOUNTS.map((a) => (
              <TouchableOpacity key={a} style={styles.quickBtn} onPress={() => setStakeStr(String(a))}>
                <Text style={styles.quickBtnText}>${a}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Payout preview */}
        {stake > 0 && (
          <View style={styles.payoutCard}>
            <View style={styles.payoutRow}>
              <Text style={styles.payoutLabel}>Potential payout</Text>
              <Text style={styles.payoutValue}>${payout.toFixed(2)}</Text>
            </View>
            <View style={styles.payoutRow}>
              <Text style={styles.payoutLabel}>Potential profit</Text>
              <Text style={[styles.payoutValue, { color: Colors.success }]}>+${profit.toFixed(2)}</Text>
            </View>
          </View>
        )}

        <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.sm }]}>
          <TouchableOpacity
            style={[styles.confirmBtn, stake <= 0 && styles.confirmBtnDisabled]}
            onPress={handleConfirm}
            activeOpacity={0.85}
          >
            <Text style={styles.confirmBtnText}>Confirm Bet</Text>
          </TouchableOpacity>
          <Text style={styles.disclaimer}>Fake money only. No real funds.</Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  nav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  back: { color: Colors.textSecondary, fontSize: 15, width: 70 },
  navTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  betCard: {
    margin: Spacing.lg, backgroundColor: Colors.bgCard, borderRadius: Radius.lg,
    padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border, alignItems: 'center',
  },
  betSelection: { fontSize: 20, fontWeight: '800', color: Colors.textPrimary, textAlign: 'center', marginBottom: 4 },
  betMatchup: { fontSize: 13, color: Colors.textSecondary, marginBottom: 6 },
  betTypeLabel: { fontSize: 11, color: Colors.textMuted, fontWeight: '700', letterSpacing: 0.8, marginBottom: 8 },
  betOdds: { fontSize: 32, fontWeight: '900' },
  oddsPos: { color: Colors.success },
  oddsNeg: { color: Colors.error },
  balanceRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.lg, marginBottom: Spacing.md,
  },
  balanceLabel: { color: Colors.textSecondary, fontSize: 13 },
  balanceValue: { color: Colors.success, fontWeight: '700', fontSize: 15 },
  inputSection: { paddingHorizontal: Spacing.lg, marginBottom: Spacing.md },
  inputLabel: { color: Colors.textSecondary, fontSize: 13, marginBottom: Spacing.sm },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.bgCard, borderRadius: Radius.md,
    borderWidth: 1.5, borderColor: Colors.accent,
    paddingHorizontal: Spacing.md,
  },
  inputDollar: { color: Colors.textPrimary, fontSize: 22, fontWeight: '700', marginRight: 4 },
  input: { flex: 1, color: Colors.textPrimary, fontSize: 28, fontWeight: '800', paddingVertical: Spacing.md },
  quickRow: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm },
  quickBtn: {
    flex: 1, backgroundColor: Colors.bgCard, borderRadius: Radius.sm,
    paddingVertical: 8, alignItems: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },
  quickBtnText: { color: Colors.textSecondary, fontSize: 13, fontWeight: '600' },
  payoutCard: {
    marginHorizontal: Spacing.lg, backgroundColor: 'rgba(34,197,94,0.1)',
    borderRadius: Radius.md, padding: Spacing.md,
    borderWidth: 1, borderColor: 'rgba(34,197,94,0.3)',
  },
  payoutRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  payoutLabel: { color: Colors.textSecondary, fontSize: 14 },
  payoutValue: { color: Colors.textPrimary, fontSize: 14, fontWeight: '700' },
  footer: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md },
  confirmBtn: {
    backgroundColor: Colors.sport, borderRadius: Radius.lg,
    paddingVertical: Spacing.md + 2, alignItems: 'center', marginBottom: Spacing.sm,
  },
  confirmBtnDisabled: { opacity: 0.4 },
  confirmBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  disclaimer: { color: Colors.textMuted, fontSize: 11, textAlign: 'center' },
});
