export type ProductCategory =
  | "Clothes"
  | "Electronics"
  | "Home Goods"
  | "Beauty"
  | "Sports";

export type Size = "XS" | "S" | "M" | "L" | "XL";

export const SIZES: readonly Size[] = ["XS", "S", "M", "L", "XL"] as const;

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
  | "Italian"
  | "Chicken"
  | "Sandwiches"
  | "Wings"
  | "Indian"
  | "Mediterranean"
  | "Korean"
  | "Thai"
  | "Breakfast"
  | "Healthy"
  | "Seafood"
  | "Desserts";

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
  imageUrl?: string;
  menu: MenuItem[];
};

export type Sport =
  | "Football"
  | "Basketball"
  | "Baseball"
  | "Hockey"
  | "College Football"
  | "College Basketball"
  | "Soccer"
  | "Boxing"
  | "MMA"
  | "Golf";

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
  homeTeamAbbr: string;
  awayTeamAbbr: string;
  homeTeamColor: string;
  awayTeamColor: string;
  startsAt: string;
  peopleBetting: number;
  isLive: boolean;
  liveScore: string | null;
  livePeriod: string | null;
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
