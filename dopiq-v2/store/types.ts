export type ShoppingCategory = 'Clothes' | 'Electronics' | 'Home Goods' | 'Beauty' | 'Sports';
export type FoodCuisine = 'Pizza' | 'Chinese' | 'Mexican' | 'Burgers' | 'Sushi' | 'Italian';
export type OrderSize = 'Just me' | 'Me + 1' | 'Group order';
export type Sport = 'NFL' | 'NBA';

export interface OnboardingAnswers {
  shoppingCategories: ShoppingCategory[];
  foodCuisines: FoodCuisine[];
  orderSize: OrderSize;
  sports: Sport[];
  completed: boolean;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: ShoppingCategory;
  rating: number;
  reviewCount: number;
  image: string | null;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: 'appetizer' | 'main' | 'drink' | 'dessert';
}

export interface Restaurant {
  id: string;
  name: string;
  cuisine: FoodCuisine;
  rating: number;
  deliveryTime: string;
  deliveryFee: number;
  menu: MenuItem[];
}

export interface FoodCartItem {
  menuItem: MenuItem;
  quantity: number;
  restaurantId: string;
  restaurantName: string;
}

export type BetType = 'moneyline' | 'spread' | 'over_under';
export type BetStatus = 'pending' | 'won' | 'lost' | 'push';

export interface PlacedBet {
  id: string;
  gameId: string;
  homeTeam: string;
  awayTeam: string;
  sport: Sport;
  betType: BetType;
  selection: string;
  odds: number;
  stake: number;
  potentialPayout: number;
  status: BetStatus;
  placedAt: string;
  resolvedAt?: string;
  profit?: number;
}

export type TrackerCategory = 'Shopping' | 'Food' | 'Gambling' | 'Other';

export interface SpendEntry {
  id: string;
  amount: number;
  category: TrackerCategory;
  date: string;
  note?: string;
}
