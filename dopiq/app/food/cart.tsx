import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFoodCart } from '@/store/useFoodCart';
import { Colors, Spacing, Radius } from '@/constants/theme';

export default function FoodCartScreen() {
  const insets = useSafeAreaInsets();
  const { items, updateQuantity, removeItem, subtotal, itemCount, restaurantName } = useFoodCart();

  const deliveryFee = 2.99;
  const total = subtotal + deliveryFee;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.nav}>
        <TouchableOpacity onPress={() => router.back()}><Text style={styles.back}>‹ Back</Text></TouchableOpacity>
        <Text style={styles.title}>Your Order</Text>
        <View style={{ width: 60 }} />
      </View>

      {restaurantName ? (
        <Text style={styles.restaurant}>from {restaurantName}</Text>
      ) : null}

      {items.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>🍔</Text>
          <Text style={styles.emptyTitle}>No items yet</Text>
          <TouchableOpacity style={styles.browseBtn} onPress={() => router.back()}>
            <Text style={styles.browseBtnText}>Browse Restaurants</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <FlatList
            data={items}
            keyExtractor={(i) => i.menuItem.id}
            contentContainerStyle={[styles.list, { paddingBottom: 200 }]}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <View style={styles.row}>
                <View style={styles.rowInfo}>
                  <Text style={styles.rowName}>{item.menuItem.name}</Text>
                  <Text style={styles.rowPrice}>${(item.menuItem.price * item.quantity).toFixed(2)}</Text>
                </View>
                <View style={styles.qtyRow}>
                  <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQuantity(item.menuItem.id, item.quantity - 1)}>
                    <Text style={styles.qtyBtnText}>−</Text>
                  </TouchableOpacity>
                  <Text style={styles.qtyNum}>{item.quantity}</Text>
                  <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQuantity(item.menuItem.id, item.quantity + 1)}>
                    <Text style={styles.qtyBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />

          <View style={[styles.summary, { paddingBottom: insets.bottom + Spacing.sm }]}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>${subtotal.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Delivery fee</Text>
              <Text style={styles.summaryValue}>${deliveryFee.toFixed(2)}</Text>
            </View>
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
            </View>
            <TouchableOpacity style={styles.checkoutBtn} onPress={() => router.push('/food/checkout')} activeOpacity={0.85}>
              <Text style={styles.checkoutBtnText}>Go to Checkout</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
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
  back: { color: Colors.food, fontSize: 17, width: 60 },
  title: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  restaurant: { color: Colors.food, fontSize: 13, textAlign: 'center', paddingTop: Spacing.sm },
  list: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md },
  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.bgCard, borderRadius: Radius.md,
    padding: Spacing.md, marginBottom: Spacing.sm,
    borderWidth: 1, borderColor: Colors.border,
  },
  rowInfo: { flex: 1 },
  rowName: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary, marginBottom: 2 },
  rowPrice: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  qtyBtn: {
    width: 28, height: 28, borderRadius: Radius.full,
    backgroundColor: Colors.bgElevated, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },
  qtyBtnText: { color: Colors.textPrimary, fontSize: 16, fontWeight: '700' },
  qtyNum: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, minWidth: 20, textAlign: 'center' },
  summary: {
    paddingHorizontal: Spacing.lg, paddingTop: Spacing.md,
    borderTopWidth: 1, borderTopColor: Colors.border, backgroundColor: Colors.bgCard,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.sm },
  summaryLabel: { color: Colors.textSecondary, fontSize: 14 },
  summaryValue: { color: Colors.textPrimary, fontSize: 14, fontWeight: '600' },
  totalRow: { borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: Spacing.sm, marginBottom: Spacing.md },
  totalLabel: { color: Colors.textPrimary, fontSize: 17, fontWeight: '700' },
  totalValue: { color: Colors.textPrimary, fontSize: 17, fontWeight: '800' },
  checkoutBtn: {
    backgroundColor: Colors.food, borderRadius: Radius.lg,
    paddingVertical: Spacing.md + 2, alignItems: 'center', marginBottom: Spacing.sm,
  },
  checkoutBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.sm },
  emptyEmoji: { fontSize: 56, marginBottom: Spacing.sm },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  browseBtn: {
    marginTop: Spacing.md, backgroundColor: Colors.food,
    borderRadius: Radius.lg, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md,
  },
  browseBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
