import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useOddsApi, ParsedGame } from '@/hooks/useOddsApi';
import { useWallet } from '@/store/useWallet';
import { Colors, Spacing, Radius } from '@/constants/theme';
import { BetType } from '@/store/types';

function formatOdds(n: number) {
  return n > 0 ? `+${n}` : `${n}`;
}

function calcPayout(stake: number, americanOdds: number): number {
  if (americanOdds > 0) return stake * (americanOdds / 100) + stake;
  return stake * (100 / Math.abs(americanOdds)) + stake;
}

function OddsButton({
  label,
  odds,
  sub,
  onPress,
}: {
  label: string;
  odds: number;
  sub?: string;
  onPress: () => void;
}) {
  const positive = odds > 0;
  return (
    <TouchableOpacity style={styles.oddsBtn} onPress={onPress} activeOpacity={0.8}>
      <Text style={styles.oddsBtnLabel}>{label}</Text>
      {sub && <Text style={styles.oddsBtnSub}>{sub}</Text>}
      <Text style={[styles.oddsBtnOdds, positive ? styles.oddsPos : styles.oddsNeg]}>
        {formatOdds(odds)}
      </Text>
    </TouchableOpacity>
  );
}

export default function GameDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { games } = useOddsApi();
  const { balance } = useWallet();

  const game = games.find((g) => g.id === id);
  if (!game) return null;

  const navToBet = (betType: BetType, selection: string, odds: number) => {
    router.push({
      pathname: '/bet/place',
      params: {
        gameId: game.id,
        homeTeam: game.homeTeam,
        awayTeam: game.awayTeam,
        sport: game.sport,
        betType,
        selection,
        odds: String(odds),
      },
    });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.nav}>
        <TouchableOpacity onPress={() => router.back()}><Text style={styles.back}>‹ Back</Text></TouchableOpacity>
        <View style={styles.balanceChip}>
          <Text style={styles.balanceText}>${balance.toFixed(2)}</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
        {/* Matchup header */}
        <View style={styles.matchupCard}>
          <View style={[styles.sportBadge, { borderColor: game.sport === 'NFL' ? Colors.sport : Colors.accent }]}>
            <Text style={[styles.sportBadgeText, { color: game.sport === 'NFL' ? Colors.sport : Colors.accent }]}>{game.sport}</Text>
          </View>
          <View style={styles.teams}>
            <View style={styles.teamCol}>
              <Text style={styles.teamLabel}>Away</Text>
              <Text style={styles.teamName}>{game.awayTeam}</Text>
            </View>
            <Text style={styles.vs}>VS</Text>
            <View style={styles.teamCol}>
              <Text style={styles.teamLabel}>Home</Text>
              <Text style={styles.teamName}>{game.homeTeam}</Text>
            </View>
          </View>
          <Text style={styles.gameTime}>
            {new Date(game.commenceTime).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
          </Text>
        </View>

        {/* Moneyline */}
        {game.moneyline && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Moneyline</Text>
            <View style={styles.betRow}>
              <OddsButton
                label={game.awayTeam}
                odds={game.moneyline.away}
                onPress={() => navToBet('moneyline', game.awayTeam, game.moneyline!.away)}
              />
              <OddsButton
                label={game.homeTeam}
                odds={game.moneyline.home}
                onPress={() => navToBet('moneyline', game.homeTeam, game.moneyline!.home)}
              />
            </View>
          </View>
        )}

        {/* Spread */}
        {game.spread && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Spread</Text>
            <View style={styles.betRow}>
              <OddsButton
                label={game.awayTeam}
                sub={`${game.spread.awayPoint > 0 ? '+' : ''}${game.spread.awayPoint}`}
                odds={game.spread.away}
                onPress={() => navToBet('spread', `${game.awayTeam} ${game.spread!.awayPoint > 0 ? '+' : ''}${game.spread!.awayPoint}`, game.spread!.away)}
              />
              <OddsButton
                label={game.homeTeam}
                sub={`${game.spread.homePoint > 0 ? '+' : ''}${game.spread.homePoint}`}
                odds={game.spread.home}
                onPress={() => navToBet('spread', `${game.homeTeam} ${game.spread!.homePoint > 0 ? '+' : ''}${game.spread!.homePoint}`, game.spread!.home)}
              />
            </View>
          </View>
        )}

        {/* Over/Under */}
        {game.overUnder && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Over / Under  ({game.overUnder.point})</Text>
            <View style={styles.betRow}>
              <OddsButton
                label="Over"
                sub={`${game.overUnder.point}`}
                odds={game.overUnder.over}
                onPress={() => navToBet('over_under', `Over ${game.overUnder!.point}`, game.overUnder!.over)}
              />
              <OddsButton
                label="Under"
                sub={`${game.overUnder.point}`}
                odds={game.overUnder.under}
                onPress={() => navToBet('over_under', `Under ${game.overUnder!.point}`, game.overUnder!.under)}
              />
            </View>
          </View>
        )}

        <Text style={styles.disclaimer}>
          ⚠️ All bets use fake money only. No real funds involved.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  nav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm,
  },
  back: { color: Colors.sport, fontSize: 17 },
  balanceChip: {
    backgroundColor: 'rgba(34,197,94,0.15)', borderRadius: Radius.full,
    paddingHorizontal: Spacing.md, paddingVertical: 4,
    borderWidth: 1, borderColor: Colors.success,
  },
  balanceText: { color: Colors.success, fontWeight: '700', fontSize: 14 },
  matchupCard: {
    marginHorizontal: Spacing.lg, marginBottom: Spacing.lg,
    backgroundColor: Colors.bgCard, borderRadius: Radius.lg,
    padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border, alignItems: 'center',
  },
  sportBadge: {
    borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 3,
    borderWidth: 1, marginBottom: Spacing.md,
  },
  sportBadgeText: { fontSize: 12, fontWeight: '700' },
  teams: { flexDirection: 'row', alignItems: 'center', gap: Spacing.lg, marginBottom: Spacing.md },
  teamCol: { flex: 1, alignItems: 'center' },
  teamLabel: { color: Colors.textMuted, fontSize: 11, fontWeight: '600', textTransform: 'uppercase', marginBottom: 4 },
  teamName: { color: Colors.textPrimary, fontSize: 14, fontWeight: '700', textAlign: 'center' },
  vs: { color: Colors.textMuted, fontSize: 16, fontWeight: '800' },
  gameTime: { color: Colors.textSecondary, fontSize: 12 },
  section: { paddingHorizontal: Spacing.lg, marginBottom: Spacing.lg },
  sectionLabel: { fontSize: 13, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: Spacing.sm },
  betRow: { flexDirection: 'row', gap: Spacing.sm },
  oddsBtn: {
    flex: 1, backgroundColor: Colors.bgCard, borderRadius: Radius.lg,
    padding: Spacing.md, alignItems: 'center', borderWidth: 1, borderColor: Colors.border,
  },
  oddsBtnLabel: { color: Colors.textPrimary, fontSize: 13, fontWeight: '600', textAlign: 'center', marginBottom: 2 },
  oddsBtnSub: { color: Colors.textSecondary, fontSize: 12, marginBottom: 4 },
  oddsBtnOdds: { fontSize: 20, fontWeight: '800' },
  oddsPos: { color: Colors.success },
  oddsNeg: { color: Colors.error },
  disclaimer: { color: Colors.textMuted, fontSize: 12, textAlign: 'center', paddingHorizontal: Spacing.xl, marginBottom: Spacing.lg },
});
