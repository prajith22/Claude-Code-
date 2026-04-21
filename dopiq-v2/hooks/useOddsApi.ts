import { useState, useEffect } from 'react';

const API_KEY = process.env.ODDS_API_KEY ?? '';
const BASE_URL = 'https://api.the-odds-api.com/v4';

export interface OddsGame {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers: Bookmaker[];
}

interface Bookmaker {
  key: string;
  title: string;
  markets: Market[];
}

interface Market {
  key: string;
  outcomes: Outcome[];
}

interface Outcome {
  name: string;
  price: number;
  point?: number;
}

export interface ParsedGame {
  id: string;
  sport: 'NFL' | 'NBA';
  homeTeam: string;
  awayTeam: string;
  commenceTime: string;
  moneyline: { home: number; away: number } | null;
  spread: { home: number; homePoint: number; away: number; awayPoint: number } | null;
  overUnder: { over: number; under: number; point: number } | null;
}

function parseOdds(raw: OddsGame, sport: 'NFL' | 'NBA'): ParsedGame {
  const bk = raw.bookmakers[0];
  const ml = bk?.markets.find((m) => m.key === 'h2h');
  const sp = bk?.markets.find((m) => m.key === 'spreads');
  const ou = bk?.markets.find((m) => m.key === 'totals');

  const homeOutcome = (market: Market | undefined) =>
    market?.outcomes.find((o) => o.name === raw.home_team);
  const awayOutcome = (market: Market | undefined) =>
    market?.outcomes.find((o) => o.name === raw.away_team);

  return {
    id: raw.id,
    sport,
    homeTeam: raw.home_team,
    awayTeam: raw.away_team,
    commenceTime: raw.commence_time,
    moneyline: ml
      ? { home: homeOutcome(ml)?.price ?? 0, away: awayOutcome(ml)?.price ?? 0 }
      : null,
    spread: sp
      ? {
          home: homeOutcome(sp)?.price ?? 0,
          homePoint: homeOutcome(sp)?.point ?? 0,
          away: awayOutcome(sp)?.price ?? 0,
          awayPoint: awayOutcome(sp)?.point ?? 0,
        }
      : null,
    overUnder: ou
      ? {
          over: ou.outcomes.find((o) => o.name === 'Over')?.price ?? 0,
          under: ou.outcomes.find((o) => o.name === 'Under')?.price ?? 0,
          point: ou.outcomes.find((o) => o.name === 'Over')?.point ?? 0,
        }
      : null,
  };
}

async function fetchGames(sportKey: string, sport: 'NFL' | 'NBA'): Promise<ParsedGame[]> {
  if (!API_KEY) return [];
  const url = `${BASE_URL}/sports/${sportKey}/odds/?apiKey=${API_KEY}&regions=us&markets=h2h,spreads,totals&oddsFormat=american`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data: OddsGame[] = await res.json();
  return data.map((g) => parseOdds(g, sport));
}

export function useOddsApi() {
  const [games, setGames] = useState<ParsedGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!API_KEY) {
      setGames(MOCK_GAMES);
      setLoading(false);
      return;
    }
    Promise.all([
      fetchGames('americanfootball_nfl', 'NFL'),
      fetchGames('basketball_nba', 'NBA'),
    ])
      .then(([nfl, nba]) => {
        setGames([...nfl, ...nba]);
        setLoading(false);
      })
      .catch(() => {
        setError('Could not load games');
        setGames(MOCK_GAMES);
        setLoading(false);
      });
  }, []);

  return { games, loading, error };
}

// Fallback mock data when no API key is set
const MOCK_GAMES: ParsedGame[] = [
  {
    id: 'mock-nfl-1',
    sport: 'NFL',
    homeTeam: 'Kansas City Chiefs',
    awayTeam: 'San Francisco 49ers',
    commenceTime: new Date(Date.now() + 86400000).toISOString(),
    moneyline: { home: -165, away: +140 },
    spread: { home: -3.5, homePoint: -3.5, away: +3.5, awayPoint: 3.5 },
    overUnder: { over: -110, under: -110, point: 47.5 },
  },
  {
    id: 'mock-nfl-2',
    sport: 'NFL',
    homeTeam: 'Dallas Cowboys',
    awayTeam: 'Philadelphia Eagles',
    commenceTime: new Date(Date.now() + 172800000).toISOString(),
    moneyline: { home: +115, away: -135 },
    spread: { home: +2.5, homePoint: 2.5, away: -2.5, awayPoint: -2.5 },
    overUnder: { over: -110, under: -110, point: 44.5 },
  },
  {
    id: 'mock-nfl-3',
    sport: 'NFL',
    homeTeam: 'Buffalo Bills',
    awayTeam: 'Miami Dolphins',
    commenceTime: new Date(Date.now() + 259200000).toISOString(),
    moneyline: { home: -180, away: +155 },
    spread: { home: -4.5, homePoint: -4.5, away: +4.5, awayPoint: 4.5 },
    overUnder: { over: -115, under: -105, point: 49.0 },
  },
  {
    id: 'mock-nba-1',
    sport: 'NBA',
    homeTeam: 'Los Angeles Lakers',
    awayTeam: 'Boston Celtics',
    commenceTime: new Date(Date.now() + 43200000).toISOString(),
    moneyline: { home: +125, away: -145 },
    spread: { home: +3.0, homePoint: 3.0, away: -3.0, awayPoint: -3.0 },
    overUnder: { over: -110, under: -110, point: 218.5 },
  },
  {
    id: 'mock-nba-2',
    sport: 'NBA',
    homeTeam: 'Golden State Warriors',
    awayTeam: 'Denver Nuggets',
    commenceTime: new Date(Date.now() + 129600000).toISOString(),
    moneyline: { home: -110, away: -110 },
    spread: { home: -1.0, homePoint: -1.0, away: +1.0, awayPoint: 1.0 },
    overUnder: { over: -108, under: -112, point: 224.0 },
  },
  {
    id: 'mock-nba-3',
    sport: 'NBA',
    homeTeam: 'Miami Heat',
    awayTeam: 'New York Knicks',
    commenceTime: new Date(Date.now() + 216000000).toISOString(),
    moneyline: { home: -130, away: +110 },
    spread: { home: -2.5, homePoint: -2.5, away: +2.5, awayPoint: 2.5 },
    overUnder: { over: -110, under: -110, point: 210.0 },
  },
];
