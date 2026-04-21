import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCart } from '@/store/useCart';
import { Colors, Spacing, Radius } from '@/constants/theme';
import { CartItem } from '@/store/types';

function CartRow({ item, onInc, onDec, onRemove }: {
  item: CartItem;
  onInc: () => void;
  onDec: () => void;
  onRemove: () => void;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.rowImage}>
        <Text style={styles.rowEmoji}>
          {({ Clothes: '👗', Electronics: '📱', 'Home Goods': '🏠', Beauty: '✨', Sports: '🏋️' } as Record<string, string>)[item.product.category] ?? '📦'}
        </Text>
      </View>
      <View style={styles.rowInfo}>
        <Text style={styles.rowName} numberOfLines={2}>{item.product.name}</Text>
        <Text style={styles.rowPrice}>${(item.product.price * item.quantity).toFixed(2)}</Text>
        <View style={styles.qtyRow}>
          <TouchableOpacity style={styles.qtyBtn} onPress={onDec}><Text style={styles.qtyBtnText}>−</Text></TouchableOpacity>
          <Text style={styles.qtyNum}>{item.quantity}</Text>
          <TouchableOpacity style={styles.qtyBtn} onPress={onInc}><Text style={styles.qtyBtnText}>+</Text></TouchableOpacity>
          <TouchableOpacity style={styles.removeBtn} onPress={onRemove}>
            <Text style={styles.removeBtnText}>Remove</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

export default function CartScreen() {
  const insets = useSafeAreaInsets();
  const { items, updateQuantity, removeFromCart, subtotal, itemCount } = useCart();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Nav */}
      <View style={styles.nav}>
        <TouchableOpacity onPress={() => router.back()}><Text style={styles.back}>‹ Back</Text></TouchableOpacity>
        <Text style={styles.title}>Cart</Text>
        <View style={{ width: 60 }} />
      </View>

      {items.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>🛒</Text>
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptySubt}>Add some items from the shop</Text>
          <TouchableOpacity style={styles.shopBtn} onPress={() => router.back()}>
            <Text style={styles.shopBtnText}>Browse Products</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <FlatList
            data={items}
            keyExtractor={(i) => i.product.id}
            contentContainerStyle={[styles.list, { paddingBottom: 160 }]}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <CartRow
                item={item}
                onInc={() => updateQuantity(item.product.id, item.quantity + 1)}
                onDec={() => updateQuantity(item.product.id, item.quantity - 1)}
                onRemove={() => removeFromCart(item.product.id)}
              />
            )}
          />

          {/* Summary */}
          <View style={[styles.summary, { paddingBottom: insets.bottom + Spacing.sm }]}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal ({itemCount} items)</Text>
              <Text style={styles.summaryValue}>${subtotal.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Shipping</Text>
              <Text style={[styles.summaryValue, { color: Colors.success }]}>FREE</Text>
            </View>
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>${subtotal.toFixed(2)}</Text>
            </View>
            <TouchableOpacity style={styles.checkoutBtn} onPress={() => router.push('/shop/checkout')} activeOpacity={0.85}>
              <Text style={styles.checkoutBtnText}>Proceed to Checkout</Text>
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
  back: { color: Colors.shop, fontSize: 17, width: 60 },
  title: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  list: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md },
  row: {
    flexDirection: 'row', gap: Spacing.md,
    backgroundColor: Colors.bgCard, borderRadius: Radius.lg,
    padding: Spacing.md, marginBottom: Spacing.sm,
    borderWidth: 1, borderColor: Colors.border,
  },
  rowImage: {
    width: 64, height: 64, borderRadius: Radius.md,
    backgroundColor: Colors.bgElevated, alignItems: 'center', justifyContent: 'center',
  },
  rowEmoji: { fontSize: 30 },
  rowInfo: { flex: 1 },
  rowName: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary, marginBottom: 4 },
  rowPrice: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary, marginBottom: 6 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  qtyBtn: {
    width: 28, height: 28, borderRadius: Radius.full,
    backgroundColor: Colors.bgElevated, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },
  qtyBtnText: { color: Colors.textPrimary, fontSize: 16, fontWeight: '700' },
  qtyNum: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, minWidth: 20, textAlign: 'center' },
  removeBtn: { flex: 1, alignItems: 'flex-end' },
  removeBtnText: { color: Colors.error, fontSize: 12 },
  summary: {
    paddingHorizontal: Spacing.lg, paddingTop: Spacing.md,
    borderTopWidth: 1, borderTopColor: Colors.border,
    backgroundColor: Colors.bgCard,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.sm },
  summaryLabel: { color: Colors.textSecondary, fontSize: 14 },
  summaryValue: { color: Colors.textPrimary, fontSize: 14, fontWeight: '600' },
  totalRow: { borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: Spacing.sm, marginBottom: Spacing.md },
  totalLabel: { color: Colors.textPrimary, fontSize: 17, fontWeight: '700' },
  totalValue: { color: Colors.textPrimary, fontSize: 17, fontWeight: '800' },
  checkoutBtn: {
    backgroundColor: Colors.shop, borderRadius: Radius.lg,
    paddingVertical: Spacing.md + 2, alignItems: 'center', marginBottom: Spacing.sm,
  },
  checkoutBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.sm },
  emptyEmoji: { fontSize: 64, marginBottom: Spacing.sm },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary },
  emptySubt: { fontSize: 14, color: Colors.textSecondary },
  shopBtn: {
    marginTop: Spacing.md, backgroundColor: Colors.shop,
    borderRadius: Radius.lg, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md,
  },
  shopBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
