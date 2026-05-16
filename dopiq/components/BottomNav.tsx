"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LayoutGroup, motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { DopaminePulse } from "@/components/DopaminePulse";

const TABS = [
  { href: "/home",    label: "Home",    icon: HomeIcon },
  { href: "/shop",    label: "Shop",    icon: BagIcon },
  { href: "/food",    label: "Food",    icon: ForkIcon },
  { href: "/bet",     label: "Bet",     icon: ChartIcon },
  { href: "/tickets", label: "Tickets", icon: TicketIcon },
] as const;

// The floating Quick Sim button is hidden on pages that own a
// sticky/fixed bottom CTA (or prominent bottom action) it would
// overlap, and inside the Quick Sim flow itself. The 4 tabs always
// render. Patterns verified against actual app/(app) routes:
//   - /food/[id]   restaurant detail — RestaurantCheckoutBar (fixed)
//   - /food/checkout, /food/tracking — bottom CTAs
//   - /shop/[id]   product detail — AddToCartControls mobile fixed bar
//   - /shop/checkout, /shop/buy-now, /shop/confirmed — bottom CTAs
//   - /tickets/checkout (TicketsCheckout fixed bar), /tickets/confirmed
//   - /tickets/{concerts,sports,travel}/[id] — booking sticky bar
//   - /quick-sim(/...)  — already inside Quick Sim
// The negative lookaheads keep /food/cart and /shop/cart (which
// should KEEP the button) from matching the single-segment detail
// patterns.
const QUICK_SIM_HIDDEN_PATTERNS: RegExp[] = [
  /^\/food\/checkout$/,
  /^\/food\/tracking$/,
  /^\/food\/(?!cart$|checkout$|tracking$)[^/]+$/,
  /^\/shop\/checkout$/,
  /^\/shop\/buy-now$/,
  /^\/shop\/confirmed$/,
  /^\/shop\/(?!cart$|checkout$|buy-now$|confirmed$)[^/]+$/,
  /^\/tickets\/checkout$/,
  /^\/tickets\/confirmed$/,
  /^\/tickets\/(?:concerts|sports|travel)\/[^/]+$/,
  /^\/quick-sim(?:\/.*)?$/,
];

function shouldHideQuickSim(pathname: string): boolean {
  return QUICK_SIM_HIDDEN_PATTERNS.some((rx) => rx.test(pathname));
}

export function BottomNav({ excludeBet = false }: { excludeBet?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const reduce = useReducedMotion();
  // Hide the floating button the instant it's tapped — not after
  // usePathname() flips — so the continuously-animating circle
  // never renders uncovered during the route transition (the "ball
  // moving up" glitch). The effect clears the flag once the route
  // has stabilized (landed on /quick-sim, or navigated elsewhere
  // so the button can reappear on return).
  const [isNavigatingToQuickSim, setIsNavigatingToQuickSim] =
    useState(false);

  useEffect(() => {
    if (pathname === "/quick-sim" || !pathname.startsWith("/quick-sim")) {
      setIsNavigatingToQuickSim(false);
    }
  }, [pathname]);

  function handleQuickSimTap() {
    setIsNavigatingToQuickSim(true);
    router.push("/quick-sim");
  }

  const hideQuickSim =
    isNavigatingToQuickSim || shouldHideQuickSim(pathname);
  // iOS users never see the Bet tab — Apple prohibits gambling
  // features for individual developer accounts. Filtering rather
  // than rendering-and-hiding so the remaining tabs distribute
  // evenly. Tickets stays visible on iOS — the joke is on the
  // event industry, not on Apple's policy.
  const tabs = excludeBet ? TABS.filter((t) => t.href !== "/bet") : TABS;
  // The floating Quick Sim button floats dead-center above the
  // nav; a fixed-width invisible spacer at the middle of the tab
  // row opens a gap so no tab sits under it. For the iOS 4-tab
  // layout this lands the button perfectly centered.
  const midIndex = Math.floor(tabs.length / 2);

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 bg-[#F5EFE4]/95 backdrop-blur-sm md:hidden"
      aria-label="Primary"
    >
      <LayoutGroup>
        <ul className="mx-auto flex max-w-lg items-stretch justify-between safe-bottom">
          {tabs.map((t, i) => {
            const active =
              pathname === t.href || pathname.startsWith(t.href + "/");
            const Icon = t.icon;
            return (
              <FragmentWithSpacer
                key={t.href}
                showSpacerBefore={i === midIndex}
              >
                <li className="relative flex-1">
                  {active && (
                    <motion.div
                      layoutId="bottomnav-active-pill"
                      className="absolute inset-x-2 inset-y-1.5 rounded-2xl"
                      style={{ backgroundColor: "rgba(42,31,24,0.08)" }}
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 30,
                      }}
                    />
                  )}
                  <Link
                    href={t.href}
                    className={cn(
                      "relative z-10 flex h-14 flex-col items-center justify-center gap-0.5 text-[10px] font-semibold tracking-wide transition-colors duration-150",
                      active ? "text-navy" : "text-ink-muted",
                    )}
                  >
                    <motion.span
                      className="flex flex-col items-center gap-0.5"
                      whileTap={{ scale: 0.92 }}
                      transition={{ duration: 0.1 }}
                    >
                      <Icon active={active} />
                      <span className="mt-0.5">{t.label}</span>
                    </motion.span>
                  </Link>
                </li>
              </FragmentWithSpacer>
            );
          })}
        </ul>
      </LayoutGroup>

      {/* Floating Quick Sim action — pops above the nav's top edge,
          dead-center. Routes to the SAME /quick-sim entry the home
          page tile uses (no duplicate flow). Emerald .btn-primary
          gradient + cream cutout border + charged glow. Hidden on
          pages with their own sticky bottom CTA (and inside the
          Quick Sim flow); the 4 tabs + center spacer stay put so
          there's no layout jump between pages. */}
      {!hideQuickSim && (
        <div className="pointer-events-none absolute -top-7 left-1/2 flex -translate-x-1/2 flex-col items-center">
        {/* Continuous slow scale pulse on an outer wrapper so it
            never fights the button's whileTap; a Dopamine Pulse
            glow emanates from behind it on every page. Both
            reduced-motion-gated (DopaminePulse self-gates). */}
        <motion.div
          className="relative flex items-center justify-center"
          animate={
            reduce || isNavigatingToQuickSim
              ? undefined
              : { scale: [1, 1.02, 1] }
          }
          transition={
            reduce || isNavigatingToQuickSim
              ? undefined
              : { duration: 3, repeat: Infinity, ease: "easeInOut" }
          }
        >
          {!isNavigatingToQuickSim && (
            <DopaminePulse
              color="rgba(16,185,129,0.35)"
              className="inset-[-40%]"
            />
          )}
          <motion.button
            type="button"
            onClick={handleQuickSimTap}
            aria-label="Quick Sim"
            whileTap={{ scale: 0.94 }}
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.12 }}
            className="pointer-events-auto relative flex h-[60px] w-[60px] items-center justify-center rounded-full border-[3px]"
            style={{
              background:
                "linear-gradient(180deg, #1FCC97 0%, #10B981 60%, #0FB57E 100%)",
              borderColor: "#F5F0E6",
              boxShadow:
                "inset 0 1px 0 rgba(255,255,255,0.25), 0 8px 24px -4px rgba(16,185,129,0.45), 0 4px 8px -2px rgba(16,185,129,0.3)",
            }}
          >
            <span aria-hidden className="text-[24px] leading-none">
              ⚡
            </span>
          </motion.button>
        </motion.div>
        <span className="mt-1 text-[10px] font-semibold tracking-wide text-ink-muted">
          Quick Sim
        </span>
        </div>
      )}
    </nav>
  );
}

// Renders an invisible fixed-width spacer <li> immediately before
// the wrapped tab when it's the middle one, so the floating button
// has a clear gap to sit in.
function FragmentWithSpacer({
  showSpacerBefore,
  children,
}: {
  showSpacerBefore: boolean;
  children: React.ReactNode;
}) {
  return (
    <>
      {showSpacerBefore && <li aria-hidden className="w-16 flex-none" />}
      {children}
    </>
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
