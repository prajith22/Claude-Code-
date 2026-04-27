export type QuickSimLocation = {
  key: "gas" | "convenience" | "grocery" | "coffee";
  emoji: string;
  name: string;
  subtitle: string;
};

export type QuickSimIconKey =
  | "drink"
  | "snack"
  | "food"
  | "candy"
  | "scratch"
  | "accessory"
  | "magazine"
  | "flower"
  | "candle"
  | "coffee";

export type QuickSimItem = {
  id: string;
  name: string;
  iconKey: QuickSimIconKey;
  priceCents: number;
};

export const QUICK_SIM_LOCATIONS: QuickSimLocation[] = [
  {
    key: "gas",
    emoji: "⛽",
    name: "Gas Station",
    subtitle: "Snacks, drinks, random grabs",
  },
  {
    key: "convenience",
    emoji: "🏪",
    name: "Convenience Store",
    subtitle: "Quick picks on the go",
  },
  {
    key: "grocery",
    emoji: "🛒",
    name: "Grocery Store",
    subtitle: "Checkout lane temptations",
  },
  {
    key: "coffee",
    emoji: "☕",
    name: "Coffee Shop",
    subtitle: "That overpriced treat",
  },
];

export const QUICK_SIM_ITEMS: Record<QuickSimLocation["key"], QuickSimItem[]> = {
  gas: [
    { id: "gas-1", name: "Chocolate Candy Bar", iconKey: "candy", priceCents: 189 },
    { id: "gas-2", name: "Energy Drink Can", iconKey: "drink", priceCents: 349 },
    { id: "gas-3", name: "Classic Potato Chips", iconKey: "snack", priceCents: 229 },
    { id: "gas-4", name: "Hot Dog", iconKey: "food", priceCents: 299 },
    { id: "gas-5", name: "Gum Pack", iconKey: "candy", priceCents: 149 },
    { id: "gas-6", name: "Scratch-off Lottery Ticket", iconKey: "scratch", priceCents: 500 },
    { id: "gas-7", name: "Beef Jerky", iconKey: "snack", priceCents: 499 },
    { id: "gas-8", name: "Bottle of Water", iconKey: "drink", priceCents: 199 },
    { id: "gas-9", name: "Sunglasses", iconKey: "accessory", priceCents: 999 },
    { id: "gas-10", name: "Car Air Freshener", iconKey: "accessory", priceCents: 399 },
  ],
  convenience: [
    { id: "conv-1", name: "Canned Iced Tea", iconKey: "drink", priceCents: 129 },
    { id: "conv-2", name: "Rolled Tortilla Chips", iconKey: "snack", priceCents: 299 },
    { id: "conv-3", name: "Premium Ice Cream Pint", iconKey: "food", priceCents: 599 },
    { id: "conv-4", name: "Phone Charging Cable", iconKey: "accessory", priceCents: 1299 },
    { id: "conv-5", name: "Pain Relief Tablets", iconKey: "accessory", priceCents: 749 },
    { id: "conv-6", name: "Peanut Butter Cups", iconKey: "candy", priceCents: 179 },
    { id: "conv-7", name: "Coconut Water", iconKey: "drink", priceCents: 349 },
    { id: "conv-8", name: "Lottery Ticket", iconKey: "scratch", priceCents: 200 },
    { id: "conv-9", name: "Hand Sanitizer", iconKey: "accessory", priceCents: 299 },
    { id: "conv-10", name: "Lip Balm Stick", iconKey: "accessory", priceCents: 249 },
  ],
  grocery: [
    { id: "groc-1", name: "Chocolate Bar at Checkout", iconKey: "candy", priceCents: 249 },
    { id: "groc-2", name: "Celebrity Magazine", iconKey: "magazine", priceCents: 499 },
    { id: "groc-3", name: "Breath Mints", iconKey: "candy", priceCents: 199 },
    { id: "groc-4", name: "Protein Bar", iconKey: "snack", priceCents: 349 },
    { id: "groc-5", name: "Sparkling Water 4-Pack", iconKey: "drink", priceCents: 599 },
    { id: "groc-6", name: "Flowers", iconKey: "flower", priceCents: 899 },
    { id: "groc-7", name: "Candle", iconKey: "candle", priceCents: 1299 },
    { id: "groc-8", name: "Reusable Bag", iconKey: "accessory", priceCents: 299 },
    { id: "groc-9", name: "Trail Mix", iconKey: "snack", priceCents: 449 },
    { id: "groc-10", name: "Gummy Bears", iconKey: "candy", priceCents: 399 },
  ],
  coffee: [
    { id: "coff-1", name: "Oat Milk Latte", iconKey: "coffee", priceCents: 650 },
    { id: "coff-2", name: "Avocado Toast", iconKey: "food", priceCents: 999 },
    { id: "coff-3", name: "Chocolate Croissant", iconKey: "food", priceCents: 450 },
    { id: "coff-4", name: "Matcha Latte", iconKey: "coffee", priceCents: 600 },
    { id: "coff-5", name: "Bottle of Water", iconKey: "drink", priceCents: 300 },
    { id: "coff-6", name: "Cake Pop", iconKey: "candy", priceCents: 350 },
    { id: "coff-7", name: "Iced Coffee", iconKey: "coffee", priceCents: 550 },
    { id: "coff-8", name: "Protein Box", iconKey: "food", priceCents: 899 },
    { id: "coff-9", name: "Muffin", iconKey: "food", priceCents: 399 },
    { id: "coff-10", name: "Sparkling Lemonade", iconKey: "drink", priceCents: 450 },
  ],
};

/** How many items the deck shows per visit. Drawn at random from the full 10. */
export const QUICK_SIM_ITEMS_PER_VISIT = 5;

function fisherYates<T>(input: T[]): T[] {
  const a = input.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Picks a fresh random subset for the deck. Called every time the
 * user lands on a location, so two consecutive visits to the same
 * location surface different items.
 */
export function pickQuickSimItems(
  locationKey: QuickSimLocation["key"],
): QuickSimItem[] {
  const all = QUICK_SIM_ITEMS[locationKey];
  return fisherYates(all).slice(0, QUICK_SIM_ITEMS_PER_VISIT);
}
