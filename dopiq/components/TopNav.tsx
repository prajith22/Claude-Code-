"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useRef, useState } from "react";
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
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const name = session?.user?.name ?? "Guest";
  const initials = name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  const avatar = session?.user?.image;

  return (
    <header className="sticky top-0 z-40 border-b border-surface-border bg-white/95 backdrop-blur-sm safe-top">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-5">
        <Link
          href="/home"
          className="flex items-center gap-2.5 text-[20px] font-bold tracking-tight text-navy"
        >
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-brand text-navy font-black text-[13px]">
            D
          </span>
          Dopiq
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          {TABS.map((t) => {
            const active = pathname === t.href || pathname.startsWith(t.href + "/");
            return (
              <Link
                key={t.href}
                href={t.href}
                className={cn(
                  "rounded-pill px-4 py-1.5 text-[14px] font-semibold transition-all duration-150",
                  active
                    ? "bg-navy text-white"
                    : "text-ink-muted hover:bg-surface-alt hover:text-ink",
                )}
              >
                {t.label}
              </Link>
            );
          })}
        </nav>

        <div className="relative" ref={ref}>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="flex items-center gap-2.5 rounded-pill border border-surface-border bg-surface-alt px-3 py-1.5 transition-all duration-150 hover:bg-surface-border"
          >
            {avatar ? (
              <Image
                src={avatar}
                alt={name}
                width={26}
                height={26}
                className="rounded-full"
              />
            ) : (
              <span className="inline-flex h-[26px] w-[26px] items-center justify-center rounded-full bg-navy text-[11px] font-bold text-white">
                {initials}
              </span>
            )}
            <span className="hidden text-[13px] font-semibold text-ink sm:block">
              {name.split(" ")[0]}
            </span>
            <svg viewBox="0 0 16 16" className="h-3 w-3 text-ink-muted" fill="currentColor" aria-hidden>
              <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth={1.5} fill="none" strokeLinecap="round" />
            </svg>
          </button>

          {open && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
              <div className="absolute right-0 top-full z-50 mt-2 w-44 rounded-2xl border border-surface-border bg-white py-1 shadow-cardHover">
                <div className="border-b border-surface-border px-4 py-2.5">
                  <p className="text-[13px] font-semibold text-ink">{name}</p>
                  <p className="text-[11px] text-ink-muted">{session?.user?.email ?? "Guest"}</p>
                </div>
                <button
                  type="button"
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="w-full px-4 py-2.5 text-left text-[13px] font-medium text-ink-muted transition hover:bg-surface-alt hover:text-ink"
                >
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
