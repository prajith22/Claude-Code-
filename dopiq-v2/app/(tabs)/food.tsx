import { useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useOnboarding } from '@/store/useOnboarding';
import { useFoodCart } from '@/store/useFoodCart';
import { Colors, Spacing, Radius } from '@/constants/theme';
import { Restaurant, FoodCuisine } from '@/store/types';
import restaurantsData from '@/data/restaurants.json';

const restaurants = restaurantsData as Restaurant[];
const ALL_CUISINES: FoodCuisine[] = ['Pizza', 'Chinese', 'Mexican', 'Burgers', 'Sushi', 'Italian'];

const CUISINE_EMOJI: Record<FoodCuisine, string> = {
  Pizza: '🍕', Chinese: '🥡', Mexican: '🌮', Burgers: '🍔', Sushi: '🍣', Italian: '🍝',
};

function RestaurantCard({ restaurant, onPress }: { restaurant: Restaurant; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.cardImage}>
        <Text style={styles.cardEmoji}>{CUISINE_EMOJI[restaurant.cuisine]}</Text>
      </View>
      <View style={styles.cardBody}>
        <View style={styles.cardTop}>
          <Text style={styles.cardName}>{restaurant.name}</Text>
          <View style={styles.ratingBadge}>
            <Text style={styles.ratingText}>★ {restaurant.rating}</Text>
          </View>
        </View>
        <Text style={styles.cardCuisine}>{restaurant.cuisine}</Text>
        <View style={styles.cardMeta}>
          <Text style={styles.metaItem}>🕐 {restaurant.deliveryTime}</Text>
          <Text style={styles.metaDot}>·</Text>
          <Text style={styles.metaItem}>
            {restaurant.deliveryFee === 0 ? 'Free delivery' : `$${restaurant.deliveryFee.toFixed(2)} delivery`}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function FoodScreen() {
  const insets = useSafeAreaInsets();
  const { onboarding } = useOnboarding();
  const { itemCount, restaurantName } = useFoodCart();
  const [activeFilter, setActiveFilter] = useState<FoodCuisine | 'All'>('All');

  const sorted = useMemo(() => {
    const preferred = onboarding.foodCuisines;
    if (preferred.length === 0) return restaurants;
    return [
      ...restaurants.filter((r) => preferred.includes(r.cuisine)),
      ...restaurants.filter((r) => !preferred.includes(r.cuisine)),
    ];
  }, [onboarding.foodCuisines]);

  const filtered = useMemo(() => {
    if (activeFilter === 'All') return sorted;
    return sorted.filter((r) => r.cuisine === activeFilter);
  }, [sorted, activeFilter]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Food</Text>
          <Text style={styles.subtitle}>Fake delivery, real cravings</Text>
        </View>
        {itemCount > 0 && (
          <TouchableOpacity style={styles.cartBubble} onPress={() => router.push('/food/cart')}>
            <Text style={styles.cartBubbleText}>{itemCount} in cart · View</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Cuisine filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterContent}>
        {(['All', ...ALL_CUISINES] as const).map((c) => (
          <TouchableOpacity
            key={c}
            style={[styles.filterChip, activeFilter === c && styles.filterChipActive]}
            onPress={() => setActiveFilter(c)}
          >
            {c !== 'All' && <Text style={styles.filterEmoji}>{CUISINE_EMOJI[c as FoodCuisine]}</Text>}
            <Text style={[styles.filterText, activeFilter === c && styles.filterTextActive]}>{c}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Restaurant list */}
      <FlatList
        data={filtered}
        keyExtractor={(r) => r.id}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 80 }]}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <RestaurantCard
            restaurant={item}
            onPress={() => router.push({ pathname: '/food/[id]', params: { id: item.id } })}
          />
        )}
      />
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
  cartBubble: {
    backgroundColor: Colors.food, borderRadius: Radius.full,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
  },
  cartBubbleText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  filterScroll: { marginBottom: Spacing.sm },
  filterContent: { paddingHorizontal: Spacing.lg, gap: Spacing.sm },
  filterChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: Spacing.md, paddingVertical: 6,
    borderRadius: Radius.full, backgroundColor: Colors.bgCard,
    borderWidth: 1, borderColor: Colors.border,
  },
  filterChipActive: { backgroundColor: 'rgba(249,115,22,0.15)', borderColor: Colors.food },
  filterEmoji: { fontSize: 14 },
  filterText: { color: Colors.textSecondary, fontSize: 13, fontWeight: '500' },
  filterTextActive: { color: Colors.foodLight, fontWeight: '600' },
  list: { paddingHorizontal: Spacing.lg },
  card: {
    backgroundColor: Colors.bgCard, borderRadius: Radius.lg,
    marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden',
  },
  cardImage: {
    height: 100, backgroundColor: Colors.bgElevated,
    alignItems: 'center', justifyContent: 'center',
  },
  cardEmoji: { fontSize: 52 },
  cardBody: { padding: Spacing.md },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  cardName: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary, flex: 1 },
  ratingBadge: {
    backgroundColor: Colors.bgElevated, borderRadius: Radius.sm,
    paddingHorizontal: 8, paddingVertical: 2,
  },
  ratingText: { color: Colors.warning, fontSize: 13, fontWeight: '700' },
  cardCuisine: { color: Colors.food, fontSize: 13, fontWeight: '500', marginBottom: 6 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaItem: { color: Colors.textSecondary, fontSize: 13 },
  metaDot: { color: Colors.textMuted },
});
