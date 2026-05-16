"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
} from "framer-motion";

// Replaces the old global TopNav. The hamburger now lives only on
// /home and only while the user is at the very top of the page —
// position-based (scrollY < 10), NOT direction-based: scrolling
// back up mid-page does not bring it back; you have to return to
// the top. Settings is intentionally reachable only from here.
export function HomeHamburger() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [atTop, setAtTop] = useState(true);
  const ref = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();

  // Restored scroll position on back-nav means scrollY may already
  // be past the threshold before the first scroll event fires —
  // seed the state from the real value on mount.
  useEffect(() => {
    setAtTop(window.scrollY < 10);
  }, []);

  useMotionValueEvent(scrollY, "change", (current) => {
    const next = current < 10;
    setAtTop(next);
    // Don't strand the dropdown with no visible trigger once the
    // button has faded out.
    if (!next) setOpen(false);
  });

  // Defensive: this component is only rendered on /home, but the
  // path gate keeps it inert if it ever ends up elsewhere.
  if (pathname !== "/home") return null;

  const name = session?.user?.name ?? "Guest";

  return (
    <motion.div
      ref={ref}
      className="fixed right-4 top-[calc(env(safe-area-inset-top)+1rem)] z-40"
      animate={{
        opacity: atTop ? 1 : 0,
        pointerEvents: atTop ? "auto" : "none",
      }}
      initial={false}
      transition={
        reduce ? { duration: 0 } : { duration: 0.2, ease: "easeInOut" }
      }
    >
      {/* 3-line hamburger trigger — no pill, no border, no fill.
          40x40 tap target meets the iOS HIG minimum even though
          the icon itself is 20x14. */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        className="flex h-10 w-10 items-center justify-center text-ink transition-opacity active:opacity-60"
      >
        <svg width="20" height="14" viewBox="0 0 20 14" fill="none" aria-hidden>
          <line
            x1="0"
            y1="1.5"
            x2="20"
            y2="1.5"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
          />
          <line
            x1="0"
            y1="7"
            x2="20"
            y2="7"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
          />
          <line
            x1="0"
            y1="12.5"
            x2="20"
            y2="12.5"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
          />
        </svg>
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
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
    </motion.div>
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
