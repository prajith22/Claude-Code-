import { prisma } from "@/lib/prisma";
import type { Game, GameOdds, Sport } from "@/types";

const SPORT_KEYS: Record<Sport, string> = {
  NFL: "americanfootball_nfl",
  NBA: "basketball_nba",
};

const CACHE_TTL_MS = 3 * 60 * 60 * 1000; // 3 hours

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

export async function getOddsForSport(sport: Sport): Promise<Game[]> {
  const cached = await readCache(sport);

  if (cached && Date.now() - cached.fetchedAt.getTime() < CACHE_TTL_MS) {
    return transformApiResponse(cached.data, sport);
  }

  const fresh = await fetchFromApi(sport);
  if (fresh) {
    await writeCache(sport, fresh);
    return transformApiResponse(fresh, sport);
  }

  // Fetch failed — fall back to stale cache if we have any
  if (cached) return transformApiResponse(cached.data, sport);
  return [];
}

export async function getAllOdds(): Promise<{ nfl: Game[]; nba: Game[] }> {
  const [nfl, nba] = await Promise.all([
    getOddsForSport("NFL"),
    getOddsForSport("NBA"),
  ]);
  return { nfl, nba };
}

async function readCache(
  sport: Sport,
): Promise<{ data: OddsApiGame[]; fetchedAt: Date } | null> {
  try {
    const row = await prisma.oddsCache.findUnique({ where: { sport } });
    if (!row) return null;
    return {
      data: row.data as unknown as OddsApiGame[],
      fetchedAt: row.fetchedAt,
    };
  } catch {
    // Table might not exist yet (pre-migration) — treat as miss.
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
  } catch {
    // Swallow — if the table isn't ready, we just re-fetch next call.
  }
}

async function fetchFromApi(sport: Sport): Promise<OddsApiGame[] | null> {
  const apiKey = process.env.ODDS_API_KEY;
  if (!apiKey) return null;

  const sportKey = SPORT_KEYS[sport];
  const url = new URL(
    `https://api.the-odds-api.com/v4/sports/${sportKey}/odds`,
  );
  url.searchParams.set("apiKey", apiKey);
  url.searchParams.set("regions", "us");
  url.searchParams.set("markets", "h2h,spreads,totals");
  url.searchParams.set("oddsFormat", "american");

  try {
    const res = await fetch(url.toString(), { cache: "no-store" });
    if (!res.ok) return null;
    const data = (await res.json()) as OddsApiGame[];
    return Array.isArray(data) ? data : null;
  } catch {
    return null;
  }
}

function transformApiResponse(data: OddsApiGame[], sport: Sport): Game[] {
  const games: Game[] = [];
  for (const g of data) {
    const transformed = pickBestBookmaker(g, sport);
    if (transformed) games.push(transformed);
  }
  return games;
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
