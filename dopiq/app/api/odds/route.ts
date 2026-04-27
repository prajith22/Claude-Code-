import { NextResponse } from "next/server";
import { getAllSportResults, type AllSportResults } from "@/lib/odds";

export const dynamic = "force-dynamic";

// Data is fully static (games.json) so we can let the CDN serve this
// for 10 minutes and the browser hold it for 5. SWR keeps a stale
// copy serving for a day if the origin ever blips. Massive win for
// the Bet page mount — currently every visit hits the route fresh.
const CACHE_HEADERS = {
  "Cache-Control":
    "public, max-age=300, s-maxage=600, stale-while-revalidate=86400",
};

// Fake-data mode. The betting simulator no longer hits The Odds API —
// it reads from data/games.json via lib/odds.ts. Kept as an endpoint
// so the client-side BetGamesList keeps working without UI changes.
export async function GET() {
  try {
    console.log("[odds-route] serving from fake data (data/games.json)");
    const results = await getAllSportResults();

    const counts = Object.fromEntries(
      (Object.entries(results) as [
        keyof AllSportResults,
        AllSportResults[keyof AllSportResults],
      ][]).map(([k, v]) => [k, v.games.length]),
    );
    console.log("[odds-route] per-sport game counts:", counts);

    return NextResponse.json(
      {
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
        _meta: buildMeta(results),
      },
      { headers: CACHE_HEADERS },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[odds-route] failed:", msg);
    return NextResponse.json(
      {
        nfl: [],
        nba: [],
        mlb: [],
        nhl: [],
        ncaaf: [],
        ncaab: [],
        mls: [],
        boxing: [],
        ufc: [],
        golf: [],
        _meta: {
          apiKeyPresent: true,
          sports: {},
          fatalError: msg,
        },
      },
      { status: 200 },
    );
  }
}

function buildMeta(results: AllSportResults) {
  const sports: Record<
    string,
    {
      rawCount: number;
      kept: number;
      dropped: number;
      source: string;
      error: string | null;
      cacheAgeMin: number | null;
    }
  > = {};
  for (const [key, r] of Object.entries(results) as [
    string,
    AllSportResults[keyof AllSportResults],
  ][]) {
    sports[key] = {
      rawCount: r.rawCount,
      kept: r.games.length,
      dropped: r.transformedOut,
      source: r.source,
      error: r.error,
      cacheAgeMin: null,
    };
  }
  // Fake-data mode never has a missing key, but the UI reads this field
  // to show a warning banner — keep it truthy.
  return { apiKeyPresent: true, sports };
}
