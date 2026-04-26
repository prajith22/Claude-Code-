import type { BetSide, BetType } from "@/lib/bet-slip-store";

export type ParlayWatermark = "basketball" | "football" | "soccer" | "hockey";

export type FeaturedParlay = {
  id: string;
  name: string;
  subtitle: string;
  watermark: ParlayWatermark;
  peopleBetting: number;
  legs: Array<{
    gameId: string;
    type: BetType;
    side: BetSide;
  }>;
};

// Handpicked against data/games.json. Update if games.json changes.
export const FEATURED_PARLAYS: FeaturedParlay[] = [
  {
    id: "tuesday-night-fever",
    name: "Tuesday Night Fever",
    subtitle: "Basketball · Tonight's Slate",
    watermark: "basketball",
    peopleBetting: 8432,
    legs: [
      { gameId: "nba-g1", type: "moneyline", side: "away" }, // BOS Ravens ML (-250)
      { gameId: "nba-g3", type: "spread",    side: "home" }, // ATL Blaze -5.5
      { gameId: "nba-g4", type: "total",     side: "over"  }, // Over 233
    ],
  },
  {
    id: "the-sweep",
    name: "The Sweep",
    subtitle: "Football · Prime Time Picks",
    watermark: "football",
    peopleBetting: 6211,
    legs: [
      { gameId: "nfl-g1", type: "spread", side: "away" }, // POR Timbers -3.5
      { gameId: "nfl-g2", type: "spread", side: "home" }, // MIN Frost -4
      { gameId: "nfl-g4", type: "spread", side: "home" }, // MIA Heat Wave -8.5
    ],
  },
  {
    id: "lock-of-the-day",
    name: "Lock of the Day",
    subtitle: "Multi-Sport · Big Favorites",
    watermark: "soccer",
    peopleBetting: 11543,
    legs: [
      { gameId: "nfl-g4", type: "moneyline", side: "home" }, // MIA ML (-250)
      { gameId: "nba-g3", type: "moneyline", side: "home" }, // ATL ML (-227)
      { gameId: "mls-g3", type: "moneyline", side: "home" }, // SEA ML (-134)
      { gameId: "nhl-g6", type: "moneyline", side: "home" }, // MIN ML (-162)
    ],
  },
  {
    id: "underdog-rising",
    name: "Underdog Rising",
    subtitle: "Basketball · Long Shot",
    watermark: "basketball",
    peopleBetting: 3712,
    legs: [
      { gameId: "nba-g2", type: "moneyline", side: "away" }, // ATL +165
      { gameId: "nba-g5", type: "moneyline", side: "away" }, // POR +195
      { gameId: "nba-g6", type: "moneyline", side: "home" }, // CLE +146
    ],
  },
];
