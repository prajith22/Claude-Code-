import { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useOnboarding } from '@/store/useOnboarding';
import { useCart } from '@/store/useCart';
import { Colors, Spacing, Radius } from '@/constants/theme';
import { Product, ShoppingCategory } from '@/store/types';
import productsData from '@/data/products.json';

const products = productsData as Product[];
const ALL_CATEGORIES: ShoppingCategory[] = ['Clothes', 'Electronics', 'Home Goods', 'Beauty', 'Sports'];

function ProductCard({ product, onPress }: { product: Product; onPress: () => void }) {
  const { addToCart } = useCart();
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.cardImage}>
        <Text style={styles.cardImageEmoji}>{categoryEmoji(product.category)}</Text>
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.cardName} numberOfLines={2}>{product.name}</Text>
        <View style={styles.cardMeta}>
          <Text style={styles.cardRating}>★ {product.rating}</Text>
          <Text style={styles.cardReviews}>({product.reviewCount.toLocaleString()})</Text>
        </View>
        <View style={styles.cardFooter}>
          <Text style={styles.cardPrice}>${product.price.toFixed(2)}</Text>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={(e) => { e.stopPropagation(); addToCart(product); }}
            activeOpacity={0.8}
          >
            <Text style={styles.addBtnText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function categoryEmoji(cat: ShoppingCategory) {
  const map: Record<ShoppingCategory, string> = {
    Clothes: '👗', Electronics: '📱', 'Home Goods': '🏠', Beauty: '✨', Sports: '🏋️',
  };
  return map[cat] ?? '📦';
}

export default function ShopScreen() {
  const insets = useSafeAreaInsets();
  const { onboarding } = useOnboarding();
  const { itemCount } = useCart();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<ShoppingCategory | 'All'>('All');

  const preferredFirst = useMemo(() => {
    const preferred = onboarding.shoppingCategories;
    if (preferred.length === 0) return products;
    return [
      ...products.filter((p) => preferred.includes(p.category)),
      ...products.filter((p) => !preferred.includes(p.category)),
    ];
  }, [onboarding.shoppingCategories]);

  const filtered = useMemo(() => {
    return preferredFirst.filter((p) => {
      const matchCat = activeCategory === 'All' || p.category === activeCategory;
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [preferredFirst, activeCategory, search]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Shop</Text>
        <TouchableOpacity style={styles.cartBtn} onPress={() => router.push('/shop/cart')}>
          <Text style={styles.cartEmoji}>🛒</Text>
          {itemCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{itemCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <TextInput
          style={styles.search}
          placeholder="Search products..."
          placeholderTextColor={Colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Category filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterContent}>
        {(['All', ...ALL_CATEGORIES] as const).map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[styles.filterChip, activeCategory === cat && styles.filterChipActive]}
            onPress={() => setActiveCategory(cat)}
          >
            <Text style={[styles.filterChipText, activeCategory === cat && styles.filterChipTextActive]}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Product grid */}
      <FlatList
        data={filtered}
        keyExtractor={(p) => p.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 80 }]}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <ProductCard
            product={item}
            onPress={() => router.push({ pathname: '/shop/[id]', params: { id: item.id } })}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No products found</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  title: { fontSize: 28, fontWeight: '800', color: Colors.textPrimary },
  cartBtn: { position: 'relative', padding: 4 },
  cartEmoji: { fontSize: 26 },
  badge: {
    position: 'absolute', top: -2, right: -4,
    backgroundColor: Colors.shop, borderRadius: Radius.full,
    minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3,
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  searchWrap: { paddingHorizontal: Spacing.lg, marginBottom: Spacing.sm },
  search: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    color: Colors.textPrimary,
    fontSize: 15,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterScroll: { marginBottom: Spacing.sm },
  filterContent: { paddingHorizontal: Spacing.lg, gap: Spacing.sm },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.full,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: { backgroundColor: Colors.accentGlow, borderColor: Colors.accent },
  filterChipText: { color: Colors.textSecondary, fontSize: 13, fontWeight: '500' },
  filterChipTextActive: { color: Colors.accentLight, fontWeight: '600' },
  list: { paddingHorizontal: Spacing.lg },
  row: { gap: Spacing.sm, marginBottom: Spacing.sm },
  card: {
    flex: 1,
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardImage: {
    height: 110,
    backgroundColor: Colors.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardImageEmoji: { fontSize: 44 },
  cardBody: { padding: Spacing.sm + 2 },
  cardName: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary, marginBottom: 4, lineHeight: 18 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 6 },
  cardRating: { fontSize: 12, color: Colors.warning },
  cardReviews: { fontSize: 11, color: Colors.textMuted },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardPrice: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  addBtn: {
    width: 28, height: 28, borderRadius: Radius.full,
    backgroundColor: Colors.shop, alignItems: 'center', justifyContent: 'center',
  },
  addBtnText: { color: '#fff', fontSize: 18, fontWeight: '700', lineHeight: 22 },
  empty: { alignItems: 'center', paddingTop: Spacing.xxl },
  emptyText: { color: Colors.textMuted, fontSize: 15 },
});
