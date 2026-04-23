import clsx, { ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatUSD(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function americanOddsToPayout(stake: number, odds: number): number {
  if (odds >= 0) return stake * (odds / 100);
  return stake * (100 / Math.abs(odds));
}

export function americanOddsImpliedProb(odds: number): number {
  if (odds >= 0) return 100 / (odds + 100);
  return Math.abs(odds) / (Math.abs(odds) + 100);
}

export function formatOdds(odds: number): string {
  return odds >= 0 ? `+${odds}` : `${odds}`;
}

export function signed(n: number): string {
  if (n > 0) return `+${n}`;
  if (n === 0) return "PK";
  return `${n}`;
}

// American ↔ decimal odds + parlay combiner
export function americanToDecimal(odds: number): number {
  if (odds > 0) return odds / 100 + 1;
  return 100 / Math.abs(odds) + 1;
}

export function decimalToAmerican(dec: number): number {
  if (!isFinite(dec) || dec <= 1) return 0;
  if (dec >= 2) return Math.round((dec - 1) * 100);
  return Math.round(-100 / (dec - 1));
}

/** Combine a list of American odds into a single parlay American price. */
export function combineAmericanOdds(oddsList: number[]): number {
  if (oddsList.length === 0) return 0;
  const decimal = oddsList.reduce(
    (acc, o) => acc * americanToDecimal(o),
    1,
  );
  return decimalToAmerican(decimal);
}

export function combinedDecimal(oddsList: number[]): number {
  return oddsList.reduce((acc, o) => acc * americanToDecimal(o), 1);
}
