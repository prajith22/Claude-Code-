"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/home",    label: "Home",    icon: HomeIcon },
  { href: "/shop",    label: "Shop",    icon: BagIcon },
  { href: "/food",    label: "Food",    icon: ForkIcon },
  { href: "/bet",     label: "Bet",     icon: ChartIcon },
  { href: "/tickets", label: "Tickets", icon: TicketIcon },
] as const;

export function BottomNav({ excludeBet = false }: { excludeBet?: boolean }) {
  const pathname = usePathname();
  // iOS users never see the Bet tab — Apple prohibits gambling
  // features for individual developer accounts. Filtering rather
  // than rendering-and-hiding so the remaining tabs distribute
  // evenly. Tickets stays visible on iOS — the joke is on the
  // event industry, not on Apple's policy.
  const tabs = excludeBet ? TABS.filter((t) => t.href !== "/bet") : TABS;
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 bg-[#F5EFE4]/95 backdrop-blur-sm md:hidden"
      aria-label="Primary"
    >
      <ul className="mx-auto flex max-w-lg items-stretch justify-between safe-bottom">
        {tabs.map((t) => {
          const active = pathname === t.href || pathname.startsWith(t.href + "/");
          const Icon = t.icon;
          return (
            <li key={t.href} className="flex-1">
              <Link
                href={t.href}
                className={cn(
                  "flex h-14 flex-col items-center justify-center gap-0.5 text-[10px] font-semibold tracking-wide transition-all duration-150",
                  active ? "text-navy" : "text-ink-muted",
                )}
              >
                <Icon active={active} />
                <span className="mt-0.5">{t.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

type IconProps = { active: boolean };

function HomeIcon({ active }: IconProps) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9.5Z"
        stroke="currentColor" strokeWidth={active ? 2.5 : 1.8} strokeLinejoin="round" fill={active ? "currentColor" : "none"} fillOpacity={active ? 0.12 : 0} />
    </svg>
  );
}
function BagIcon({ active }: IconProps) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M5 8h14l-1 12H6L5 8Z" stroke="currentColor" strokeWidth={active ? 2.5 : 1.8} strokeLinejoin="round" fill={active ? "currentColor" : "none"} fillOpacity={active ? 0.12 : 0} />
      <path d="M9 8a3 3 0 1 1 6 0" stroke="currentColor" strokeWidth={active ? 2.5 : 1.8} strokeLinecap="round" />
    </svg>
  );
}
function ForkIcon({ active }: IconProps) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M8 3v7a3 3 0 0 0 3 3v8M14 3c2 0 3 2 3 5s-1 5-3 5v7"
        stroke="currentColor" strokeWidth={active ? 2.5 : 1.8} strokeLinecap="round" />
    </svg>
  );
}
function TicketIcon({ active }: IconProps) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4V8Z"
        stroke="currentColor" strokeWidth={active ? 2.5 : 1.8} fill={active ? "currentColor" : "none"} fillOpacity={active ? 0.12 : 0} />
      <path d="M14 6v12" stroke="currentColor" strokeWidth={active ? 2.5 : 1.8} strokeDasharray="2 2" strokeLinecap="round" />
    </svg>
  );
}
function ChartIcon({ active }: IconProps) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 20V10M10 20V4M16 20v-7M22 20H2"
        stroke="currentColor" strokeWidth={active ? 2.5 : 1.8} strokeLinecap="round" />
    </svg>
  );
}
