/**
 * Data file for the Tickets Simulator — Concerts, Sports, Travel.
 *
 * Every artist / team / venue / airline name in here is fabricated.
 * Real-world brands and copyrighted marks are intentionally absent:
 * the joke lands on the parody, not on the trademark.
 *
 * Prices are face-value baselines in whole dollars. SeatMap /
 * PlaneSeatMap apply tier multipliers and seat-by-seat variance at
 * render time; FeeBreakdown layers the Service / Convenience /
 * Facility / Processing / Delivery fees on top at checkout.
 */

// ─── Concerts ──────────────────────────────────────────────────────

export type ConcertGenre =
  | "Pop"
  | "Rap"
  | "Country"
  | "Indie"
  | "EDM"
  | "Rock"
  | "R&B";

export type TourDate = {
  id: string;
  date: string; // human-readable, display only
  city: string;
  venue: string;
};

export type ConcertArtist = {
  id: string;
  name: string;
  genre: ConcertGenre;
  tagline: string;
  basePrice: number;
  emoji: string;
  bgColor: string;
  fgColor: string;
  tourDates: TourDate[];
};

export const CONCERTS: ConcertArtist[] = [
  {
    id: "dj-microwave",
    name: "DJ Microwave",
    genre: "EDM",
    tagline: "The Reheat World Tour",
    basePrice: 95,
    emoji: "🎛️",
    bgColor: "#EDE7F6",
    fgColor: "#311B92",
    tourDates: [
      { id: "djm-1", date: "Jun 14, 2026", city: "Las Vegas, NV", venue: "The Sphere of Influence" },
      { id: "djm-2", date: "Jun 21, 2026", city: "Miami, FL", venue: "Dome Depot Arena" },
      { id: "djm-3", date: "Jul 03, 2026", city: "Brooklyn, NY", venue: "The Echo Bowl" },
      { id: "djm-4", date: "Jul 19, 2026", city: "Austin, TX", venue: "The Big Onion" },
    ],
  },
  {
    id: "fauxnce",
    name: "Fauxnce",
    genre: "Pop",
    tagline: "The Glass Onion Tour",
    basePrice: 210,
    emoji: "🧅",
    bgColor: "#FCE4EC",
    fgColor: "#880E4F",
    tourDates: [
      { id: "fxn-1", date: "May 30, 2026", city: "Los Angeles, CA", venue: "Skyline Coliseum" },
      { id: "fxn-2", date: "Jun 08, 2026", city: "Chicago, IL", venue: "Hangover Stadium" },
      { id: "fxn-3", date: "Jun 22, 2026", city: "Atlanta, GA", venue: "The Pickle Pavilion" },
    ],
  },
  {
    id: "cardio-b",
    name: "Cardio B",
    genre: "Rap",
    tagline: "The Resting Heart Rate Tour",
    basePrice: 175,
    emoji: "❤️‍🔥",
    bgColor: "#FFE0E0",
    fgColor: "#B71C1C",
    tourDates: [
      { id: "cdb-1", date: "Aug 02, 2026", city: "New York, NY", venue: "The Echo Bowl" },
      { id: "cdb-2", date: "Aug 15, 2026", city: "Houston, TX", venue: "Dome Depot Arena" },
      { id: "cdb-3", date: "Aug 28, 2026", city: "Phoenix, AZ", venue: "The Big Onion" },
      { id: "cdb-4", date: "Sep 11, 2026", city: "Detroit, MI", venue: "Skyline Coliseum" },
    ],
  },
  {
    id: "lil-punk",
    name: "Lil Punk",
    genre: "Rap",
    tagline: "Soft Boy, Hard Bars",
    basePrice: 120,
    emoji: "🦴",
    bgColor: "#E1F5FE",
    fgColor: "#01579B",
    tourDates: [
      { id: "lpk-1", date: "Jun 04, 2026", city: "Portland, OR", venue: "The Pickle Pavilion" },
      { id: "lpk-2", date: "Jun 18, 2026", city: "Denver, CO", venue: "Hangover Stadium" },
      { id: "lpk-3", date: "Jul 02, 2026", city: "Seattle, WA", venue: "The Echo Bowl" },
    ],
  },
  {
    id: "sabreena-carpentry",
    name: "Sabreena Carpentry",
    genre: "Pop",
    tagline: "Short n' Splintered Tour",
    basePrice: 155,
    emoji: "🔨",
    bgColor: "#FFF3E0",
    fgColor: "#BF360C",
    tourDates: [
      { id: "sbc-1", date: "May 22, 2026", city: "Nashville, TN", venue: "The Big Onion" },
      { id: "sbc-2", date: "Jun 06, 2026", city: "Boston, MA", venue: "Skyline Coliseum" },
      { id: "sbc-3", date: "Jun 20, 2026", city: "Philadelphia, PA", venue: "Hangover Stadium" },
      { id: "sbc-4", date: "Jul 04, 2026", city: "Toronto, ON", venue: "Dome Depot Arena" },
    ],
  },
  {
    id: "morgan-walmart",
    name: "Morgan Walmart",
    genre: "Country",
    tagline: "Aisle Five After Midnight Tour",
    basePrice: 110,
    emoji: "🛒",
    bgColor: "#FFF9C4",
    fgColor: "#5D4037",
    tourDates: [
      { id: "mwm-1", date: "Jul 12, 2026", city: "Dallas, TX", venue: "Hangover Stadium" },
      { id: "mwm-2", date: "Jul 25, 2026", city: "Oklahoma City, OK", venue: "The Pickle Pavilion" },
      { id: "mwm-3", date: "Aug 08, 2026", city: "St. Louis, MO", venue: "Skyline Coliseum" },
    ],
  },
  {
    id: "beyondce",
    name: "Beyondce",
    genre: "R&B",
    tagline: "The Cosmic Renaissance Tour",
    basePrice: 245,
    emoji: "🪩",
    bgColor: "#F3E5F5",
    fgColor: "#4A148C",
    tourDates: [
      { id: "bnc-1", date: "Jun 28, 2026", city: "New York, NY", venue: "Skyline Coliseum" },
      { id: "bnc-2", date: "Jul 11, 2026", city: "Los Angeles, CA", venue: "The Sphere of Influence" },
      { id: "bnc-3", date: "Jul 26, 2026", city: "London", venue: "Dome Depot Arena" },
      { id: "bnc-4", date: "Aug 09, 2026", city: "Paris", venue: "The Echo Bowl" },
    ],
  },
  {
    id: "the-killbillies",
    name: "The Killbillies",
    genre: "Rock",
    tagline: "Banjos & Brimstone Tour",
    basePrice: 85,
    emoji: "🪕",
    bgColor: "#E8F5E9",
    fgColor: "#1B5E20",
    tourDates: [
      { id: "kbl-1", date: "Jun 11, 2026", city: "Asheville, NC", venue: "The Big Onion" },
      { id: "kbl-2", date: "Jun 25, 2026", city: "Memphis, TN", venue: "The Pickle Pavilion" },
      { id: "kbl-3", date: "Jul 09, 2026", city: "Louisville, KY", venue: "Hangover Stadium" },
    ],
  },
  {
    id: "olive-rodrigo",
    name: "Olive Rodrigo",
    genre: "Indie",
    tagline: "Brined Tour",
    basePrice: 145,
    emoji: "🫒",
    bgColor: "#E8F5E9",
    fgColor: "#33691E",
    tourDates: [
      { id: "olr-1", date: "May 17, 2026", city: "San Francisco, CA", venue: "The Echo Bowl" },
      { id: "olr-2", date: "May 31, 2026", city: "Seattle, WA", venue: "Skyline Coliseum" },
      { id: "olr-3", date: "Jun 14, 2026", city: "Minneapolis, MN", venue: "The Big Onion" },
      { id: "olr-4", date: "Jun 28, 2026", city: "Chicago, IL", venue: "Hangover Stadium" },
    ],
  },
  {
    id: "bad-banana",
    name: "Bad Banana",
    genre: "Pop",
    tagline: "World Tour: Bruised but Beautiful",
    basePrice: 165,
    emoji: "🍌",
    bgColor: "#FFFDE7",
    fgColor: "#F57F17",
    tourDates: [
      { id: "bdb-1", date: "Jul 18, 2026", city: "Miami, FL", venue: "The Pickle Pavilion" },
      { id: "bdb-2", date: "Aug 01, 2026", city: "San Juan, PR", venue: "Dome Depot Arena" },
      { id: "bdb-3", date: "Aug 15, 2026", city: "Mexico City", venue: "The Sphere of Influence" },
    ],
  },
  {
    id: "drake-and-bake",
    name: "Drake & Bake",
    genre: "Rap",
    tagline: "Preheat to 425 Tour",
    basePrice: 185,
    emoji: "🥖",
    bgColor: "#FFF3E0",
    fgColor: "#8B2500",
    tourDates: [
      { id: "dab-1", date: "Jun 07, 2026", city: "Toronto, ON", venue: "Skyline Coliseum" },
      { id: "dab-2", date: "Jun 21, 2026", city: "New York, NY", venue: "Dome Depot Arena" },
      { id: "dab-3", date: "Jul 05, 2026", city: "Atlanta, GA", venue: "Hangover Stadium" },
      { id: "dab-4", date: "Jul 19, 2026", city: "Houston, TX", venue: "The Echo Bowl" },
    ],
  },
  {
    id: "the-weeknd-off",
    name: "The Weeknd Off",
    genre: "R&B",
    tagline: "After Hours, Before Brunch",
    basePrice: 195,
    emoji: "🌙",
    bgColor: "#ECEFF1",
    fgColor: "#263238",
    tourDates: [
      { id: "twk-1", date: "May 24, 2026", city: "Las Vegas, NV", venue: "The Sphere of Influence" },
      { id: "twk-2", date: "Jun 07, 2026", city: "Los Angeles, CA", venue: "Skyline Coliseum" },
      { id: "twk-3", date: "Jun 21, 2026", city: "Chicago, IL", venue: "Hangover Stadium" },
    ],
  },
];

// ─── Sports ────────────────────────────────────────────────────────

export type SportName =
  | "Football"
  | "Basketball"
  | "Baseball"
  | "Hockey"
  | "Soccer"
  | "Racing"
  | "Fighting";

export type SportsGame = {
  id: string;
  sport: SportName;
  homeTeam: string;
  awayTeam: string;
  venue: string;
  city: string;
  date: string;
  basePrice: number;
  emoji: string;
  bgColor: string;
  fgColor: string;
  tagline: string;
};

export const SPORTS_GAMES: SportsGame[] = [
  {
    id: "fb-dallas-chicago",
    sport: "Football",
    homeTeam: "Dallas Stallions",
    awayTeam: "Chicago Thunderbutts",
    venue: "Hangover Stadium",
    city: "Dallas, TX",
    date: "Sep 13, 2026",
    basePrice: 140,
    emoji: "🏈",
    bgColor: "#FFF3E0",
    fgColor: "#5D4037",
    tagline: "Division opener. Field-level prices, parking-lot vibes.",
  },
  {
    id: "fb-atlanta-phoenix",
    sport: "Football",
    homeTeam: "Atlanta Peach Pits",
    awayTeam: "Phoenix Cactus Crew",
    venue: "The Echo Bowl",
    city: "Atlanta, GA",
    date: "Oct 04, 2026",
    basePrice: 95,
    emoji: "🏈",
    bgColor: "#FCE4EC",
    fgColor: "#880E4F",
    tagline: "It's a rebuilding year. For everyone.",
  },
  {
    id: "bb-brooklyn-miami",
    sport: "Basketball",
    homeTeam: "Brooklyn Pretzels",
    awayTeam: "Miami Flamingos",
    venue: "The Sphere of Influence",
    city: "Brooklyn, NY",
    date: "Nov 21, 2026",
    basePrice: 165,
    emoji: "🏀",
    bgColor: "#FFEBEE",
    fgColor: "#B71C1C",
    tagline: "Both teams are tanking. The vibes are immaculate.",
  },
  {
    id: "bb-la-denver",
    sport: "Basketball",
    homeTeam: "LA Lifeguards",
    awayTeam: "Denver Yetis",
    venue: "Skyline Coliseum",
    city: "Los Angeles, CA",
    date: "Dec 09, 2026",
    basePrice: 220,
    emoji: "🏀",
    bgColor: "#E1F5FE",
    fgColor: "#0277BD",
    tagline: "Courtside is taken. By an actor you've heard of.",
  },
  {
    id: "ba-boston-vegas",
    sport: "Baseball",
    homeTeam: "Boston Cream Puffs",
    awayTeam: "Las Vegas Mirages",
    venue: "The Pickle Pavilion",
    city: "Boston, MA",
    date: "Jul 26, 2026",
    basePrice: 75,
    emoji: "⚾",
    bgColor: "#FFF9C4",
    fgColor: "#827717",
    tagline: "Nine innings, three hot dogs, one nap.",
  },
  {
    id: "ba-detroit-sandiego",
    sport: "Baseball",
    homeTeam: "Detroit Stray Cats",
    awayTeam: "San Diego Pelicans",
    venue: "Dome Depot Arena",
    city: "Detroit, MI",
    date: "Aug 14, 2026",
    basePrice: 55,
    emoji: "⚾",
    bgColor: "#FFFDE7",
    fgColor: "#3E2723",
    tagline: "Bring a coat. Even in August.",
  },
  {
    id: "hk-denver-seattle",
    sport: "Hockey",
    homeTeam: "Denver Yetis",
    awayTeam: "Seattle Squids",
    venue: "The Big Onion",
    city: "Denver, CO",
    date: "Feb 07, 2026",
    basePrice: 130,
    emoji: "🏒",
    bgColor: "#E0F2F1",
    fgColor: "#004D40",
    tagline: "A fight will break out. You came for that.",
  },
  {
    id: "hk-minnesota-toronto",
    sport: "Hockey",
    homeTeam: "Minnesota Walleyes",
    awayTeam: "Toronto Mooselords",
    venue: "The Sphere of Influence",
    city: "Minneapolis, MN",
    date: "Mar 14, 2026",
    basePrice: 105,
    emoji: "🏒",
    bgColor: "#E8F5E9",
    fgColor: "#1B5E20",
    tagline: "Two original-twenty teams. One sad zamboni.",
  },
  {
    id: "sc-nyc-portland",
    sport: "Soccer",
    homeTeam: "New York Pigeons",
    awayTeam: "Portland Drizzle",
    venue: "Hangover Stadium",
    city: "New York, NY",
    date: "Jun 13, 2026",
    basePrice: 85,
    emoji: "⚽",
    bgColor: "#F3E5F5",
    fgColor: "#4A148C",
    tagline: "Ninety minutes of running in vague directions.",
  },
  {
    id: "sc-austin-nashville",
    sport: "Soccer",
    homeTeam: "Austin Tacos",
    awayTeam: "Nashville Hot Chickens",
    venue: "The Pickle Pavilion",
    city: "Austin, TX",
    date: "Jul 11, 2026",
    basePrice: 70,
    emoji: "⚽",
    bgColor: "#FFE0B2",
    fgColor: "#E65100",
    tagline: "The promo posters were better than the squad.",
  },
  {
    id: "rc-grand-prix",
    sport: "Racing",
    homeTeam: "Grand Prix of Bad Decisions",
    awayTeam: "Field of 22",
    venue: "Dome Depot Arena",
    city: "Indianapolis, IN",
    date: "May 23, 2026",
    basePrice: 195,
    emoji: "🏎️",
    bgColor: "#FFEBEE",
    fgColor: "#C62828",
    tagline: "Four hours of left turns. Earplugs sold separately.",
  },
  {
    id: "fg-heavyweight",
    sport: "Fighting",
    homeTeam: "Heavyweight Championship",
    awayTeam: "Title Fight",
    venue: "The Echo Bowl",
    city: "Las Vegas, NV",
    date: "Oct 17, 2026",
    basePrice: 305,
    emoji: "🥊",
    bgColor: "#ECEFF1",
    fgColor: "#263238",
    tagline: "Main event starts at midnight. Bring caffeine.",
  },
];

// ─── Travel ────────────────────────────────────────────────────────

export type TravelAirline = {
  name: string;
  basePrice: number; // economy face value, one-way
  flightDuration: string;
  stops: number;
};

export type TravelDestination = {
  id: string;
  city: string;
  country: string;
  emoji: string;
  bgColor: string;
  fgColor: string;
  tagline: string;
  airlines: TravelAirline[];
};

export const TRAVEL_DESTINATIONS: TravelDestination[] = [
  {
    id: "tokyo",
    city: "Tokyo",
    country: "Japan",
    emoji: "🗼",
    bgColor: "#FCE4EC",
    fgColor: "#880E4F",
    tagline: "Vending machines, vending feelings.",
    airlines: [
      { name: "Delusion Airlines", basePrice: 1240, flightDuration: "13h 45m", stops: 0 },
      { name: "United We Fall", basePrice: 980, flightDuration: "17h 20m", stops: 1 },
      { name: "VirginNot Atlantic", basePrice: 1390, flightDuration: "14h 10m", stops: 0 },
    ],
  },
  {
    id: "paris",
    city: "Paris",
    country: "France",
    emoji: "🗼",
    bgColor: "#F3E5F5",
    fgColor: "#4A148C",
    tagline: "Wine, walking, mild contempt.",
    airlines: [
      { name: "AirSus", basePrice: 720, flightDuration: "7h 30m", stops: 0 },
      { name: "JetSkim Airways", basePrice: 540, flightDuration: "11h 05m", stops: 1 },
      { name: "VirginNot Atlantic", basePrice: 890, flightDuration: "7h 45m", stops: 0 },
    ],
  },
  {
    id: "bali",
    city: "Bali",
    country: "Indonesia",
    emoji: "🌴",
    bgColor: "#E8F5E9",
    fgColor: "#1B5E20",
    tagline: "Find yourself. Then post about it.",
    airlines: [
      { name: "Delusion Airlines", basePrice: 1180, flightDuration: "23h 15m", stops: 2 },
      { name: "Spirit of Regret Airlines", basePrice: 760, flightDuration: "28h 40m", stops: 3 },
      { name: "Southnorth Air", basePrice: 1340, flightDuration: "22h 50m", stops: 1 },
    ],
  },
  {
    id: "reykjavik",
    city: "Reykjavik",
    country: "Iceland",
    emoji: "🌋",
    bgColor: "#E1F5FE",
    fgColor: "#01579B",
    tagline: "Six hours of daylight. Forty bucks for soup.",
    airlines: [
      { name: "JetSkim Airways", basePrice: 480, flightDuration: "5h 50m", stops: 0 },
      { name: "AirSus", basePrice: 620, flightDuration: "6h 15m", stops: 0 },
      { name: "United We Fall", basePrice: 410, flightDuration: "9h 30m", stops: 1 },
    ],
  },
  {
    id: "cape-town",
    city: "Cape Town",
    country: "South Africa",
    emoji: "🦓",
    bgColor: "#FFF3E0",
    fgColor: "#BF360C",
    tagline: "The exchange rate gives you delusions of wealth.",
    airlines: [
      { name: "VirginNot Atlantic", basePrice: 1490, flightDuration: "16h 25m", stops: 1 },
      { name: "Delusion Airlines", basePrice: 1620, flightDuration: "15h 40m", stops: 0 },
      { name: "Southnorth Air", basePrice: 1310, flightDuration: "21h 05m", stops: 2 },
    ],
  },
  {
    id: "sydney",
    city: "Sydney",
    country: "Australia",
    emoji: "🦘",
    bgColor: "#E0F2F1",
    fgColor: "#004D40",
    tagline: "You'll lose a full day on the flight. Literally.",
    airlines: [
      { name: "Delusion Airlines", basePrice: 1580, flightDuration: "21h 40m", stops: 1 },
      { name: "AirSus", basePrice: 1740, flightDuration: "19h 55m", stops: 0 },
      { name: "Spirit of Regret Airlines", basePrice: 1190, flightDuration: "27h 30m", stops: 2 },
    ],
  },
  {
    id: "marrakech",
    city: "Marrakech",
    country: "Morocco",
    emoji: "🕌",
    bgColor: "#FFFDE7",
    fgColor: "#F57F17",
    tagline: "Three rugs. You'll come home with three rugs.",
    airlines: [
      { name: "AirSus", basePrice: 890, flightDuration: "9h 20m", stops: 1 },
      { name: "JetSkim Airways", basePrice: 670, flightDuration: "13h 10m", stops: 2 },
      { name: "VirginNot Atlantic", basePrice: 1040, flightDuration: "8h 45m", stops: 0 },
    ],
  },
  {
    id: "buenos-aires",
    city: "Buenos Aires",
    country: "Argentina",
    emoji: "🥩",
    bgColor: "#E1F5FE",
    fgColor: "#0277BD",
    tagline: "Dinner starts at 11. So does the second dinner.",
    airlines: [
      { name: "Southnorth Air", basePrice: 960, flightDuration: "10h 30m", stops: 0 },
      { name: "United We Fall", basePrice: 780, flightDuration: "14h 50m", stops: 1 },
      { name: "Delusion Airlines", basePrice: 1120, flightDuration: "11h 05m", stops: 0 },
    ],
  },
  {
    id: "lisbon",
    city: "Lisbon",
    country: "Portugal",
    emoji: "🐟",
    bgColor: "#EDE7F6",
    fgColor: "#311B92",
    tagline: "Pastel de nata for breakfast. And brunch. And lunch.",
    airlines: [
      { name: "AirSus", basePrice: 580, flightDuration: "7h 55m", stops: 0 },
      { name: "JetSkim Airways", basePrice: 460, flightDuration: "11h 40m", stops: 1 },
      { name: "VirginNot Atlantic", basePrice: 690, flightDuration: "8h 10m", stops: 0 },
    ],
  },
  {
    id: "bangkok",
    city: "Bangkok",
    country: "Thailand",
    emoji: "🍜",
    bgColor: "#FFEBEE",
    fgColor: "#C62828",
    tagline: "Eight dollars buys dinner for four. Or one massage.",
    airlines: [
      { name: "Delusion Airlines", basePrice: 1090, flightDuration: "20h 15m", stops: 1 },
      { name: "Spirit of Regret Airlines", basePrice: 740, flightDuration: "26h 50m", stops: 2 },
      { name: "Southnorth Air", basePrice: 1250, flightDuration: "19h 30m", stops: 1 },
    ],
  },
  {
    id: "rome",
    city: "Rome",
    country: "Italy",
    emoji: "🏛️",
    bgColor: "#FFF3E0",
    fgColor: "#8B2500",
    tagline: "A coin in the fountain guarantees you'll return broke.",
    airlines: [
      { name: "AirSus", basePrice: 760, flightDuration: "9h 10m", stops: 0 },
      { name: "VirginNot Atlantic", basePrice: 910, flightDuration: "8h 35m", stops: 0 },
      { name: "United We Fall", basePrice: 590, flightDuration: "12h 45m", stops: 1 },
    ],
  },
  {
    id: "mexico-city",
    city: "Mexico City",
    country: "Mexico",
    emoji: "🌵",
    bgColor: "#FFE0B2",
    fgColor: "#E65100",
    tagline: "Altitude sickness or mezcal — pick your hangover.",
    airlines: [
      { name: "Southnorth Air", basePrice: 380, flightDuration: "4h 50m", stops: 0 },
      { name: "Spirit of Regret Airlines", basePrice: 240, flightDuration: "8h 20m", stops: 1 },
      { name: "JetSkim Airways", basePrice: 320, flightDuration: "5h 15m", stops: 0 },
    ],
  },
];

// ─── Shared brand tokens ───────────────────────────────────────────

/**
 * Tickets-specific palette. Cream surface + emerald accents — read as
 * "premium ticketing" without colliding with the app-wide green brand.
 * Components import these instead of inlining hex.
 */
export const TICKETS_BRAND = {
  cream: "#F5F0E6",
  creamDeep: "#EEE7D6",
  emerald: "#10B981",
  emeraldDeep: "#0F9F73",
  ink: "#1A1A1A",
  inkSoft: "#4B4B4B",
} as const;

/** Convenience lookups so detail pages don't re-do the .find() dance. */
export function findConcert(id: string): ConcertArtist | undefined {
  return CONCERTS.find((c) => c.id === id);
}
export function findGame(id: string): SportsGame | undefined {
  return SPORTS_GAMES.find((g) => g.id === id);
}
export function findDestination(id: string): TravelDestination | undefined {
  return TRAVEL_DESTINATIONS.find((d) => d.id === id);
}
