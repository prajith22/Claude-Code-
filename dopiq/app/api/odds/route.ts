import { NextResponse } from "next/server";
import {
  clearAllCache,
  clearCache,
  getAllSportResults,
  type AllSportResults,
} from "@/lib/odds";
import type { Sport } from "@/types";

export const dynamic = "force-dynamic";

const SPORTS: Sport[] = [
  "NFL",
  "NBA",
  "MLB",
  "NHL",
  "NCAAF",
  "NCAAB",
  "MLS",
  "Boxing",
  "UFC",
  "Golf",
];

// Accept ?refresh=all OR ?refresh=nba (case-insensitive) to bust the
// cache before fetching. Handy for debugging stale / broken cache rows.
// Example: /api/odds?refresh=nba
export async function GET(req: Request) {
  try {
    const apiKeyPresent = !!process.env.ODDS_API_KEY;
    console.log(`[odds-route] ODDS_API_KEY present: ${apiKeyPresent}`);

    const url = new URL(req.url);
    const refresh = url.searchParams.get("refresh");
    let forceRefresh = false;

    if (refresh === "all") {
      console.log("[odds-route] refresh=all — clearing every cache row");
      await clearAllCache();
      forceRefresh = true;
    } else if (refresh) {
      const want = refresh.toUpperCase();
      const sport = SPORTS.find((s) => s.toUpperCase() === want);
      if (sport) {
        console.log(`[odds-route] refresh=${sport} — clearing cache row`);
        await clearCache(sport);
        forceRefresh = true;
      } else {
        console.log(
          `[odds-route] refresh=${refresh} — unknown sport, ignoring`,
        );
      }
    }

    const results = await getAllSportResults(forceRefresh);

    const counts = Object.fromEntries(
      (Object.entries(results) as [keyof AllSportResults, (typeof results)[keyof AllSportResults]][]).map(
        ([k, v]) => [k, v.games.length],
      ),
    );
    console.log("[odds-route] per-sport game counts:", counts);

    return NextResponse.json({
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
      _meta: buildMeta(apiKeyPresent, results),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[odds-route] total collapse:", msg);
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
          apiKeyPresent: !!process.env.ODDS_API_KEY,
          sports: {},
          fatalError: msg,
        },
      },
      { status: 200 },
    );
  }
}

function buildMeta(apiKeyPresent: boolean, results: AllSportResults) {
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
      cacheAgeMin:
        r.cacheAgeMs != null ? Math.round(r.cacheAgeMs / 60000) : null,
    };
  }
  return { apiKeyPresent, sports };
}
