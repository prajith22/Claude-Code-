import { View, Text, StyleSheet, SectionList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useOddsApi, ParsedGame } from '@/hooks/useOddsApi';
import { useWallet } from '@/store/useWallet';
import { Colors, Spacing, Radius } from '@/constants/theme';

function formatOdds(n: number) {
  return n > 0 ? `+${n}` : `${n}`;
}

function formatGameTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function GameCard({ game }: { game: ParsedGame }) {
  const sportColor = game.sport === 'NFL' ? Colors.sport : Colors.accent;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push({ pathname: '/bet/[id]', params: { id: game.id } })}
      activeOpacity={0.85}
    >
      <View style={styles.cardHeader}>
        <View style={[styles.sportBadge, { backgroundColor: `${sportColor}22`, borderColor: sportColor }]}>
          <Text style={[styles.sportBadgeText, { color: sportColor }]}>{game.sport}</Text>
        </View>
        <Text style={styles.gameTime}>{formatGameTime(game.commenceTime)}</Text>
      </View>

      <View style={styles.matchup}>
        <Text style={styles.team}>{game.awayTeam}</Text>
        <Text style={styles.at}>@</Text>
        <Text style={styles.team}>{game.homeTeam}</Text>
      </View>

      {game.moneyline && (
        <View style={styles.oddsRow}>
          <View style={styles.oddsPill}>
            <Text style={styles.oddsLabel}>ML</Text>
            <Text style={styles.oddsValue}>{formatOdds(game.moneyline.away)} / {formatOdds(game.moneyline.home)}</Text>
          </View>
          {game.spread && (
            <View style={styles.oddsPill}>
              <Text style={styles.oddsLabel}>Spread</Text>
              <Text style={styles.oddsValue}>{game.spread.awayPoint > 0 ? '+' : ''}{game.spread.awayPoint}</Text>
            </View>
          )}
          {game.overUnder && (
            <View style={styles.oddsPill}>
              <Text style={styles.oddsLabel}>O/U</Text>
              <Text style={styles.oddsValue}>{game.overUnder.point}</Text>
            </View>
          )}
        </View>
      )}

      <Text style={styles.tapHint}>Tap to place a bet →</Text>
    </TouchableOpacity>
  );
}

export default function BetScreen() {
  const insets = useSafeAreaInsets();
  const { games, loading, error } = useOddsApi();
  const { balance, pendingBets } = useWallet();

  const sections = [
    { title: '🏈 NFL', data: games.filter((g) => g.sport === 'NFL') },
    { title: '🏀 NBA', data: games.filter((g) => g.sport === 'NBA') },
  ].filter((s) => s.data.length > 0);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Bet</Text>
          <Text style={styles.subtitle}>Fake money, real odds</Text>
        </View>
        <View style={styles.walletCard}>
          <Text style={styles.walletLabel}>Balance</Text>
          <Text style={styles.walletBalance}>${balance.toFixed(2)}</Text>
        </View>
      </View>

      {pendingBets.length > 0 && (
        <TouchableOpacity style={styles.pendingBanner} onPress={() => router.push('/bet/history' as any)}>
          <Text style={styles.pendingText}>⏳ {pendingBets.length} pending bet{pendingBets.length > 1 ? 's' : ''}</Text>
          <Text style={styles.pendingCta}>View →</Text>
        </TouchableOpacity>
      )}

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.sport} size="large" />
          <Text style={styles.loadingText}>Loading games...</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(g) => g.id}
          stickySectionHeadersEnabled={false}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 80 }]}
          showsVerticalScrollIndicator={false}
          renderSectionHeader={({ section }) => (
            <Text style={styles.sectionHeader}>{section.title}</Text>
          )}
          renderItem={({ item }) => <GameCard game={item} />}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>No games available right now</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
  },
  title: { fontSize: 28, fontWeight: '800', color: Colors.textPrimary },
  subtitle: { fontSize: 13, color: Colors.textSecondary },
  walletCard: {
    backgroundColor: Colors.bgCard, borderRadius: Radius.md,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderWidth: 1, borderColor: Colors.border, alignItems: 'flex-end',
  },
  walletLabel: { color: Colors.textMuted, fontSize: 11, marginBottom: 1 },
  walletBalance: { color: Colors.success, fontSize: 18, fontWeight: '800' },
  pendingBanner: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: 'rgba(245,158,11,0.15)', borderRadius: Radius.md,
    marginHorizontal: Spacing.lg, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderWidth: 1, borderColor: Colors.warning, marginBottom: Spacing.sm,
  },
  pendingText: { color: Colors.warning, fontSize: 13, fontWeight: '500' },
  pendingCta: { color: Colors.warning, fontSize: 13, fontWeight: '700' },
  list: { paddingHorizontal: Spacing.lg },
  sectionHeader: {
    fontSize: 18, fontWeight: '700', color: Colors.textPrimary,
    paddingVertical: Spacing.md,
  },
  card: {
    backgroundColor: Colors.bgCard, borderRadius: Radius.lg,
    padding: Spacing.md, marginBottom: Spacing.md,
    borderWidth: 1, borderColor: Colors.border,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.sm },
  sportBadge: {
    borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 2,
    borderWidth: 1,
  },
  sportBadgeText: { fontSize: 11, fontWeight: '700' },
  gameTime: { color: Colors.textMuted, fontSize: 12 },
  matchup: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.md },
  team: { flex: 1, color: Colors.textPrimary, fontSize: 14, fontWeight: '700', textAlign: 'center' },
  at: { color: Colors.textMuted, fontSize: 13 },
  oddsRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.sm },
  oddsPill: {
    flex: 1, backgroundColor: Colors.bgElevated, borderRadius: Radius.sm,
    paddingVertical: 6, alignItems: 'center',
  },
  oddsLabel: { color: Colors.textMuted, fontSize: 10, fontWeight: '600', marginBottom: 1 },
  oddsValue: { color: Colors.textPrimary, fontSize: 13, fontWeight: '700' },
  tapHint: { color: Colors.textMuted, fontSize: 12, textAlign: 'right' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: Spacing.xxl },
  loadingText: { color: Colors.textSecondary, marginTop: Spacing.md },
  errorText: { color: Colors.error, fontSize: 15 },
  emptyText: { color: Colors.textMuted, fontSize: 15 },
});
