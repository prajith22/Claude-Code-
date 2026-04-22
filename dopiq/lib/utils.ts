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
