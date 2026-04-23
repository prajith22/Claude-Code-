import gamesData from "@/data/games.json";
import type { Game, GameOdds, Sport } from "@/types";

// Raw shape stored in data/games.json. Richer than the Game type the UI
// consumes today — the extra fields (colors, live state, peopleBetting,
// etc.) will power features in later installments.
type RawGame = {
  id: string;
  sport: string;
  homeTeam: string;
  awayTeam: string;
  homeTeamAbbr: string;
  awayTeamAbbr: string;
  homeTeamColor: string;
  awayTeamColor: string;
  gameTime: string;
  moneylineHome: number;
  moneylineAway: number;
  spreadHome: number;
  spreadAway: number;
  spreadLine: number;
  spreadHomeOdds: number;
  spreadAwayOdds: number;
  totalOver: number;
  totalUnder: number;
  totalLine: number;
  isLive: boolean;
  liveScore: string | null;
  livePeriod: string | null;
  peopleBetting: number;
};

const ALL_RAW: RawGame[] = gamesData as RawGame[];

const SPORT_TO_KEY: Record<Sport, keyof AllOdds> = {
  NFL: "nfl",
  NBA: "nba",
  MLB: "mlb",
  NHL: "nhl",
  NCAAF: "ncaaf",
  NCAAB: "ncaab",
  MLS: "mls",
  Boxing: "boxing",
  UFC: "ufc",
  Golf: "golf",
};

export type SportResult = {
  sport: Sport;
  games: Game[];
  source: "fake-data";
  rawCount: number;
  transformedOut: number;
  error: string | null;
  cacheAgeMs: number | null;
};

export type AllOdds = {
  nfl: Game[];
  nba: Game[];
  mlb: Game[];
  nhl: Game[];
  ncaaf: Game[];
  ncaab: Game[];
  mls: Game[];
  boxing: Game[];
  ufc: Game[];
  golf: Game[];
};

export type AllSportResults = Record<keyof AllOdds, SportResult>;

function toGame(raw: RawGame): Game {
  const odds: GameOdds = {
    moneylineHome: raw.moneylineHome,
    moneylineAway: raw.moneylineAway,
    spreadHome: raw.spreadHome,
    spreadHomeOdds: raw.spreadHomeOdds,
    spreadAway: raw.spreadAway,
    spreadAwayOdds: raw.spreadAwayOdds,
    total: raw.totalLine,
    overOdds: raw.totalOver,
    underOdds: raw.totalUnder,
  };
  return {
    id: raw.id,
    sport: raw.sport as Sport,
    homeTeam: raw.homeTeam,
    awayTeam: raw.awayTeam,
    homeTeamAbbr: raw.homeTeamAbbr,
    awayTeamAbbr: raw.awayTeamAbbr,
    homeTeamColor: raw.homeTeamColor,
    awayTeamColor: raw.awayTeamColor,
    startsAt: raw.gameTime,
    peopleBetting: raw.peopleBetting,
    isLive: raw.isLive,
    liveScore: raw.liveScore,
    livePeriod: raw.livePeriod,
    odds,
  };
}

function filterBySport(sport: Sport): Game[] {
  return ALL_RAW.filter((g) => g.sport === sport).map(toGame);
}

function makeResult(sport: Sport): SportResult {
  const games = filterBySport(sport);
  return {
    sport,
    games,
    source: "fake-data",
    rawCount: games.length,
    transformedOut: 0,
    error: null,
    cacheAgeMs: null,
  };
}

// Kept for signature compatibility with the API route + game detail
// page. `forceRefresh` is a no-op now — the dataset is static.
export async function getSportResult(
  sport: Sport,
  _forceRefresh = false,
): Promise<SportResult> {
  return makeResult(sport);
}

export async function getOddsForSport(
  sport: Sport,
  _forceRefresh = false,
): Promise<Game[]> {
  return filterBySport(sport);
}

export async function getAllOdds(_forceRefresh = false): Promise<AllOdds> {
  return {
    nfl: filterBySport("NFL"),
    nba: filterBySport("NBA"),
    mlb: filterBySport("MLB"),
    nhl: filterBySport("NHL"),
    ncaaf: filterBySport("NCAAF"),
    ncaab: filterBySport("NCAAB"),
    mls: filterBySport("MLS"),
    boxing: filterBySport("Boxing"),
    ufc: filterBySport("UFC"),
    golf: filterBySport("Golf"),
  };
}

export async function getAllSportResults(
  _forceRefresh = false,
): Promise<AllSportResults> {
  return {
    nfl: makeResult("NFL"),
    nba: makeResult("NBA"),
    mlb: makeResult("MLB"),
    nhl: makeResult("NHL"),
    ncaaf: makeResult("NCAAF"),
    ncaab: makeResult("NCAAB"),
    mls: makeResult("MLS"),
    boxing: makeResult("Boxing"),
    ufc: makeResult("UFC"),
    golf: makeResult("Golf"),
  };
}

// No-op cache helpers — kept so the API route still compiles. The fake
// dataset has nothing to clear.
export async function clearCache(_sport: Sport): Promise<void> {}
export async function clearAllCache(): Promise<void> {}

// Re-exported for future installments that want the richer raw shape
// (team colors, live state, peopleBetting).
export function getRawGames(): RawGame[] {
  return ALL_RAW;
}

export function getRawGame(id: string): RawGame | null {
  return ALL_RAW.find((g) => g.id === id) ?? null;
}

export function getRawGamesBySport(sport: Sport): RawGame[] {
  return ALL_RAW.filter((g) => g.sport === sport);
}

// Silence unused import warning for the map when SPORT_TO_KEY isn't
// referenced directly by type checkers in some setups.
export { SPORT_TO_KEY };
