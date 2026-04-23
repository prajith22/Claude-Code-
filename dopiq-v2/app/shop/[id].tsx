import { ScrollView, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCart } from '@/store/useCart';
import { Colors, Spacing, Radius } from '@/constants/theme';
import { Product } from '@/store/types';
import productsData from '@/data/products.json';

const products = productsData as Product[];

const FAKE_REVIEWS = [
  { author: 'Alex M.', rating: 5, text: 'Absolutely love this! Exceeded my expectations.' },
  { author: 'Jordan K.', rating: 4, text: 'Great quality for the price. Would recommend.' },
  { author: 'Sam T.', rating: 5, text: 'Bought this as a gift and they were thrilled.' },
  { author: 'Riley P.', rating: 4, text: 'Good product, fast shipping, happy with it.' },
];

function Stars({ rating }: { rating: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Text key={i} style={{ color: i <= Math.round(rating) ? Colors.warning : Colors.textMuted, fontSize: 14 }}>★</Text>
      ))}
    </View>
  );
}

export default function ProductDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { addToCart, items } = useCart();

  const product = products.find((p) => p.id === id);
  if (!product) return null;

  const inCart = items.find((i) => i.product.id === id);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Nav */}
      <View style={styles.nav}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/shop/cart')} style={styles.cartBtn}>
          <Text style={styles.cartText}>🛒 Cart</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Image */}
        <View style={styles.imageBg}>
          <Text style={styles.imageEmoji}>
            {({ Clothes: '👗', Electronics: '📱', 'Home Goods': '🏠', Beauty: '✨', Sports: '🏋️' } as Record<string, string>)[product.category] ?? '📦'}
          </Text>
        </View>

        <View style={styles.body}>
          <Text style={styles.category}>{product.category}</Text>
          <Text style={styles.name}>{product.name}</Text>

          <View style={styles.ratingRow}>
            <Stars rating={product.rating} />
            <Text style={styles.ratingNum}>{product.rating}</Text>
            <Text style={styles.reviewCount}>({product.reviewCount.toLocaleString()} reviews)</Text>
          </View>

          <Text style={styles.price}>${product.price.toFixed(2)}</Text>

          <Text style={styles.descLabel}>About this item</Text>
          <Text style={styles.desc}>{product.description}</Text>

          {/* Fake reviews */}
          <Text style={styles.reviewsLabel}>Customer Reviews</Text>
          {FAKE_REVIEWS.map((r) => (
            <View key={r.author} style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{r.author[0]}</Text>
                </View>
                <View>
                  <Text style={styles.reviewAuthor}>{r.author}</Text>
                  <Stars rating={r.rating} />
                </View>
              </View>
              <Text style={styles.reviewText}>{r.text}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Add to cart */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.sm }]}>
        <TouchableOpacity
          style={[styles.cta, inCart ? styles.ctaSecondary : styles.ctaPrimary]}
          onPress={() => {
            addToCart(product);
            router.push('/shop/cart');
          }}
          activeOpacity={0.85}
        >
          <Text style={[styles.ctaText, inCart && styles.ctaTextSecondary]}>
            {inCart ? `Add Another (${inCart.quantity} in cart)` : 'Add to Cart'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  nav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  backBtn: { padding: 4 },
  backText: { color: Colors.shop, fontSize: 17 },
  cartBtn: { padding: 4 },
  cartText: { color: Colors.shop, fontSize: 15, fontWeight: '600' },
  imageBg: {
    height: 220,
    backgroundColor: Colors.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageEmoji: { fontSize: 88 },
  body: { padding: Spacing.lg },
  category: { color: Colors.shop, fontSize: 13, fontWeight: '600', marginBottom: 4 },
  name: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary, marginBottom: Spacing.sm },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: Spacing.sm },
  ratingNum: { color: Colors.textPrimary, fontSize: 14, fontWeight: '600' },
  reviewCount: { color: Colors.textSecondary, fontSize: 13 },
  price: { fontSize: 30, fontWeight: '800', color: Colors.textPrimary, marginBottom: Spacing.lg },
  descLabel: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.sm },
  desc: { fontSize: 14, color: Colors.textSecondary, lineHeight: 22, marginBottom: Spacing.xl },
  reviewsLabel: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.md },
  reviewCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
  avatar: {
    width: 32, height: 32, borderRadius: Radius.full,
    backgroundColor: Colors.accentGlow, alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: Colors.accentLight, fontWeight: '700', fontSize: 14 },
  reviewAuthor: { color: Colors.textPrimary, fontWeight: '600', fontSize: 13, marginBottom: 2 },
  reviewText: { color: Colors.textSecondary, fontSize: 13, lineHeight: 20 },
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.bg,
  },
  cta: {
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md + 2,
    alignItems: 'center',
  },
  ctaPrimary: { backgroundColor: Colors.shop },
  ctaSecondary: { backgroundColor: Colors.bgCard, borderWidth: 1.5, borderColor: Colors.shop },
  ctaText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  ctaTextSecondary: { color: Colors.shop },
});
