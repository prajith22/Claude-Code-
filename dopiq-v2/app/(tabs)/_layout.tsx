import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCart } from '@/store/useCart';
import { Colors, Radius } from '@/constants/theme';

function TabIcon({ label, emoji, focused, badge }: {
  label: string;
  emoji: string;
  focused: boolean;
  badge?: number;
}) {
  return (
    <View style={styles.iconWrap}>
      <View style={styles.emojiWrap}>
        <Text style={[styles.emoji, focused && styles.emojiFocused]}>{emoji}</Text>
        {badge != null && badge > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge > 9 ? '9+' : badge}</Text>
          </View>
        )}
      </View>
      <Text style={[styles.label, focused && styles.labelFocused]}>{label}</Text>
    </View>
  );
}

export default function TabLayout() {
  const { itemCount } = useCart();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon label="Home" emoji="🏠" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="shop"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon label="Shop" emoji="🛍️" focused={focused} badge={itemCount} />
          ),
        }}
      />
      <Tabs.Screen
        name="food"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon label="Food" emoji="🍔" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="bet"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon label="Bet" emoji="🏈" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="tracker"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon label="Tracker" emoji="📊" focused={focused} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.bgCard,
    borderTopColor: Colors.border,
    borderTopWidth: 1,
    height: 80,
    paddingBottom: 0,
  },
  iconWrap: { alignItems: 'center', paddingTop: 8 },
  emojiWrap: { position: 'relative' },
  emoji: { fontSize: 24, opacity: 0.5 },
  emojiFocused: { opacity: 1 },
  badge: {
    position: 'absolute',
    top: -4,
    right: -10,
    backgroundColor: Colors.accent,
    borderRadius: Radius.full,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  label: { fontSize: 11, color: Colors.textMuted, marginTop: 4 },
  labelFocused: { color: Colors.textPrimary, fontWeight: '600' },
});
