export type ProductCategory =
  | "Clothes"
  | "Electronics"
  | "Home Goods"
  | "Beauty"
  | "Sports";

export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  category: ProductCategory;
  rating: number;
  reviewCount: number;
  imageUrl: string;
};

export type Cuisine =
  | "Pizza"
  | "Chinese"
  | "Mexican"
  | "Burgers"
  | "Sushi"
  | "Italian";

export type OrderSize = "Just me" | "Me + 1" | "Group order";

export type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
};

export type Restaurant = {
  id: string;
  name: string;
  cuisine: Cuisine;
  rating: number;
  deliveryTime: string;
  deliveryFee: number;
  imageUrl: string;
  menu: MenuItem[];
};

export type Sport = "NFL" | "NBA";

export type GameOdds = {
  moneylineHome: number;
  moneylineAway: number;
  spreadHome: number;
  spreadHomeOdds: number;
  spreadAway: number;
  spreadAwayOdds: number;
  total: number;
  overOdds: number;
  underOdds: number;
};

export type Game = {
  id: string;
  sport: Sport;
  homeTeam: string;
  awayTeam: string;
  startsAt: string;
  odds: GameOdds;
};

export type BetType = "moneyline" | "spread" | "over_under";

export type BetSelection =
  | { type: "moneyline"; side: "home" | "away" }
  | { type: "spread"; side: "home" | "away" }
  | { type: "over_under"; side: "over" | "under" };

export type FoodPrefs = {
  cuisines: Cuisine[];
  orderSize: OrderSize;
};

export type ShoppingPrefs = ProductCategory[];

export type SpendingCategory = "Shopping" | "Food" | "Gambling" | "Other";

export type SpendingEntry = {
  id: string;
  amount: number;
  category: SpendingCategory;
  note: string | null;
  date: string;
};
