import { View, Text, StyleSheet, SectionList, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFoodCart } from '@/store/useFoodCart';
import { Colors, Spacing, Radius } from '@/constants/theme';
import { Restaurant, MenuItem } from '@/store/types';
import restaurantsData from '@/data/restaurants.json';

const restaurants = restaurantsData as Restaurant[];
const CATEGORY_ORDER = ['appetizer', 'main', 'drink', 'dessert'] as const;
const CATEGORY_LABEL: Record<string, string> = {
  appetizer: 'Appetizers', main: 'Mains', drink: 'Drinks', dessert: 'Desserts',
};

function MenuItemRow({ item, restaurantId, restaurantName }: {
  item: MenuItem;
  restaurantId: string;
  restaurantName: string;
}) {
  const { addItem, items } = useFoodCart();
  const inCart = items.find((i) => i.menuItem.id === item.id);

  return (
    <View style={styles.menuRow}>
      <View style={styles.menuInfo}>
        <Text style={styles.menuName}>{item.name}</Text>
        <Text style={styles.menuDesc} numberOfLines={2}>{item.description}</Text>
        <Text style={styles.menuPrice}>${item.price.toFixed(2)}</Text>
      </View>
      <TouchableOpacity
        style={[styles.addBtn, inCart && styles.addBtnActive]}
        onPress={() => addItem(item, restaurantId, restaurantName)}
        activeOpacity={0.8}
      >
        <Text style={styles.addBtnText}>{inCart ? `${inCart.quantity}+` : '+'}</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function RestaurantScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { itemCount, subtotal } = useFoodCart();

  const restaurant = restaurants.find((r) => r.id === id);
  if (!restaurant) return null;

  const sections = CATEGORY_ORDER
    .map((cat) => ({
      title: CATEGORY_LABEL[cat],
      data: restaurant.menu.filter((m) => m.category === cat),
    }))
    .filter((s) => s.data.length > 0);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Nav */}
      <View style={styles.nav}>
        <TouchableOpacity onPress={() => router.back()}><Text style={styles.back}>‹ Back</Text></TouchableOpacity>
      </View>

      {/* Hero */}
      <View style={styles.hero}>
        <Text style={styles.heroEmoji}>
          {({ Pizza: '🍕', Chinese: '🥡', Mexican: '🌮', Burgers: '🍔', Sushi: '🍣', Italian: '🍝' } as Record<string, string>)[restaurant.cuisine]}
        </Text>
        <Text style={styles.heroName}>{restaurant.name}</Text>
        <View style={styles.heroMeta}>
          <Text style={styles.heroMetaItem}>★ {restaurant.rating}</Text>
          <Text style={styles.heroMetaDot}>·</Text>
          <Text style={styles.heroMetaItem}>{restaurant.deliveryTime}</Text>
          <Text style={styles.heroMetaDot}>·</Text>
          <Text style={styles.heroMetaItem}>
            {restaurant.deliveryFee === 0 ? 'Free delivery' : `$${restaurant.deliveryFee.toFixed(2)} delivery`}
          </Text>
        </View>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={[styles.list, { paddingBottom: itemCount > 0 ? 140 : 80 }]}
        showsVerticalScrollIndicator={false}
        renderSectionHeader={({ section }) => (
          <Text style={styles.sectionHeader}>{section.title}</Text>
        )}
        renderItem={({ item }) => (
          <MenuItemRow item={item} restaurantId={restaurant.id} restaurantName={restaurant.name} />
        )}
      />

      {/* Cart bar */}
      {itemCount > 0 && (
        <View style={[styles.cartBar, { paddingBottom: insets.bottom + Spacing.sm }]}>
          <View style={styles.cartBarInner}>
            <Text style={styles.cartBarCount}>{itemCount} item{itemCount !== 1 ? 's' : ''}</Text>
            <TouchableOpacity style={styles.cartBarBtn} onPress={() => router.push('/food/cart')} activeOpacity={0.85}>
              <Text style={styles.cartBarBtnText}>View Cart · ${subtotal.toFixed(2)}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  nav: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm },
  back: { color: Colors.food, fontSize: 17 },
  hero: {
    alignItems: 'center', paddingVertical: Spacing.lg,
    backgroundColor: Colors.bgCard, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  heroEmoji: { fontSize: 52, marginBottom: Spacing.sm },
  heroName: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary, marginBottom: 6 },
  heroMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  heroMetaItem: { color: Colors.textSecondary, fontSize: 13 },
  heroMetaDot: { color: Colors.textMuted },
  list: { paddingHorizontal: Spacing.lg },
  sectionHeader: {
    fontSize: 13, fontWeight: '700', color: Colors.textMuted,
    letterSpacing: 0.8, textTransform: 'uppercase',
    paddingTop: Spacing.lg, paddingBottom: Spacing.sm,
  },
  menuRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.bgCard, borderRadius: Radius.md,
    padding: Spacing.md, marginBottom: Spacing.sm,
    borderWidth: 1, borderColor: Colors.border,
  },
  menuInfo: { flex: 1 },
  menuName: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary, marginBottom: 2 },
  menuDesc: { fontSize: 13, color: Colors.textSecondary, lineHeight: 18, marginBottom: 6 },
  menuPrice: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  addBtn: {
    width: 36, height: 36, borderRadius: Radius.full,
    backgroundColor: Colors.food, alignItems: 'center', justifyContent: 'center',
  },
  addBtnActive: { backgroundColor: Colors.accentDark },
  addBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  cartBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: Colors.bgCard, borderTopWidth: 1, borderTopColor: Colors.border,
    paddingHorizontal: Spacing.lg, paddingTop: Spacing.md,
  },
  cartBarInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cartBarCount: { color: Colors.textSecondary, fontSize: 14 },
  cartBarBtn: {
    backgroundColor: Colors.food, borderRadius: Radius.lg,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm + 2,
  },
  cartBarBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
