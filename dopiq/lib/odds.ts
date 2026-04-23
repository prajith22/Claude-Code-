import { prisma } from "@/lib/prisma";
import type { Game, GameOdds, Sport } from "@/types";

// Maps our internal Sport enum to The Odds API sport keys.
// When adding a sport: add it to `Sport` in types/index.ts, add a
// row here, and add it to the Promise.all in getAllOdds().
const SPORT_KEYS: Record<Sport, string> = {
  NFL: "americanfootball_nfl",
  NBA: "basketball_nba",
  MLB: "baseball_mlb",
  NHL: "icehockey_nhl",
  NCAAF: "americanfootball_ncaaf",
  NCAAB: "basketball_ncaab",
  MLS: "soccer_usa_mls",
  Boxing: "boxing",
  UFC: "mma_mixed_martial_arts",
  Golf: "golf_pga_tour",
};

const CACHE_TTL_MS = 3 * 60 * 60 * 1000; // 3 hours
const LOG = "[odds]";

type OddsApiOutcome = {
  name: string;
  price: number;
  point?: number;
};

type OddsApiMarket = {
  key: string;
  outcomes: OddsApiOutcome[];
};

type OddsApiBookmaker = {
  key: string;
  title: string;
  last_update: string;
  markets: OddsApiMarket[];
};

type OddsApiGame = {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers: OddsApiBookmaker[];
};

// Rich per-sport result: the parsed games, plus diagnostics that the
// API route surfaces back to the client for the empty/error state.
export type SportResult = {
  sport: Sport;
  games: Game[];
  source: "cache-fresh" | "cache-stale-fallback" | "api" | "empty";
  rawCount: number; // games returned by upstream before transform
  transformedOut: number; // games dropped by the transform
  error: string | null;
  cacheAgeMs: number | null;
};

export async function getSportResult(
  sport: Sport,
  forceRefresh = false,
): Promise<SportResult> {
  const result: SportResult = {
    sport,
    games: [],
    source: "empty",
    rawCount: 0,
    transformedOut: 0,
    error: null,
    cacheAgeMs: null,
  };

  const cached = forceRefresh ? null : await readCache(sport);
  if (cached) {
    const age = Date.now() - cached.fetchedAt.getTime();
    result.cacheAgeMs = age;
    if (age < CACHE_TTL_MS) {
      const transformed = transformApiResponse(cached.data, sport);
      result.games = transformed.games;
      result.rawCount = cached.data.length;
      result.transformedOut = transformed.dropped;
      result.source = "cache-fresh";
      console.log(
        `${LOG} ${sport} cache-fresh age=${(age / 60000).toFixed(1)}m raw=${cached.data.length} kept=${result.games.length} dropped=${result.transformedOut}`,
      );
      return result;
    }
    console.log(
      `${LOG} ${sport} cache-stale age=${(age / 60000).toFixed(1)}m; refetching`,
    );
  } else if (forceRefresh) {
    console.log(`${LOG} ${sport} forceRefresh — bypassing cache`);
  } else {
    console.log(`${LOG} ${sport} cache-miss`);
  }

  const fetched = await fetchFromApi(sport);
  if (fetched.ok) {
    await writeCache(sport, fetched.data);
    const transformed = transformApiResponse(fetched.data, sport);
    result.games = transformed.games;
    result.rawCount = fetched.data.length;
    result.transformedOut = transformed.dropped;
    result.source = "api";
    console.log(
      `${LOG} ${sport} api raw=${fetched.data.length} kept=${result.games.length} dropped=${result.transformedOut}`,
    );
    return result;
  }

  // Fetch failed — fall back to stale cache if we have it
  result.error = fetched.error;
  if (cached) {
    const transformed = transformApiResponse(cached.data, sport);
    result.games = transformed.games;
    result.rawCount = cached.data.length;
    result.transformedOut = transformed.dropped;
    result.source = "cache-stale-fallback";
    console.log(
      `${LOG} ${sport} fell back to stale cache (error: ${fetched.error})`,
    );
    return result;
  }

  console.log(`${LOG} ${sport} empty (error: ${fetched.error})`);
  return result;
}

export async function getOddsForSport(
  sport: Sport,
  forceRefresh = false,
): Promise<Game[]> {
  const { games } = await getSportResult(sport, forceRefresh);
  return games;
}

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

export async function getAllOdds(forceRefresh = false): Promise<AllOdds> {
  const results = await getAllSportResults(forceRefresh);
  return {
    nfl: results.nfl.games,
    nba: results.nba.games,
    mlb: results.mlb.games,
    nhl: results.nhl.games,
    ncaaf: results.ncaaf.games,
    ncaab: results.ncaab.games,
    mls: results.mls.games,
    boxing: results.boxing.games,
    ufc: results.ufc.games,
    golf: results.golf.games,
  };
}

export async function getAllSportResults(
  forceRefresh = false,
): Promise<AllSportResults> {
  const [nfl, nba, mlb, nhl, ncaaf, ncaab, mls, boxing, ufc, golf] =
    await Promise.all([
      getSportResult("NFL", forceRefresh),
      getSportResult("NBA", forceRefresh),
      getSportResult("MLB", forceRefresh),
      getSportResult("NHL", forceRefresh),
      getSportResult("NCAAF", forceRefresh),
      getSportResult("NCAAB", forceRefresh),
      getSportResult("MLS", forceRefresh),
      getSportResult("Boxing", forceRefresh),
      getSportResult("UFC", forceRefresh),
      getSportResult("Golf", forceRefresh),
    ]);
  return { nfl, nba, mlb, nhl, ncaaf, ncaab, mls, boxing, ufc, golf };
}

/** Delete the cache row for one sport. No-op if it doesn't exist. */
export async function clearCache(sport: Sport): Promise<void> {
  try {
    await prisma.oddsCache.delete({ where: { sport } });
    console.log(`${LOG} ${sport} cache cleared`);
  } catch {
    // row didn't exist — fine
  }
}

/** Delete every cache row. */
export async function clearAllCache(): Promise<void> {
  try {
    const { count } = await prisma.oddsCache.deleteMany({});
    console.log(`${LOG} cleared all cache rows (${count})`);
  } catch {
    // table might not exist
  }
}

async function readCache(
  sport: Sport,
): Promise<{ data: OddsApiGame[]; fetchedAt: Date } | null> {
  try {
    const row = await prisma.oddsCache.findUnique({ where: { sport } });
    if (!row) return null;
    // Defensive: if someone wrote a non-array, treat as a miss.
    const data = row.data as unknown;
    if (!Array.isArray(data)) {
      console.log(`${LOG} ${sport} cache row has non-array data; ignoring`);
      return null;
    }
    return {
      data: data as OddsApiGame[],
      fetchedAt: row.fetchedAt,
    };
  } catch (e) {
    console.log(`${LOG} ${sport} cache read error: ${errMsg(e)}`);
    return null;
  }
}

async function writeCache(sport: Sport, data: OddsApiGame[]): Promise<void> {
  try {
    await prisma.oddsCache.upsert({
      where: { sport },
      create: {
        sport,
        data: data as unknown as object,
        fetchedAt: new Date(),
      },
      update: {
        data: data as unknown as object,
        fetchedAt: new Date(),
      },
    });
  } catch (e) {
    console.log(`${LOG} ${sport} cache write error: ${errMsg(e)}`);
  }
}

type FetchResult =
  | { ok: true; data: OddsApiGame[] }
  | { ok: false; error: string };

async function fetchFromApi(sport: Sport): Promise<FetchResult> {
  const apiKey = process.env.ODDS_API_KEY;
  console.log(`${LOG} ${sport} ODDS_API_KEY present: ${!!apiKey}`);
  if (!apiKey) {
    return { ok: false, error: "ODDS_API_KEY missing on the server" };
  }

  const sportKey = SPORT_KEYS[sport];
  const url = new URL(
    `https://api.the-odds-api.com/v4/sports/${sportKey}/odds`,
  );
  url.searchParams.set("apiKey", apiKey);
  url.searchParams.set("regions", "us");
  url.searchParams.set("markets", "h2h,spreads,totals");
  url.searchParams.set("oddsFormat", "american");

  // Log the URL with the key redacted
  const redacted = url.toString().replace(apiKey, "***");
  console.log(`${LOG} ${sport} fetching ${redacted}`);

  try {
    const res = await fetch(url.toString(), { cache: "no-store" });
    console.log(`${LOG} ${sport} upstream status ${res.status}`);
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.log(
        `${LOG} ${sport} upstream error body: ${body.slice(0, 400)}`,
      );
      return {
        ok: false,
        error: `Upstream ${res.status}: ${body.slice(0, 160) || res.statusText}`,
      };
    }
    const data = (await res.json()) as unknown;
    if (!Array.isArray(data)) {
      console.log(
        `${LOG} ${sport} upstream response not an array: ${JSON.stringify(data).slice(0, 200)}`,
      );
      return { ok: false, error: "Upstream returned a non-array payload" };
    }
    return { ok: true, data: data as OddsApiGame[] };
  } catch (e) {
    console.log(`${LOG} ${sport} fetch threw: ${errMsg(e)}`);
    return { ok: false, error: `Network error: ${errMsg(e)}` };
  }
}

function transformApiResponse(
  data: OddsApiGame[],
  sport: Sport,
): { games: Game[]; dropped: number } {
  const games: Game[] = [];
  let dropped = 0;
  for (const g of data) {
    const transformed = pickBestBookmaker(g, sport);
    if (transformed) games.push(transformed);
    else dropped++;
  }
  return { games, dropped };
}

function pickBestBookmaker(g: OddsApiGame, sport: Sport): Game | null {
  // Prefer a bookmaker that offers all three markets.
  const bookmaker =
    g.bookmakers.find((b) => {
      const keys = b.markets.map((m) => m.key);
      return (
        keys.includes("h2h") &&
        keys.includes("spreads") &&
        keys.includes("totals")
      );
    }) ?? g.bookmakers[0];

  if (!bookmaker) return null;

  const h2h = bookmaker.markets.find((m) => m.key === "h2h");
  const spreads = bookmaker.markets.find((m) => m.key === "spreads");
  const totals = bookmaker.markets.find((m) => m.key === "totals");
  if (!h2h || !spreads || !totals) return null;

  const homeH2h = h2h.outcomes.find((o) => o.name === g.home_team);
  const awayH2h = h2h.outcomes.find((o) => o.name === g.away_team);
  const homeSpread = spreads.outcomes.find((o) => o.name === g.home_team);
  const awaySpread = spreads.outcomes.find((o) => o.name === g.away_team);
  const over = totals.outcomes.find((o) => o.name === "Over");
  const under = totals.outcomes.find((o) => o.name === "Under");

  if (
    !homeH2h ||
    !awayH2h ||
    !homeSpread ||
    !awaySpread ||
    !over ||
    !under ||
    homeSpread.point === undefined ||
    awaySpread.point === undefined ||
    over.point === undefined
  ) {
    return null;
  }

  const odds: GameOdds = {
    moneylineHome: Math.round(homeH2h.price),
    moneylineAway: Math.round(awayH2h.price),
    spreadHome: homeSpread.point,
    spreadHomeOdds: Math.round(homeSpread.price),
    spreadAway: awaySpread.point,
    spreadAwayOdds: Math.round(awaySpread.price),
    total: over.point,
    overOdds: Math.round(over.price),
    underOdds: Math.round(under.price),
  };

  return {
    id: g.id,
    sport,
    homeTeam: g.home_team,
    awayTeam: g.away_team,
    startsAt: g.commence_time,
    odds,
  };
}

function errMsg(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}
