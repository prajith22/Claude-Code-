import { useStorage } from '@/hooks/useStorage';
import { FoodCartItem, MenuItem } from './types';

export function useFoodCart() {
  const { value: items, set } = useStorage<FoodCartItem[]>('food_cart', []);

  const addItem = (menuItem: MenuItem, restaurantId: string, restaurantName: string) => {
    set((prev) => {
      // Clear cart if switching restaurants
      const differentRestaurant = prev.length > 0 && prev[0].restaurantId !== restaurantId;
      const base = differentRestaurant ? [] : prev;
      const existing = base.find((i) => i.menuItem.id === menuItem.id);
      if (existing) {
        return base.map((i) =>
          i.menuItem.id === menuItem.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...base, { menuItem, quantity: 1, restaurantId, restaurantName }];
    });
  };

  const removeItem = (menuItemId: string) => {
    set((prev) => prev.filter((i) => i.menuItem.id !== menuItemId));
  };

  const updateQuantity = (menuItemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(menuItemId);
      return;
    }
    set((prev) =>
      prev.map((i) => (i.menuItem.id === menuItemId ? { ...i, quantity } : i))
    );
  };

  const clearCart = () => set([]);

  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = items.reduce((sum, i) => sum + i.menuItem.price * i.quantity, 0);
  const restaurantName = items[0]?.restaurantName ?? '';

  return { items, addItem, removeItem, updateQuantity, clearCart, itemCount, subtotal, restaurantName };
}
