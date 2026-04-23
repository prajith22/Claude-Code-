import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCart } from '@/store/useCart';
import { Colors, Spacing, Radius } from '@/constants/theme';

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionCard}>{children}</View>
    </View>
  );
}

export default function CheckoutScreen() {
  const insets = useSafeAreaInsets();
  const { items, subtotal, clearCart } = useCart();

  const orderNum = `DPQ-${Math.floor(100000 + Math.random() * 900000)}`;

  const handlePlaceOrder = () => {
    clearCart();
    router.replace({ pathname: '/shop/confirmed', params: { orderNum } });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Nav */}
      <View style={styles.nav}>
        <TouchableOpacity onPress={() => router.back()}><Text style={styles.back}>‹ Back</Text></TouchableOpacity>
        <Text style={styles.navTitle}>Checkout</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 160 }}>
        <Section title="Delivery Address">
          <Row label="Name" value="Alex Johnson" />
          <Row label="Address" value="123 Maple Street, Apt 4B" />
          <Row label="City" value="San Francisco, CA 94110" />
          <Row label="Country" value="United States" />
        </Section>

        <Section title="Payment Method">
          <Row label="Card" value="•••• •••• •••• 4242" />
          <Row label="Type" value="Visa" />
          <Row label="Expires" value="08 / 28" />
        </Section>

        <Section title="Order Summary">
          {items.map((i) => (
            <View key={i.product.id} style={styles.orderItem}>
              <Text style={styles.orderItemName} numberOfLines={1}>{i.product.name} × {i.quantity}</Text>
              <Text style={styles.orderItemPrice}>${(i.product.price * i.quantity).toFixed(2)}</Text>
            </View>
          ))}
          <View style={styles.divider} />
          <Row label="Subtotal" value={`$${subtotal.toFixed(2)}`} />
          <Row label="Shipping" value="FREE" />
          <Row label="Tax (8%)" value={`$${(subtotal * 0.08).toFixed(2)}`} />
          <View style={[styles.infoRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>${(subtotal * 1.08).toFixed(2)}</Text>
          </View>
        </Section>
      </ScrollView>

      {/* Place order */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.sm }]}>
        <Text style={styles.footerNote}>
          🔒 This is a simulation. No real payment will be made.
        </Text>
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
  back: { color: Colors.shop, fontSize: 17, width: 60 },
  navTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  section: { paddingHorizontal: Spacing.lg, marginTop: Spacing.lg },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: Colors.textMuted, letterSpacing: 0.8, marginBottom: Spacing.sm, textTransform: 'uppercase' },
  sectionCard: {
    backgroundColor: Colors.bgCard, borderRadius: Radius.lg,
    padding: Spacing.md, borderWidth: 1, borderColor: Colors.border,
  },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5 },
  infoLabel: { color: Colors.textSecondary, fontSize: 14 },
  infoValue: { color: Colors.textPrimary, fontSize: 14, fontWeight: '500', maxWidth: '60%', textAlign: 'right' },
  orderItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  orderItemName: { color: Colors.textSecondary, fontSize: 14, flex: 1 },
  orderItemPrice: { color: Colors.textPrimary, fontSize: 14, fontWeight: '600' },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: Spacing.sm },
  totalRow: { paddingTop: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.border, marginTop: Spacing.xs },
  totalLabel: { color: Colors.textPrimary, fontSize: 16, fontWeight: '700' },
  totalValue: { color: Colors.textPrimary, fontSize: 16, fontWeight: '800' },
  footer: {
    paddingHorizontal: Spacing.lg, paddingTop: Spacing.md,
    borderTopWidth: 1, borderTopColor: Colors.border, backgroundColor: Colors.bg,
  },
  footerNote: { color: Colors.textMuted, fontSize: 12, textAlign: 'center', marginBottom: Spacing.sm },
  orderBtn: {
    backgroundColor: Colors.shop, borderRadius: Radius.lg,
    paddingVertical: Spacing.md + 2, alignItems: 'center',
  },
  orderBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
