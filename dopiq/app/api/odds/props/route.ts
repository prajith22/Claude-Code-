import { NextResponse } from "next/server";
import { getOddsForSport } from "@/lib/odds";
import { getPropsForGame, sportSupportsProps } from "@/lib/props";
import type { Sport } from "@/types";

export const dynamic = "force-dynamic";

const VALID_SPORTS: Sport[] = [
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

// GET /api/odds/props?gameId=<id>&sport=<SPORT>
// - Returns { props: PlayerProp[] } for the given game.
// - Only NFL / NBA / MLB / NHL are fetched; everything else returns [].
// - Only games starting within 48 hours trigger an API call; further-out
//   games return [] (or stale cache if we have it).
// - Responses are cached per-game for 1 hour in PropsCache.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const gameId = url.searchParams.get("gameId");
  const sportParam = url.searchParams.get("sport");

  if (!gameId || !sportParam) {
    return NextResponse.json(
      { error: "gameId and sport query params are required" },
      { status: 400 },
    );
  }

  if (!VALID_SPORTS.includes(sportParam as Sport)) {
    return NextResponse.json({ error: "Invalid sport" }, { status: 400 });
  }

  const sport = sportParam as Sport;

  // Short-circuit for sports that don't publish props at all.
  if (!sportSupportsProps(sport)) {
    return NextResponse.json({ props: [] });
  }

  // Look up the game's start time from the cached game odds so the
  // props helper can enforce the 48-hour window without the caller
  // having to pass startsAt.
  const games = await getOddsForSport(sport);
  const game = games.find((g) => g.id === gameId);
  const startsAt = game ? new Date(game.startsAt) : null;

  const props = await getPropsForGame(gameId, sport, startsAt);
  return NextResponse.json({ props });
}
