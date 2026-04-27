"use client";

import { create } from "zustand";
import type { Game } from "@/types";
import { signed } from "@/lib/utils";
import type { PredictionMarket } from "@/data/prediction-markets";

export type BetType = "moneyline" | "spread" | "total" | "prediction";
export type BetSide = "home" | "away" | "over" | "under" | "yes" | "no";

export type SlipSelection = {
  key: string; // `${gameId}:${type}:${side}`
  gameId: string;
  // Free-form display label for the kind of bet — e.g. a sport name
  // for game bets ("Basketball") or a prediction-market category for
  // prediction bets ("Pop Culture"). Not constrained to the Sport
  // union because predictions don't fit there.
  sport: string;
  matchup: string; // e.g. "LAS @ NYT" or the prediction question
  type: BetType;
  side: BetSide;
  label: string; // e.g. "New York Titans -3.5" | "Over 215.5" | "Yes"
  odds: number;
};

export function slipKey(gameId: string, type: BetType, side: BetSide): string {
  return `${gameId}:${type}:${side}`;
}

/**
 * Convert (game, type, side) into the slip shape — pulls the correct odds
 * and builds a human-readable label. Used by both the game-card tap handler
 * and the featured-parlays resolver.
 */
export function buildSelection(
  game: Game,
  type: BetType,
  side: BetSide,
): Omit<SlipSelection, "key"> {
  const matchup = `${game.awayTeamAbbr} @ ${game.homeTeamAbbr}`;
  let label = "";
  let odds = 0;

  if (type === "moneyline") {
    const team = side === "home" ? game.homeTeam : game.awayTeam;
    label = `${team} ML`;
    odds =
      side === "home" ? game.odds.moneylineHome : game.odds.moneylineAway;
  } else if (type === "spread") {
    const team = side === "home" ? game.homeTeam : game.awayTeam;
    const line = side === "home" ? game.odds.spreadHome : game.odds.spreadAway;
    label = `${team} ${signed(line)}`;
    odds =
      side === "home"
        ? game.odds.spreadHomeOdds
        : game.odds.spreadAwayOdds;
  } else {
    // total
    label = `${side === "over" ? "Over" : "Under"} ${game.odds.total}`;
    odds = side === "over" ? game.odds.overOdds : game.odds.underOdds;
  }

  return { gameId: game.id, sport: game.sport, matchup, type, side, label, odds };
}

/**
 * Convert a (prediction market, side) into the slip shape. The
 * category becomes the `sport` field (it's just a display label),
 * the question becomes the matchup, and the side ("yes"/"no")
 * carries its own odds.
 */
export function buildPredictionSelection(
  market: PredictionMarket,
  side: "yes" | "no",
): Omit<SlipSelection, "key"> {
  return {
    gameId: market.id,
    sport: market.category,
    matchup: market.question,
    type: "prediction",
    side,
    label: side === "yes" ? "Yes" : "No",
    odds: side === "yes" ? market.yesOdds : market.noOdds,
  };
}

type BetSlipState = {
  selections: SlipSelection[];
  stake: number;
  toggle: (sel: Omit<SlipSelection, "key">) => void;
  addMany: (sels: Array<Omit<SlipSelection, "key">>) => void;
  remove: (key: string) => void;
  clear: () => void;
  setStake: (n: number) => void;
};

export const useBetSlipStore = create<BetSlipState>((set) => ({
  selections: [],
  stake: 10,

  // Toggle rules:
  //  - exact match (gameId+type+side) → remove
  //  - same gameId+type, different side → replace the existing pick
  //  - otherwise → add
  toggle: (sel) =>
    set((state) => {
      const key = slipKey(sel.gameId, sel.type, sel.side);
      if (state.selections.some((s) => s.key === key)) {
        return { selections: state.selections.filter((s) => s.key !== key) };
      }
      const filtered = state.selections.filter(
        (s) => !(s.gameId === sel.gameId && s.type === sel.type),
      );
      return { selections: [...filtered, { ...sel, key }] };
    }),

  // Batch add (used by Featured Parlays). For each leg: replace any
  // existing selection on the same game+type, then add.
  addMany: (sels) =>
    set((state) => {
      let next = state.selections;
      for (const sel of sels) {
        const key = slipKey(sel.gameId, sel.type, sel.side);
        next = next.filter(
          (s) => !(s.gameId === sel.gameId && s.type === sel.type),
        );
        next = [...next, { ...sel, key }];
      }
      return { selections: next };
    }),

  remove: (key) =>
    set((state) => ({
      selections: state.selections.filter((s) => s.key !== key),
    })),

  clear: () => set({ selections: [], stake: 10 }),

  setStake: (n) => set({ stake: Number.isFinite(n) ? Math.max(0, n) : 0 }),
}));
