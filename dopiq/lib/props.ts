import { prisma } from "@/lib/prisma";
import type { PlayerProp, Sport } from "@/types";

// Only these four sports support player props. Everything else returns [].
const SPORT_KEYS: Partial<Record<Sport, string>> = {
  NFL: "americanfootball_nfl",
  NBA: "basketball_nba",
  MLB: "baseball_mlb",
  NHL: "icehockey_nhl",
};

const PROP_MARKETS: Partial<Record<Sport, string[]>> = {
  NFL: [
    "player_pass_yds",
    "player_rush_yds",
    "player_receiving_yds",
    "player_pass_tds",
    "player_rush_tds",
    "player_receptions",
  ],
  NBA: ["player_points", "player_rebounds", "player_assists", "player_threes"],
  MLB: ["batter_home_runs", "pitcher_strikeouts", "batter_hits"],
  NHL: ["player_goals", "player_assists", "player_shots_on_goal"],
};

const MARKET_LABELS: Record<string, string> = {
  player_pass_yds: "Passing Yards",
  player_rush_yds: "Rushing Yards",
  player_receiving_yds: "Receiving Yards",
  player_pass_tds: "Passing TDs",
  player_rush_tds: "Rushing TDs",
  player_receptions: "Receptions",
  player_points: "Points",
  player_rebounds: "Rebounds",
  player_assists: "Assists",
  player_threes: "3-Pointers Made",
  batter_home_runs: "Home Runs",
  pitcher_strikeouts: "Strikeouts",
  batter_hits: "Hits",
  player_goals: "Goals",
  player_shots_on_goal: "Shots on Goal",
};

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
const LOOKAHEAD_MS = 48 * 60 * 60 * 1000; // 48 hours

export type { PlayerProp };

export function sportSupportsProps(sport: Sport): boolean {
  return !!PROP_MARKETS[sport];
}

export async function getPropsForGame(
  gameId: string,
  sport: Sport,
  startsAt: Date | null,
): Promise<PlayerProp[]> {
  if (!sportSupportsProps(sport)) return [];

  const cached = await readCache(gameId);
  if (cached && isFresh(cached.fetchedAt)) {
    return transformApiResponse(cached.data, sport);
  }

  // Only spend an API request if the game kicks off within 48 hours.
  const withinWindow =
    !!startsAt && startsAt.getTime() - Date.now() <= LOOKAHEAD_MS;

  if (!withinWindow) {
    // Outside the window — don't burn a call. Return stale cache if we
    // have one, else empty. (Cache stays put so we still have it when the
    // window opens.)
    if (cached) return transformApiResponse(cached.data, sport);
    return [];
  }

  const fresh = await fetchFromApi(gameId, sport);
  if (fresh) {
    await writeCache(gameId, sport, fresh);
    return transformApiResponse(fresh, sport);
  }

  // API unreachable — fall back to stale cache if present
  if (cached) return transformApiResponse(cached.data, sport);
  return [];
}

function isFresh(fetchedAt: Date): boolean {
  return Date.now() - fetchedAt.getTime() < CACHE_TTL_MS;
}

type OddsApiPropOutcome = {
  name: string; // "Over" | "Under"
  description?: string; // player name
  price: number;
  point?: number;
};

type OddsApiPropMarket = {
  key: string;
  outcomes: OddsApiPropOutcome[];
};

type OddsApiPropBookmaker = {
  key: string;
  title: string;
  markets: OddsApiPropMarket[];
};

type OddsApiPropEvent = {
  id: string;
  home_team: string;
  away_team: string;
  bookmakers: OddsApiPropBookmaker[];
};

async function readCache(
  gameId: string,
): Promise<{ data: OddsApiPropEvent; fetchedAt: Date } | null> {
  try {
    const row = await prisma.propsCache.findUnique({ where: { gameId } });
    if (!row) return null;
    return {
      data: row.data as unknown as OddsApiPropEvent,
      fetchedAt: row.fetchedAt,
    };
  } catch {
    return null;
  }
}

async function writeCache(
  gameId: string,
  sport: Sport,
  data: OddsApiPropEvent,
): Promise<void> {
  try {
    await prisma.propsCache.upsert({
      where: { gameId },
      create: {
        gameId,
        sport,
        data: data as unknown as object,
        fetchedAt: new Date(),
      },
      update: {
        sport,
        data: data as unknown as object,
        fetchedAt: new Date(),
      },
    });
  } catch {
    // Swallow — if the table isn't ready, we'll just re-fetch next call.
  }
}

async function fetchFromApi(
  gameId: string,
  sport: Sport,
): Promise<OddsApiPropEvent | null> {
  const apiKey = process.env.ODDS_API_KEY;
  if (!apiKey) return null;

  const sportKey = SPORT_KEYS[sport];
  const markets = PROP_MARKETS[sport];
  if (!sportKey || !markets) return null;

  const url = new URL(
    `https://api.the-odds-api.com/v4/sports/${sportKey}/events/${gameId}/odds`,
  );
  url.searchParams.set("apiKey", apiKey);
  url.searchParams.set("regions", "us");
  url.searchParams.set("markets", markets.join(","));
  url.searchParams.set("oddsFormat", "american");

  try {
    const res = await fetch(url.toString(), { cache: "no-store" });
    if (!res.ok) return null;
    const data = (await res.json()) as OddsApiPropEvent;
    return data && typeof data === "object" ? data : null;
  } catch {
    return null;
  }
}

// Consolidates the raw event payload into PlayerProp pairs. For each
// (market, player, line) we take the first bookmaker that publishes
// both Over and Under. Incomplete pairs are dropped.
function transformApiResponse(
  data: OddsApiPropEvent,
  sport: Sport,
): PlayerProp[] {
  const wanted = new Set(PROP_MARKETS[sport] ?? []);

  type Bucket = {
    marketKey: string;
    playerName: string;
    line: number;
    overOdds?: number;
    underOdds?: number;
  };
  const byKey = new Map<string, Bucket>();

  for (const bm of data.bookmakers ?? []) {
    for (const market of bm.markets ?? []) {
      if (!wanted.has(market.key)) continue;
      for (const o of market.outcomes ?? []) {
        if (o.point === undefined) continue;
        const player = o.description;
        if (!player) continue;
        const id = `${market.key}::${player}::${o.point}`;
        const entry: Bucket = byKey.get(id) ?? {
          marketKey: market.key,
          playerName: player,
          line: o.point,
        };
        if (o.name === "Over" && entry.overOdds === undefined) {
          entry.overOdds = Math.round(o.price);
        } else if (o.name === "Under" && entry.underOdds === undefined) {
          entry.underOdds = Math.round(o.price);
        }
        byKey.set(id, entry);
      }
    }
  }

  const props: PlayerProp[] = [];
  for (const entry of byKey.values()) {
    if (entry.overOdds === undefined || entry.underOdds === undefined) continue;
    props.push({
      marketKey: entry.marketKey,
      marketLabel: MARKET_LABELS[entry.marketKey] ?? entry.marketKey,
      playerName: entry.playerName,
      line: entry.line,
      overOdds: entry.overOdds,
      underOdds: entry.underOdds,
    });
  }
  return props;
}
