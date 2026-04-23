import { NextResponse } from "next/server";
import { getAllOdds } from "@/lib/odds";

export const dynamic = "force-dynamic";

// Returns live odds for all supported sports keyed as:
//   nfl, nba, mlb, nhl, ncaaf, ncaab, mls, boxing, ufc, golf
// Each sport is fetched with markets h2h,spreads,totals and cached
// in Prisma (OddsCache) for 3 hours. Off-season sports return [].
export async function GET() {
  const odds = await getAllOdds();
  return NextResponse.json(odds);
}
