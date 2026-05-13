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
  { href: "/tickets", label: "Tickets" },
];

export function TopNav({ excludeBet = false }: { excludeBet?: boolean }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  // iOS users never see the Bet tab — Apple prohibits gambling
  // features for individual developer accounts.
  const tabs = excludeBet ? TABS.filter((t) => t.href !== "/bet") : TABS;

  const name = session?.user?.name ?? "Guest";
  const initials = name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  const avatar = session?.user?.image;

  return (
    <header className="sticky top-0 z-40 bg-[#F5EFE4]/90 backdrop-blur-sm safe-top">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-5">

        {/* Logo */}
        <Link href="/home" className="flex items-center gap-3">
          <svg
            width="44"
            height="44"
            viewBox="0 0 44 44"
            fill="none"
            aria-hidden="true"
            className="flex-none"
          >
            <rect width="44" height="44" rx="10" fill="#00C853" />
            <path
              d="M10 10 L10 34 L18 34 Q30 34 30 22 Q30 10 18 10 Z"
              fill="white"
            />
            <line
              x1="10"
              y1="22"
              x2="27"
              y2="22"
              stroke="#00C853"
              strokeWidth="2.5"
            />
          </svg>
          <div className="flex flex-col leading-none">
            <span className="font-heading text-[28px] font-extrabold leading-none text-ink">
              dopiq
            </span>
            <span className="font-sans mt-[3px] text-[11px] font-medium text-ink-muted">
              spend smarter
            </span>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 md:flex" aria-label="Primary">
          {tabs.map((t) => {
            const active = pathname === t.href || pathname.startsWith(t.href + "/");
            return (
              <Link
                key={t.href}
                href={t.href}
                className={cn(
                  "relative py-2 text-[14px] font-semibold transition-colors duration-150",
                  active
                    ? "text-ink"
                    : "text-ink-muted hover:text-ink",
                )}
              >
                {t.label}
                {active && (
                  <span
                    aria-hidden
                    className="absolute -bottom-0.5 left-1/2 h-[3px] w-6 -translate-x-1/2 rounded-full bg-brand"
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* User menu — sole right-side element. The row's
            justify-between anchors it to the far right opposite
            the logo block; items-center keeps it vertically
            centered with the logo. */}
        <div className="relative" ref={ref}>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="flex h-9 items-center gap-2.5 rounded-pill border border-surface-border bg-white px-3 transition-all duration-150 hover:bg-surface-alt"
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
            <svg
              viewBox="0 0 16 16"
              className="h-3 w-3 text-ink-muted"
              fill="currentColor"
              aria-hidden
            >
              <path
                d="M4 6l4 4 4-4"
                stroke="currentColor"
                strokeWidth={1.5}
                fill="none"
                strokeLinecap="round"
              />
            </svg>
          </button>

          {open && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
              <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-2xl border border-surface-border bg-white py-1 shadow-cardHover">
                <div className="border-b border-surface-border px-4 py-2.5">
                  <p className="text-[13px] font-semibold text-ink">{name}</p>
                  <p className="text-[11px] text-ink-muted">
                    {session?.user?.email ?? "Guest"}
                  </p>
                </div>
                <div className="border-b border-surface-border px-4 py-2.5">
                  <UsageLine />
                </div>
                <Link
                  href="/settings"
                  onClick={() => setOpen(false)}
                  className="block w-full px-4 py-2.5 text-left text-[13px] font-medium text-ink transition hover:bg-surface-alt"
                >
                  Settings
                </Link>
                <button
                  type="button"
                  onClick={() => signOut({ callbackUrl: "/signin" })}
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

function UsageLine() {
  const { data: session } = useSession();
  const u = session?.user;
  const used = u?.simulationsUsed ?? 0;
  const limit = u?.simulationsLimit ?? 0;
  const status = u?.subscriptionStatus ?? null;

  if (status === "trialing") {
    return (
      <p className="text-[11px] font-semibold text-brand">
        Free trial · full access
      </p>
    );
  }

  if (limit >= 999_999) {
    return (
      <p className="text-[11px] font-semibold text-brand">
        Unlimited simulations
      </p>
    );
  }

  const remaining = Math.max(0, limit - used);
  return (
    <p className="text-[11px] font-semibold text-ink">
      <span className="font-mono tabular-nums">{remaining}</span>{" "}
      <span className="text-ink-muted">simulations remaining this month</span>
    </p>
  );
}
