// One-shot script to append 10 restaurants to data/restaurants.json.
// Run once with `node scripts/add-restaurants-batch-1.mjs` — safe to delete
// afterwards. Kept checked in so the additions are auditable.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FILE = path.join(__dirname, "..", "data", "restaurants.json");

const NEW = [
  {
    id: "r-sakura",
    name: "Sakura Roll House",
    cuisine: "Sushi",
    rating: 4.8,
    deliveryTime: "25-40 min",
    deliveryFee: 2.99,
    menu: [
      ["Dragon Roll", 14.99, "Mains", "Shrimp tempura, avocado and cucumber topped with tuna and tobiko."],
      ["Rainbow Roll", 16.99, "Mains", "California roll topped with assorted sashimi."],
      ["Spicy Tuna Roll", 12.99, "Mains", "Fresh tuna, sriracha, cucumber and sesame."],
      ["Salmon Sashimi 6pc", 13.99, "Mains", "Fresh Atlantic salmon sliced thin."],
      ["Chirashi Bowl", 18.99, "Mains", "Assorted sashimi over seasoned sushi rice."],
      ["Miso Soup", 2.99, "Appetizers", "Traditional dashi broth with tofu and wakame."],
      ["Edamame", 4.99, "Appetizers", "Salted steamed soybeans."],
      ["Gyoza 6pc", 6.99, "Appetizers", "Pan-fried pork and cabbage dumplings."],
      ["Ramune Soda", 3.49, "Drinks", "Japanese marble soda in assorted flavors."],
      ["Green Tea", 2.49, "Drinks", "Hot or iced."],
      ["Yuzu Lemonade", 3.99, "Drinks", "Citrusy yuzu lemonade over ice."],
      ["Mochi Ice Cream 3pc", 5.99, "Desserts", "Chewy mochi wrapped around ice cream, assorted flavors."],
      ["Matcha Cheesecake", 6.99, "Desserts", "Creamy cheesecake infused with stone-ground matcha."],
    ],
  },
  {
    id: "r-bombay-bites",
    name: "Bombay Bites",
    cuisine: "Indian",
    rating: 4.6,
    deliveryTime: "30-45 min",
    deliveryFee: 1.99,
    menu: [
      ["Butter Chicken", 13.99, "Mains", "Tender chicken in a rich tomato cream sauce."],
      ["Chicken Tikka Masala", 14.99, "Mains", "Grilled chicken in spiced masala gravy."],
      ["Lamb Biryani", 16.99, "Mains", "Fragrant basmati rice with slow-cooked lamb and whole spices."],
      ["Paneer Makhani", 12.99, "Mains", "Cottage cheese cubes in buttery tomato sauce. Vegetarian."],
      ["Garlic Naan", 3.99, "Mains", "Soft leavened bread baked in the tandoor oven."],
      ["Samosa 2pc", 4.99, "Appetizers", "Crispy pastry filled with spiced potatoes and peas."],
      ["Onion Bhaji", 5.99, "Appetizers", "Crispy fried onion fritters with mint chutney."],
      ["Mango Lassi", 3.99, "Appetizers", "Sweet yogurt drink blended with fresh mango."],
      ["Chai Tea", 2.99, "Drinks", "Spiced black tea with milk."],
      ["Rose Sharbat", 3.49, "Drinks", "Chilled rose syrup drink."],
      ["Fountain Soda", 1.99, "Drinks", "Your choice of fountain soda, served over crisp ice."],
      ["Gulab Jamun", 4.99, "Desserts", "Soft milk dumplings in rose sugar syrup."],
      ["Kheer", 3.99, "Desserts", "Creamy rice pudding with cardamom and pistachios."],
    ],
  },
  {
    id: "r-olive-feta",
    name: "Olive & Feta",
    cuisine: "Mediterranean",
    rating: 4.7,
    deliveryTime: "20-35 min",
    deliveryFee: 1.49,
    menu: [
      ["Chicken Shawarma Wrap", 11.99, "Mains", "Marinated chicken, garlic sauce and pickles in warm flatbread."],
      ["Lamb Gyro Plate", 13.99, "Mains", "Slow-roasted lamb over rice with tzatziki and pita."],
      ["Falafel Bowl", 10.99, "Mains", "Crispy falafel over hummus with tabbouleh and pita. Vegan."],
      ["Greek Salad", 9.99, "Mains", "Romaine, cucumber, tomato, olives, feta and red onion."],
      ["Grilled Salmon Plate", 16.99, "Mains", "Herb-marinated salmon with roasted vegetables and lemon rice."],
      ["Hummus & Pita", 5.99, "Appetizers", "Creamy house hummus with warm pita bread."],
      ["Spanakopita", 6.99, "Appetizers", "Flaky phyllo pastry filled with spinach and feta."],
      ["Ayran", 2.99, "Drinks", "Cold salted yogurt drink."],
      ["Mint Lemonade", 3.49, "Drinks", "Fresh lemonade with crushed mint."],
      ["Fountain Soda", 1.99, "Drinks", "Your choice of fountain soda, served over crisp ice."],
      ["Baklava", 4.99, "Desserts", "Layers of phyllo, walnuts and honey syrup."],
      ["Turkish Delight", 3.99, "Desserts", "Rosewater-scented confection dusted with powdered sugar."],
    ],
  },
  {
    id: "r-seoul-fire",
    name: "Seoul Fire BBQ",
    cuisine: "Korean",
    rating: 4.8,
    deliveryTime: "25-40 min",
    deliveryFee: 2.49,
    menu: [
      ["Bulgogi Bowl", 13.99, "Mains", "Sweet soy-marinated beef over steamed rice with banchan."],
      ["Spicy Pork Belly Bowl", 12.99, "Mains", "Gochujang-marinated pork belly over rice with kimchi."],
      ["Bibimbap", 11.99, "Mains", "Mixed rice bowl with vegetables, egg and gochujang sauce."],
      ["Korean Fried Chicken 8pc", 14.99, "Mains", "Double-fried crispy chicken in sweet and spicy glaze."],
      ["Japchae", 10.99, "Mains", "Stir-fried glass noodles with vegetables and beef."],
      ["Kimchi", 3.99, "Appetizers", "House-fermented napa cabbage."],
      ["Mandu 6pc", 7.99, "Appetizers", "Pan-fried Korean dumplings with dipping sauce."],
      ["Corn Cheese", 5.99, "Appetizers", "Sweet corn baked with melted mozzarella."],
      ["Banana Milk", 2.99, "Drinks", "Sweet chilled banana-flavored milk."],
      ["Barley Tea", 1.99, "Drinks", "Toasty roasted barley tea, served cold."],
      ["Fountain Soda", 1.99, "Drinks", "Your choice of fountain soda, served over crisp ice."],
      ["Hotteok", 3.99, "Desserts", "Sweet pancake filled with cinnamon, brown sugar and walnuts."],
      ["Bingsu", 6.99, "Desserts", "Shaved ice with sweet red beans and condensed milk."],
    ],
  },
  {
    id: "r-thai-orchid",
    name: "Thai Orchid Express",
    cuisine: "Thai",
    rating: 4.5,
    deliveryTime: "25-35 min",
    deliveryFee: 1.99,
    menu: [
      ["Pad Thai", 12.99, "Mains", "Stir-fried rice noodles with shrimp, egg, bean sprouts and peanuts."],
      ["Green Curry", 13.99, "Mains", "Coconut milk green curry with chicken, bamboo shoots and Thai basil."],
      ["Massaman Curry", 13.99, "Mains", "Slow-cooked beef in a rich peanut and potato curry."],
      ["Tom Yum Soup", 10.99, "Mains", "Spicy and sour lemongrass soup with shrimp and mushrooms."],
      ["Mango Sticky Rice", 7.99, "Mains", "Sweet glutinous rice with fresh mango and coconut cream."],
      ["Spring Rolls 4pc", 5.99, "Appetizers", "Crispy vegetable rolls with sweet chili sauce."],
      ["Thai Fish Cakes", 7.99, "Appetizers", "Spiced fish patties with cucumber relish."],
      ["Thai Iced Tea", 3.99, "Drinks", "Sweet black tea with condensed milk over ice."],
      ["Coconut Water", 3.49, "Drinks", "Chilled fresh coconut water."],
      ["Fountain Soda", 1.99, "Drinks", "Your choice of fountain soda, served over crisp ice."],
      ["Mango Sticky Rice Dessert", 7.99, "Desserts", "The classic finisher — sweet rice with mango and coconut cream."],
      ["Coconut Ice Cream", 4.99, "Desserts", "Creamy coconut ice cream topped with toasted peanuts."],
    ],
  },
  {
    id: "r-morning-glory",
    name: "Morning Glory Brunch",
    cuisine: "Breakfast",
    rating: 4.7,
    deliveryTime: "20-30 min",
    deliveryFee: 1.99,
    menu: [
      ["Eggs Benedict", 13.99, "Mains", "Poached eggs on an English muffin with Canadian bacon and hollandaise."],
      ["Avocado Toast", 11.99, "Mains", "Sourdough with smashed avocado, everything bagel seasoning and a poached egg."],
      ["Buttermilk Pancake Stack", 10.99, "Mains", "Three fluffy pancakes with maple syrup and whipped butter."],
      ["Breakfast Burrito", 10.99, "Mains", "Scrambled eggs, bacon, cheddar and salsa in a flour tortilla."],
      ["Acai Bowl", 12.99, "Mains", "Blended acai with granola, fresh fruit and honey."],
      ["Fruit Salad", 5.99, "Appetizers", "Seasonal fresh fruit with mint and honey."],
      ["Hash Browns", 3.99, "Appetizers", "Crispy golden shredded potatoes."],
      ["Cold Brew Coffee", 4.99, "Drinks", "Slow-steeped cold brew served over ice."],
      ["Fresh Orange Juice", 4.49, "Drinks", "Hand-squeezed orange juice."],
      ["Matcha Latte", 5.49, "Drinks", "Ceremonial-grade matcha with steamed milk."],
      ["Cinnamon Roll", 4.99, "Desserts", "Warm gooey cinnamon roll with cream cheese frosting."],
      ["Blueberry Muffin", 2.99, "Desserts", "Tender muffin bursting with wild blueberries."],
    ],
  },
  {
    id: "r-green-root",
    name: "Green Root Kitchen",
    cuisine: "Healthy",
    rating: 4.6,
    deliveryTime: "15-25 min",
    deliveryFee: 1.49,
    menu: [
      ["Harvest Grain Bowl", 12.99, "Mains", "Quinoa, roasted sweet potato, kale, chickpeas and tahini dressing. Vegan."],
      ["Grilled Chicken Power Bowl", 13.99, "Mains", "Brown rice, grilled chicken, roasted broccoli, edamame and ginger-soy."],
      ["Superfood Salad", 11.99, "Mains", "Mixed greens, blueberries, walnuts, goat cheese and balsamic glaze."],
      ["Turkey Lettuce Wraps", 10.99, "Mains", "Ground turkey with water chestnuts and hoisin in butter lettuce cups."],
      ["Salmon Poke Bowl", 14.99, "Mains", "Sushi rice, fresh salmon, edamame, cucumber and sriracha mayo."],
      ["Kale Chips", 3.99, "Appetizers", "Crispy baked kale with sea salt and nutritional yeast."],
      ["Hummus Veggie Plate", 6.99, "Appetizers", "House hummus with rainbow vegetables."],
      ["Green Detox Smoothie", 6.99, "Drinks", "Spinach, apple, ginger, lemon and cucumber, blended smooth."],
      ["Coconut Water", 3.49, "Drinks", "Chilled fresh coconut water."],
      ["Kombucha", 4.99, "Drinks", "Fermented tea in a rotating seasonal flavor."],
      ["Chia Pudding", 4.99, "Desserts", "Coconut milk chia pudding with fresh berries."],
      ["Protein Energy Balls", 3.99, "Desserts", "Oat, peanut butter and dark chocolate bites."],
    ],
  },
  {
    id: "r-trattoria-napoli",
    name: "Trattoria Napoli",
    cuisine: "Italian",
    rating: 4.7,
    deliveryTime: "30-45 min",
    deliveryFee: 2.49,
    menu: [
      ["Spaghetti Carbonara", 14.99, "Mains", "Al dente pasta with pancetta, egg, pecorino and black pepper."],
      ["Penne Arrabbiata", 12.99, "Mains", "Penne in spicy tomato sauce with garlic and fresh basil. Vegan."],
      ["Chicken Parmigiana", 15.99, "Mains", "Breaded chicken breast with marinara and melted mozzarella over pasta."],
      ["Lasagna al Forno", 13.99, "Mains", "Layered pasta with beef bolognese, bechamel and parmesan."],
      ["Risotto ai Funghi", 14.99, "Mains", "Creamy arborio rice with wild mushrooms, parmesan and truffle oil."],
      ["Bruschetta", 6.99, "Appetizers", "Grilled bread with fresh tomato, basil and olive oil."],
      ["Arancini 3pc", 7.99, "Appetizers", "Crispy fried risotto balls with a mozzarella center."],
      ["Minestrone Soup", 5.99, "Appetizers", "Classic vegetable and bean soup with a parmesan rind."],
      ["San Pellegrino", 2.99, "Drinks", "Italian sparkling mineral water."],
      ["Fountain Soda", 1.99, "Drinks", "Your choice of fountain soda, served over crisp ice."],
      ["Sparkling Lemonade", 3.49, "Drinks", "Bubbly lemonade with a twist of lemon peel."],
      ["Tiramisu", 6.99, "Desserts", "Espresso-soaked ladyfingers with mascarpone cream."],
      ["Panna Cotta", 5.99, "Desserts", "Vanilla cream with a bright berry compote."],
    ],
  },
  {
    id: "r-anchor-seafood",
    name: "The Anchor Seafood",
    cuisine: "Seafood",
    rating: 4.6,
    deliveryTime: "25-40 min",
    deliveryFee: 2.99,
    menu: [
      ["Shrimp Po'Boy", 12.99, "Mains", "Crispy fried shrimp on a toasted hoagie with remoulade and slaw."],
      ["Fish and Chips", 13.99, "Mains", "Beer-battered cod with thick-cut fries and tartar sauce."],
      ["Lobster Roll", 19.99, "Mains", "Chilled lobster with light mayo on a buttered brioche bun."],
      ["Grilled Mahi Mahi", 16.99, "Mains", "Fresh mahi with mango salsa and coconut rice."],
      ["Clam Chowder Bowl", 10.99, "Mains", "Creamy New England chowder in a sourdough bread bowl."],
      ["Calamari", 8.99, "Appetizers", "Lightly breaded fried squid with marinara and lemon."],
      ["Crab Cakes 2pc", 11.99, "Appetizers", "Pan-seared jumbo lump crab cakes with remoulade."],
      ["Fountain Soda", 1.99, "Drinks", "Your choice of fountain soda, served over crisp ice."],
      ["Lemonade", 2.99, "Drinks", "Classic fresh-squeezed lemonade."],
      ["Bottled Water", 1.49, "Drinks", "Refreshing bottled spring water."],
      ["Key Lime Pie", 5.99, "Desserts", "Tangy key lime custard in a graham cracker crust."],
      ["Bread Pudding", 4.99, "Desserts", "Warm bread pudding with vanilla bourbon sauce."],
    ],
  },
  {
    id: "r-boba-bites",
    name: "Boba & Bites",
    cuisine: "Desserts",
    rating: 4.8,
    deliveryTime: "15-25 min",
    deliveryFee: 0.99,
    menu: [
      ["Classic Milk Tea", 6.49, "Mains", "Black tea with creamy milk and tapioca pearls. Choose your sweetness."],
      ["Taro Milk Tea", 6.99, "Mains", "Purple taro with milk and tapioca pearls."],
      ["Matcha Latte Boba", 6.99, "Mains", "Ceremonial matcha with oat milk and tapioca pearls."],
      ["Brown Sugar Tiger Milk Tea", 7.49, "Mains", "Brown sugar syrup with fresh milk and tiger pearls."],
      ["Strawberry Fruit Tea", 5.99, "Mains", "Fresh strawberry tea with popping boba."],
      ["Takoyaki 6pc", 6.99, "Appetizers", "Japanese octopus balls with bonito flakes and mayo."],
      ["Cheese Tteokbokki", 7.99, "Appetizers", "Spicy rice cakes topped with melted cheese."],
      ["Sparkling Fruit Soda", 4.49, "Drinks", "Fizzy soda in rotating seasonal fruit flavors."],
      ["Fresh Lemonade", 3.99, "Drinks", "House-made lemonade over crushed ice."],
      ["Mango Crepe Cake", 6.99, "Desserts", "Layers of crepe with mango cream."],
      ["Churro Bites with Dipping Sauce", 4.99, "Desserts", "Crispy churros with chocolate and caramel dips."],
      ["Strawberry Mochi", 5.99, "Desserts", "Soft mochi filled with fresh strawberry and cream."],
    ],
  },
];

function toMenu(restaurantId, rows) {
  return rows.map(([name, price, category, description], i) => ({
    id: `${restaurantId}-m${i + 1}`,
    name,
    description,
    price,
    category,
  }));
}

const raw = fs.readFileSync(FILE, "utf8");
const existing = JSON.parse(raw);

const existingIds = new Set(existing.map((r) => r.id));
const toAdd = [];

for (const r of NEW) {
  if (existingIds.has(r.id)) {
    console.log(`skip ${r.id} — already present`);
    continue;
  }
  toAdd.push({
    id: r.id,
    name: r.name,
    cuisine: r.cuisine,
    rating: r.rating,
    deliveryTime: r.deliveryTime,
    deliveryFee: r.deliveryFee,
    menu: toMenu(r.id, r.menu),
  });
}

const out = existing.concat(toAdd);
fs.writeFileSync(FILE, JSON.stringify(out, null, 2) + "\n");
console.log(`appended ${toAdd.length} restaurants — total now ${out.length}`);
