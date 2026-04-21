import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useWallet } from '@/store/useWallet';
import { Colors, Spacing, Radius } from '@/constants/theme';
import { PlacedBet } from '@/store/types';

function formatOdds(n: number) {
  return n > 0 ? `+${n}` : `${n}`;
}

function BetRow({ bet }: { bet: PlacedBet }) {
  const statusColor = bet.status === 'won' ? Colors.success : bet.status === 'lost' ? Colors.error : Colors.warning;
  const statusLabel = bet.status === 'pending' ? '⏳ Pending' : bet.status === 'won' ? '✅ Won' : bet.status === 'push' ? '↩ Push' : '❌ Lost';

  return (
    <View style={styles.row}>
      <View style={styles.rowTop}>
        <Text style={styles.rowSelection}>{bet.selection}</Text>
        <View style={[styles.statusBadge, { backgroundColor: `${statusColor}22`, borderColor: statusColor }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
        </View>
      </View>
      <Text style={styles.rowMatchup}>{bet.awayTeam} @ {bet.homeTeam}</Text>
      <View style={styles.rowMeta}>
        <Text style={styles.metaItem}>Stake: ${bet.stake.toFixed(2)}</Text>
        <Text style={styles.metaDot}>·</Text>
        <Text style={styles.metaItem}>Odds: {formatOdds(bet.odds)}</Text>
        <Text style={styles.metaDot}>·</Text>
        <Text style={styles.metaItem}>To win: ${(bet.potentialPayout - bet.stake).toFixed(2)}</Text>
      </View>
      {bet.status !== 'pending' && bet.profit !== undefined && (
        <Text style={[styles.profit, { color: bet.profit >= 0 ? Colors.success : Colors.error }]}>
          {bet.profit >= 0 ? `+$${bet.profit.toFixed(2)}` : `-$${Math.abs(bet.profit).toFixed(2)}`}
        </Text>
      )}
      <Text style={styles.rowDate}>{new Date(bet.placedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</Text>
    </View>
  );
}

export default function BetHistory() {
  const insets = useSafeAreaInsets();
  const { bets, balance } = useWallet();

  const totalProfit = bets.reduce((sum, b) => sum + (b.profit ?? 0), 0);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.nav}>
        <TouchableOpacity onPress={() => router.back()}><Text style={styles.back}>‹ Back</Text></TouchableOpacity>
        <Text style={styles.title}>Bet History</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Balance</Text>
          <Text style={[styles.statValue, { color: Colors.success }]}>${balance.toFixed(2)}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Total P&L</Text>
          <Text style={[styles.statValue, { color: totalProfit >= 0 ? Colors.success : Colors.error }]}>
            {totalProfit >= 0 ? '+' : ''}${totalProfit.toFixed(2)}
          </Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Total bets</Text>
          <Text style={styles.statValue}>{bets.length}</Text>
        </View>
      </View>

      <FlatList
        data={bets}
        keyExtractor={(b) => b.id}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 80 }]}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => <BetRow bet={item} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🎯</Text>
            <Text style={styles.emptyText}>No bets placed yet</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  nav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  back: { color: Colors.sport, fontSize: 17, width: 60 },
  title: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  statsRow: {
    flexDirection: 'row', gap: Spacing.sm,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
  },
  statCard: {
    flex: 1, backgroundColor: Colors.bgCard, borderRadius: Radius.md,
    padding: Spacing.md, alignItems: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },
  statLabel: { color: Colors.textMuted, fontSize: 11, fontWeight: '600', textTransform: 'uppercase', marginBottom: 4 },
  statValue: { color: Colors.textPrimary, fontSize: 16, fontWeight: '800' },
  list: { paddingHorizontal: Spacing.lg },
  row: {
    backgroundColor: Colors.bgCard, borderRadius: Radius.lg,
    padding: Spacing.md, marginBottom: Spacing.sm,
    borderWidth: 1, borderColor: Colors.border,
  },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  rowSelection: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, flex: 1 },
  statusBadge: {
    borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 2,
    borderWidth: 1, marginLeft: Spacing.sm,
  },
  statusText: { fontSize: 11, fontWeight: '700' },
  rowMatchup: { color: Colors.textSecondary, fontSize: 12, marginBottom: 6 },
  rowMeta: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 4, marginBottom: 4 },
  metaItem: { color: Colors.textSecondary, fontSize: 12 },
  metaDot: { color: Colors.textMuted },
  profit: { fontSize: 16, fontWeight: '800', marginBottom: 4 },
  rowDate: { color: Colors.textMuted, fontSize: 11 },
  empty: { alignItems: 'center', paddingTop: Spacing.xxl, gap: Spacing.sm },
  emptyEmoji: { fontSize: 48 },
  emptyText: { color: Colors.textMuted, fontSize: 15 },
});
