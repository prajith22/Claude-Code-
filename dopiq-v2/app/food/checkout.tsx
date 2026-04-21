import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFoodCart } from '@/store/useFoodCart';
import { Colors, Spacing, Radius } from '@/constants/theme';

export default function FoodCheckoutScreen() {
  const insets = useSafeAreaInsets();
  const { items, subtotal, restaurantName, clearCart } = useFoodCart();
  const deliveryFee = 2.99;
  const total = subtotal + deliveryFee;

  const handlePlaceOrder = () => {
    clearCart();
    router.replace('/food/tracker-delivery');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.nav}>
        <TouchableOpacity onPress={() => router.back()}><Text style={styles.back}>‹ Back</Text></TouchableOpacity>
        <Text style={styles.navTitle}>Checkout</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 160 }}>
        {/* Delivery address */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Address</Text>
          <View style={styles.sectionCard}>
            <Text style={styles.sectionValue}>🏠  123 Maple Street, Apt 4B</Text>
            <Text style={styles.sectionSub}>San Francisco, CA 94110</Text>
          </View>
        </View>

        {/* Payment */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment</Text>
          <View style={styles.sectionCard}>
            <Text style={styles.sectionValue}>💳  •••• •••• •••• 4242 (Visa)</Text>
          </View>
        </View>

        {/* Order summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order from {restaurantName}</Text>
          <View style={styles.sectionCard}>
            {items.map((i) => (
              <View key={i.menuItem.id} style={styles.orderItem}>
                <Text style={styles.orderItemName}>{i.menuItem.name} × {i.quantity}</Text>
                <Text style={styles.orderItemPrice}>${(i.menuItem.price * i.quantity).toFixed(2)}</Text>
              </View>
            ))}
            <View style={styles.divider} />
            <View style={styles.orderItem}>
              <Text style={styles.orderItemLabel}>Subtotal</Text>
              <Text style={styles.orderItemPrice}>${subtotal.toFixed(2)}</Text>
            </View>
            <View style={styles.orderItem}>
              <Text style={styles.orderItemLabel}>Delivery fee</Text>
              <Text style={styles.orderItemPrice}>${deliveryFee.toFixed(2)}</Text>
            </View>
            <View style={[styles.orderItem, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.sm }]}>
        <Text style={styles.footerNote}>🔒 Simulation only. No real payment.</Text>
        <TouchableOpacity style={styles.orderBtn} onPress={handlePlaceOrder} activeOpacity={0.85}>
          <Text style={styles.orderBtnText}>Place Order</Text>
        </TouchableOpacity>
      </View>
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
  navTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  section: { paddingHorizontal: Spacing.lg, marginTop: Spacing.lg },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: Colors.textMuted, letterSpacing: 0.8, marginBottom: Spacing.sm, textTransform: 'uppercase' },
  sectionCard: {
    backgroundColor: Colors.bgCard, borderRadius: Radius.lg,
    padding: Spacing.md, borderWidth: 1, borderColor: Colors.border,
  },
  sectionValue: { color: Colors.textPrimary, fontSize: 15, fontWeight: '500', marginBottom: 2 },
  sectionSub: { color: Colors.textSecondary, fontSize: 13 },
  orderItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  orderItemName: { color: Colors.textSecondary, fontSize: 14, flex: 1 },
  orderItemLabel: { color: Colors.textSecondary, fontSize: 14 },
  orderItemPrice: { color: Colors.textPrimary, fontSize: 14, fontWeight: '600' },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: Spacing.sm },
  totalRow: { borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: Spacing.sm, marginTop: Spacing.xs },
  totalLabel: { color: Colors.textPrimary, fontSize: 16, fontWeight: '700' },
  totalValue: { color: Colors.textPrimary, fontSize: 16, fontWeight: '800' },
  footer: {
    paddingHorizontal: Spacing.lg, paddingTop: Spacing.md,
    borderTopWidth: 1, borderTopColor: Colors.border, backgroundColor: Colors.bg,
  },
  footerNote: { color: Colors.textMuted, fontSize: 12, textAlign: 'center', marginBottom: Spacing.sm },
  orderBtn: {
    backgroundColor: Colors.food, borderRadius: Radius.lg,
    paddingVertical: Spacing.md + 2, alignItems: 'center',
  },
  orderBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
