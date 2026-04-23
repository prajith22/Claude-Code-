import { NextResponse } from "next/server";
import { getAllOdds } from "@/lib/odds";

export const dynamic = "force-dynamic";

// Returns live odds for all supported sports keyed as:
//   nfl, nba, mlb, nhl, ncaaf, ncaab, mls, boxing, ufc, golf
// Each sport is fetched with markets h2h,spreads,totals and cached
// in Prisma (OddsCache) for 3 hours. Off-season sports return [].
//
// getAllOdds() already swallows per-sport network + cache errors and
// returns [] for anything it couldn't resolve, but we also catch at
// the top level so a total collapse still responds as JSON instead
// of Next's HTML error page.
export async function GET() {
  try {
    const odds = await getAllOdds();
    return NextResponse.json(odds);
  } catch {
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
      },
      { status: 200 },
    );
  }
}
