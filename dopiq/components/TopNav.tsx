"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/home", label: "Home" },
  { href: "/shop", label: "Shop" },
  { href: "/food", label: "Food" },
  { href: "/bet", label: "Bet" },
  { href: "/tracker", label: "Tracker" },
];

export function TopNav() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-40 border-b border-surface-border bg-white/90 backdrop-blur safe-top">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
        <Link
          href="/home"
          className="flex items-center gap-2 text-[17px] font-semibold tracking-tight text-ink"
        >
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-brand text-white">
            <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden="true">
              <circle cx="10" cy="10" r="4" fill="currentColor" />
            </svg>
          </span>
          Dopiq
        </Link>
        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          {TABS.map((t) => {
            const active =
              pathname === t.href || pathname.startsWith(t.href + "/");
            return (
              <Link
                key={t.href}
                href={t.href}
                className={cn(
                  "rounded-full px-3 py-1.5 text-sm font-medium transition",
                  active
                    ? "bg-brand-light text-brand"
                    : "text-ink-muted hover:bg-surface-alt hover:text-ink",
                )}
              >
                {t.label}
              </Link>
            );
          })}
        </nav>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/" })}
          className="text-sm font-medium text-ink-muted hover:text-ink"
        >
          Sign out
        </button>
      </div>
    </header>
  );
}
