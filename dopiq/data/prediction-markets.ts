export type PredictionCategory =
  | "Pop Culture"
  | "Tech"
  | "Sports"
  | "Weather"
  | "Social"
  | "Economy"
  | "Shopping";

export type PredictionMarket = {
  id: string;
  question: string;
  category: PredictionCategory;
  yesOdds: number;
  noOdds: number;
  peopleBetting: number;
};

const RAW_MARKETS: Array<Omit<PredictionMarket, "id" | "peopleBetting">> = [
  { question: "Will the most streamed song this week be a breakup anthem?", category: "Pop Culture", yesOdds: -130, noOdds: 110 },
  { question: "Will a reality TV contestant quit before the finale?", category: "Pop Culture", yesOdds: 150, noOdds: -170 },
  { question: "Will a major streaming platform announce a price increase this month?", category: "Tech", yesOdds: -120, noOdds: 100 },
  { question: "Will a celebrity couple announce a breakup before summer?", category: "Pop Culture", yesOdds: 200, noOdds: -240 },
  { question: "Will a major social media app go down for more than 2 hours this week?", category: "Tech", yesOdds: 180, noOdds: -210 },
  { question: "Will a new AI tool go viral on social media this week?", category: "Tech", yesOdds: -140, noOdds: 120 },
  { question: "Will a tech company announce mass layoffs this month?", category: "Tech", yesOdds: -110, noOdds: -110 },
  { question: "Will the underdog team win the biggest game this weekend?", category: "Sports", yesOdds: 220, noOdds: -260 },
  { question: "Will there be a major upset in a championship match this week?", category: "Sports", yesOdds: 175, noOdds: -200 },
  { question: "Will it rain in at least 3 major US cities this weekend?", category: "Weather", yesOdds: -150, noOdds: 130 },
  { question: "Will a viral food trend emerge on social media this week?", category: "Social", yesOdds: -120, noOdds: 100 },
  { question: "Will gas prices rise in the next 2 weeks?", category: "Economy", yesOdds: -110, noOdds: -110 },
  { question: "Will a major store announce a huge sale event this week?", category: "Shopping", yesOdds: -130, noOdds: 110 },
  { question: "Will someone famous post a thirst trap this week?", category: "Pop Culture", yesOdds: -300, noOdds: 250 },
  { question: "Will a cat video go viral and hit 10 million views this week?", category: "Social", yesOdds: 160, noOdds: -180 },
];

/**
 * Seeded so the "X people betting" counter on a card stays the same
 * across renders but looks different per market. Linear-congruential
 * style — fast and stable across every browser.
 */
function seededCount(seed: number): number {
  const x = (seed * 9301 + 49297) % 233280;
  const r = x / 233280;
  return Math.floor(500 + r * 24500);
}

export const PREDICTION_MARKETS: PredictionMarket[] = RAW_MARKETS.map(
  (m, i) => ({
    ...m,
    id: `pred-${i + 1}`,
    peopleBetting: seededCount(i + 1),
  }),
);

/** Per-category pastel pill — matches the rest of the app's palette. */
export const CATEGORY_STYLES: Record<
  PredictionCategory,
  { bg: string; fg: string }
> = {
  "Pop Culture": { bg: "#FCE4EC", fg: "#880E4F" }, // pink
  Tech: { bg: "#E3F2FD", fg: "#0D47A1" }, // blue
  Sports: { bg: "#E8F5E9", fg: "#1B5E20" }, // green
  Weather: { bg: "#E0F2F1", fg: "#004D40" }, // teal
  Social: { bg: "#F3E5F5", fg: "#4A148C" }, // purple
  Economy: { bg: "#FFF3E0", fg: "#BF360C" }, // amber
  Shopping: { bg: "#FFE4E1", fg: "#8B2500" }, // coral
};
