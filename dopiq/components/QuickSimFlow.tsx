"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "framer-motion";
import {
  QUICK_SIM_LOCATIONS,
  QUICK_SIM_ICON_COLORS,
  pickQuickSimItems,
  type QuickSimItem,
  type QuickSimLocation,
} from "@/data/quick-sim-items";
import { QuickSimItemIcon } from "@/components/QuickSimItemIcons";
import { Card, Pin } from "@/components/icons";
import { useSimulationGuard } from "@/lib/use-simulation-guard";
import { useSavingsStore } from "@/lib/savings-store";
import { playDing } from "@/lib/sounds";
import { formatUSD } from "@/lib/utils";
import { AnimatedAmount } from "@/components/AnimatedAmount";

const STORE_ADDRESSES: Record<QuickSimLocation["key"], string> = {
  gas: "2847 Highway Blvd, Austin TX 78701",
  convenience: "123 Main St, Austin TX 78702",
  grocery: "456 Oak Ave, Austin TX 78703",
  coffee: "789 Congress Ave, Austin TX 78704",
};

const TAX_RATE = 0.0825;

type Stage =
  | { kind: "location" }
  | {
      kind: "items";
      location: QuickSimLocation;
      queue: QuickSimItem[];
      // Selected items can be toggled freely on the new tap-grid.
      // Order in the array matches tap order, which doesn't matter
      // for math but is stable for React keys.
      selected: QuickSimItem[];
    }
  | {
      kind: "checkout";
      location: QuickSimLocation;
      queue: QuickSimItem[];
      selected: QuickSimItem[];
    }
  | { kind: "flash"; totalCents: number };

function todayDateStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function QuickSimFlow() {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>({ kind: "location" });
  const { modal, openLimit } = useSimulationGuard();
  const bumpSavings = useSavingsStore((s) => s.bump);
  // Holds the post-flash → /home redirect so the cap-check
  // reconciler can cancel it if the user turns out to be over cap.
  const redirectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const reducedMotion = useReducedMotion();

  function selectLocation(location: QuickSimLocation) {
    // Pick a fresh random 5 from the location's full 10 every time
    // the user lands here — so revisiting the same location keeps it
    // surprising.
    const queue = pickQuickSimItems(location.key);
    setStage({
      kind: "items",
      location,
      queue,
      selected: [],
    });
  }

  function toggleItem(item: QuickSimItem) {
    setStage((s) => {
      if (s.kind !== "items") return s;
      const exists = s.selected.some((i) => i.id === item.id);
      const nextSelected = exists
        ? s.selected.filter((i) => i.id !== item.id)
        : [...s.selected, item];
      return { ...s, selected: nextSelected };
    });
  }

  function commitSimulation(totalCents: number) {
    // Optimistic confirm: the green flash mounts on this synchronous
    // tick — nothing is awaited between the swipe release and the
    // flash. The cap check runs in PARALLEL; in the >99% under-cap
    // case nothing visible happens. tryRun is intentionally not used
    // here (it awaits the cap check first); its logic is replicated
    // inline so other tryRun consumers keep their pessimistic
    // behavior. Snapshot the checkout stage so a 403 can roll back.
    const prevStage = stage;

    setStage({ kind: "flash", totalCents });

    redirectTimeoutRef.current = setTimeout(
      () => router.push("/home"),
      1900,
    );

    // Savings record — fire-and-forget, unchanged.
    void fetch("/api/savings/record", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        section: "shop",
        amount: totalCents / 100,
        todayDateStr: todayDateStr(),
      }),
    })
      .then(() => bumpSavings())
      .catch(() => {});

    // Cap check in parallel. 403 → user is over plan: cancel the
    // redirect, roll back to the checkout screen, open the upgrade
    // modal. Any other outcome (200 / network error) → let the
    // flash continue (fail-open, mirroring tryRun's non-403 path).
    void fetch("/api/simulations/use", { method: "POST" })
      .then(async (res) => {
        if (res.status !== 403) return;
        const data = (await res.json().catch(() => ({}))) as {
          plan?: string | null;
          used?: number;
          limit?: number;
        };
        if (redirectTimeoutRef.current) {
          clearTimeout(redirectTimeoutRef.current);
          redirectTimeoutRef.current = null;
        }
        setStage(prevStage);
        openLimit(data);
      })
      .catch(() => {});
  }

  function goToCheckout() {
    setStage((s) =>
      s.kind === "items"
        ? {
            kind: "checkout",
            location: s.location,
            queue: s.queue,
            selected: s.selected,
          }
        : s,
    );
  }

  function confirmSim(selected: QuickSimItem[]) {
    const subtotalCents = selected.reduce((n, i) => n + i.priceCents, 0);
    if (subtotalCents === 0) {
      // Empty cart — flash $0.00 so the user still gets the
      // satisfying completion. No savings credit, no cap consumed.
      setStage({ kind: "flash", totalCents: 0 });
      window.setTimeout(() => router.push("/home"), 1500);
      return;
    }
    // Grand total — same 8.25% tax surfaced on the checkout summary
    // so what the user sees on the receipt is exactly what credits
    // the savings counter.
    const taxCents = Math.round(subtotalCents * TAX_RATE);
    const grandTotalCents = subtotalCents + taxCents;
    void commitSimulation(grandTotalCents);
  }

  function close() {
    router.push("/home");
  }

  function back() {
    setStage((s) => {
      if (s.kind === "items") return { kind: "location" };
      if (s.kind === "checkout") {
        return {
          kind: "items",
          location: s.location,
          queue: s.queue,
          selected: s.selected,
        };
      }
      return s;
    });
  }

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col bg-[#F5EFE4] safe-top ${
        stage.kind === "items" || stage.kind === "checkout"
          ? "mode-craving"
          : ""
      }`}
    >
      {/* Quick Sim atmosphere — two stacked emerald radial washes
          (top + bottom) behind all content. pointer-events-none +
          z-0 so it never blocks the close/back buttons; the Header,
          main, and flash layers are lifted to a higher z. Fades in
          once on mount; static at full opacity under reduced motion. */}
      <motion.div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            "radial-gradient(ellipse at top, rgba(16,185,129,0.08) 0%, transparent 50%), radial-gradient(ellipse at bottom, rgba(16,185,129,0.05) 0%, transparent 50%)",
        }}
        initial={reducedMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={reducedMotion ? { duration: 0 } : { duration: 0.4 }}
      />

      {stage.kind !== "flash" && (
        <div className="relative z-10">
          <Header
            showBack={stage.kind !== "location"}
            onBack={back}
            onClose={close}
          />
        </div>
      )}

      <main className="relative z-10 flex flex-1 flex-col overflow-hidden">
        {stage.kind === "location" && (
          <LocationGrid onPick={selectLocation} />
        )}
        {stage.kind === "items" && (
          <ItemSelectionGrid
            stage={stage}
            onToggle={toggleItem}
            onReview={goToCheckout}
          />
        )}
        {stage.kind === "checkout" && (
          <CheckoutSummary
            stage={stage}
            onConfirm={() => confirmSim(stage.selected)}
          />
        )}
      </main>

      <AnimatePresence>
        {stage.kind === "flash" && <GreenFlash totalCents={stage.totalCents} />}
      </AnimatePresence>

      {modal}
    </div>
  );
}

function Header({
  showBack,
  onBack,
  onClose,
}: {
  showBack: boolean;
  onBack: () => void;
  onClose: () => void;
}) {
  return (
    <header className="flex items-center justify-between px-5 py-3">
      {showBack ? (
        <button
          type="button"
          onClick={onBack}
          aria-label="Back"
          className="flex h-10 w-10 items-center justify-center rounded-full text-ink transition active:scale-95"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M15 18l-6-6 6-6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      ) : (
        <span className="h-10 w-10" />
      )}
      <p className="font-heading text-[12px] font-bold uppercase tracking-widest text-ink-muted type-flicker">
        Quick Sim
      </p>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="flex h-10 w-10 items-center justify-center rounded-full text-ink transition active:scale-95"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M6 6l12 12M18 6L6 18"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </header>
  );
}

// ---------- Step 1: location grid ----------

// Pastel palette per location — matches the rest of the app's
// pastel surfaces (Quick Sim items, onboarding cards, sign-in
// marketing). Each location gets one accent so the four cards
// read as four distinct moods at a glance.
// Each location is a "collectible" card: a soft pastel gradient,
// a 1.5px deeper-tone border, a top inset highlight, and an outer
// shadow whose second layer carries the card's own hue glow. fg /
// muted keep the existing per-card text tones. flash = the color
// briefly tinted full-screen on tap as an anticipation beat.
const LOCATION_COLORS: Record<
  QuickSimLocation["key"],
  {
    grad: string;
    border: string;
    glow: string;
    flash: string;
    fg: string;
    muted: string;
  }
> = {
  gas: {
    grad: "linear-gradient(180deg, #FEF3C7 0%, #FDE68A 100%)",
    border: "#F3D88C",
    glow: "rgba(245,158,11,0.15)",
    flash: "#FDE68A",
    fg: "#5D4037",
    muted: "#8D6E63",
  },
  convenience: {
    grad: "linear-gradient(180deg, #E0E7FF 0%, #C7D2FE 100%)",
    border: "#A5B4FC",
    glow: "rgba(99,102,241,0.15)",
    flash: "#C7D2FE",
    fg: "#1A237E",
    muted: "#3F51B5",
  },
  grocery: {
    grad: "linear-gradient(180deg, #D1FAE5 0%, #A7F3D0 100%)",
    border: "#6EE7B7",
    glow: "rgba(16,185,129,0.15)",
    flash: "#A7F3D0",
    fg: "#1B5E20",
    muted: "#2E7D32",
  },
  coffee: {
    grad: "linear-gradient(180deg, #FCE7F3 0%, #FBCFE8 100%)",
    border: "#F9A8D4",
    glow: "rgba(236,72,153,0.15)",
    flash: "#FBCFE8",
    fg: "#880E4F",
    muted: "#AD1457",
  },
};

function LocationGrid({
  onPick,
}: {
  onPick: (loc: QuickSimLocation) => void;
}) {
  // Brief full-screen color tint on tap → confirms the choice and
  // bridges into the item picker. Guarded so a double-tap can't
  // schedule onPick twice; timer cleared on unmount (e.g. the user
  // hits Close during the 350ms).
  const [flash, setFlash] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  function handlePick(loc: QuickSimLocation, flashColor: string) {
    if (flash) return;
    setFlash(flashColor);
    timerRef.current = setTimeout(() => onPick(loc), 350);
  }

  return (
    <div className="flex flex-1 flex-col px-5 pb-8 pt-2">
      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="type-hero-quicksim text-[48px] leading-tight tracking-tight md:text-[64px]"
      >
        Where are you?
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
        className="mt-2 text-[15px] text-ink-muted"
      >
        Pick the place. We’ll handle the urge.
      </motion.p>

      <div className="mt-6 grid flex-1 grid-cols-2 gap-3 content-start sm:gap-4">
        {QUICK_SIM_LOCATIONS.map((loc, i) => {
          const palette = LOCATION_COLORS[loc.key];
          return (
            <motion.button
              key={loc.key}
              type="button"
              onClick={() => handlePick(loc, palette.flash)}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.35,
                delay: 0.1 + i * 0.04,
                ease: "easeOut",
              }}
              whileTap={{ scale: 0.96 }}
              className="flex flex-col items-start gap-2 rounded-card p-5 text-left"
              style={{
                background: palette.grad,
                border: `1.5px solid ${palette.border}`,
                boxShadow: `inset 0 1px 0 rgba(255,255,255,0.4), 0 6px 16px -6px rgba(0,0,0,0.08), 0 2px 4px -2px ${palette.glow}`,
                color: palette.fg,
              }}
            >
              <span aria-hidden className="text-[40px] leading-none">
                {loc.emoji}
              </span>
              <p className="font-heading text-[18px] font-bold">
                {loc.name}
              </p>
              <p
                className="font-playful text-[12px] leading-snug type-pulse"
                style={{ color: palette.muted }}
              >
                {loc.subtitle}
              </p>
            </motion.button>
          );
        })}
      </div>

      {/* Anticipation tint — the picked card's color washes over
          the screen at 70% for 350ms, then onPick advances to the
          item picker. pointer-events-none so it never blocks. */}
      <AnimatePresence>
        {flash && (
          <motion.div
            key="qs-loc-flash"
            className="pointer-events-none fixed inset-0 z-50"
            style={{ backgroundColor: flash }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.7 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ---------- Step 2: item selection grid ----------

function ItemSelectionGrid({
  stage,
  onToggle,
  onReview,
}: {
  stage: Extract<Stage, { kind: "items" }>;
  onToggle: (item: QuickSimItem) => void;
  onReview: () => void;
}) {
  const subtotalCents = stage.selected.reduce(
    (n, i) => n + i.priceCents,
    0,
  );
  const isSelected = (id: string) =>
    stage.selected.some((i) => i.id === id);

  return (
    <div className="flex min-h-0 flex-1 flex-col px-5 pt-2 safe-bottom">
      {/* Store header — preserved from the receipt design. */}
      <section className="surface-quicksim p-4">
        <p className="font-heading text-[16px] font-bold leading-tight text-ink">
          {stage.location.name}
        </p>
        <p className="mt-1 flex items-center gap-1.5 text-[12px] text-ink-muted">
          <Pin size={12} className="flex-none" />
          {STORE_ADDRESSES[stage.location.key]}
        </p>
      </section>

      {/* Wellness framing — reminds the user this is a simulation,
          not a store. */}
      <p className="font-playful mt-2 text-center text-[12px] italic text-ink-muted type-pulse">
        Browse like it&rsquo;s real. Walk away like it&rsquo;s not.
      </p>

      {/* Running total — the hero of the screen. Counts up via the
          shared AnimatedAmount; emerald glow makes it the dominant
          element. */}
      <div className="mt-3 flex items-center justify-between">
        <div>
          <p className="font-heading text-[11px] font-bold uppercase tracking-widest text-ink-muted">
            Cart
          </p>
          <p className="mt-0.5 text-[13px] text-ink">
            {stage.selected.length} of {stage.queue.length} selected
          </p>
        </div>
        <AnimatedAmount
          amount={subtotalCents / 100}
          fromCurrent
          className="font-mono text-5xl font-extrabold leading-none text-brand [text-shadow:0_0_24px_rgba(16,185,129,0.3)]"
        />
      </div>

      {/* Item cards — tap to toggle. All five visible at once. */}
      <div className="mt-3 flex flex-col gap-2">
        {stage.queue.map((item) => (
          <ItemSelectCard
            key={item.id}
            item={item}
            selected={isSelected(item.id)}
            onClick={() => onToggle(item)}
          />
        ))}
      </div>

      {/* Review-Order CTA — full-width navy button at the bottom
          of the column. Always tappable; empty cart still routes to
          the checkout summary so the user can see the "No items
          selected" state. Outer wrapper carries the heartbeat pulse
          so it never fights the button's whileTap scale-down. */}
      <div className="mt-auto pt-6">
        <motion.div
          animate={{ scale: [1, 1.015, 1] }}
          transition={{ duration: 2.5, ease: "easeInOut", repeat: Infinity }}
        >
          <motion.button
            type="button"
            onClick={onReview}
            whileTap={{ scale: 0.97 }}
            className="relative w-full overflow-hidden rounded-pill py-4 font-heading text-[16px] font-bold text-white"
            style={{
              background:
                "linear-gradient(180deg, #1A2235 0%, #0A0F1E 60%, #050810 100%)",
              boxShadow:
                "inset 0 1px 0 rgba(255,255,255,0.15), 0 8px 20px -8px rgba(10,15,30,0.5), 0 4px 8px -4px rgba(10,15,30,0.3)",
            }}
          >
            <span className="relative z-10">Review Order</span>
            {/* Diagonal shine sweep — every ~5s (3s sweep + 2s
                delay). pointer-events-none + clipped to the pill. */}
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 overflow-hidden rounded-pill"
            >
              <motion.span
                className="absolute top-0 h-full w-1/3"
                style={{
                  background:
                    "linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.15) 50%, transparent 70%)",
                }}
                animate={{ x: ["-100%", "300%"] }}
                transition={{
                  duration: 3,
                  ease: "easeInOut",
                  repeat: Infinity,
                  repeatDelay: 2,
                }}
              />
            </span>
          </motion.button>
        </motion.div>
        <p className="font-playful mt-2 text-center text-[12px] italic text-ink-muted type-pulse">
          Simulated cart · No real charge
        </p>
      </div>
    </div>
  );
}

function ItemSelectCard({
  item,
  selected,
  onClick,
}: {
  item: QuickSimItem;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.97 }}
      className="flex w-full items-center gap-3 rounded-card px-4 py-3 text-left"
      style={{
        background: selected
          ? "linear-gradient(180deg, #D1FAE5 0%, #A7F3D0 100%)"
          : "linear-gradient(180deg, #FEF3C7 0%, #FDE68A 100%)",
        border: selected ? "1.5px solid #6EE7B7" : "1.5px solid #F3D88C",
        boxShadow: selected
          ? "inset 0 1px 0 rgba(255,255,255,0.4), 0 4px 12px -4px rgba(16,185,129,0.25)"
          : "0 2px 6px -2px rgba(0,0,0,0.06)",
        color: selected ? "#1B5E20" : "#5D4037",
        transition:
          "box-shadow 0.2s ease-out, border-color 0.2s ease-out, color 0.2s ease-out",
      }}
    >
      <span className="flex h-9 w-9 flex-none items-center justify-center">
        <QuickSimItemIcon kind={item.iconKey} size={22} />
      </span>
      <p className="flex-1 text-[15px] font-bold leading-tight">
        {item.name}
      </p>
      <p className="font-mono text-[15px] font-bold">
        {formatUSD(item.priceCents / 100)}
      </p>
      <AnimatePresence initial={false}>
        {selected && (
          <motion.span
            key="check"
            aria-hidden
            initial={{ scale: 0, rotate: -90 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: -90 }}
            transition={{ type: "spring", stiffness: 500, damping: 25 }}
            className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-[#1B5E20] text-white"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m5 12.5 5 5 9-10" />
            </svg>
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

// ---------- Step 3: checkout summary ----------

function CheckoutSummary({
  stage,
  onConfirm,
}: {
  stage: Extract<Stage, { kind: "checkout" }>;
  onConfirm: () => void;
}) {
  const subtotalCents = stage.selected.reduce(
    (n, i) => n + i.priceCents,
    0,
  );
  const taxCents = Math.round(subtotalCents * TAX_RATE);
  const totalCents = subtotalCents + taxCents;

  // Absolute-positioned scroll container instead of a flex-1 +
  // min-h-0 + overflow-y-auto column. The parent <main> is
  // `relative flex flex-1 overflow-hidden`, so absolute inset-0
  // gives this div a concrete pixel height (header-bottom →
  // viewport-bottom) and overflow-y-auto scrolls cleanly. iOS
  // Safari mis-computes nested flex+overflow heights and was
  // clipping the top of the receipt list with the previous flex
  // layout — this approach has zero ambiguous height inheritance.
  return (
    <>
      {/* pb accounts for the pinned slide-up-to-sim bar (~140px + safe area) */}
      <div className="absolute inset-0 overflow-y-auto px-5 pt-2 pb-[calc(140px+env(safe-area-inset-bottom))]">
      {/* Store header — same card as the item selection screen so
          the user sees continuity through the flow. */}
      <section className="surface-quicksim p-4">
        <p className="font-heading text-[16px] font-bold leading-tight text-ink">
          {stage.location.name}
        </p>
        <p className="mt-1 flex items-center gap-1.5 text-[12px] text-ink-muted">
          <Pin size={12} className="flex-none" />
          {STORE_ADDRESSES[stage.location.key]}
        </p>
      </section>

      {/* Receipt block — selected items with dividers between rows.
          Empty cart shows a single muted-italic placeholder. */}
      <section className="surface-quicksim mt-3 overflow-hidden rounded-card">
        {stage.selected.length === 0 ? (
          <p className="px-4 py-4 font-sans text-[14px] italic text-ink-muted">
            No items selected
          </p>
        ) : (
          stage.selected.map((item, i) => (
            <div
              key={item.id}
              className={`flex items-center gap-3 px-4 py-3 ${
                i > 0 ? "border-t border-[#F0EDE8]" : ""
              }`}
            >
              <span className="flex h-9 w-9 flex-none items-center justify-center">
                <QuickSimItemIcon kind={item.iconKey} size={22} />
              </span>
              <p className="flex-1 font-sans text-[15px] font-bold leading-tight text-ink">
                {item.name}
              </p>
              <p className="font-mono text-[15px] font-bold text-ink">
                {formatUSD(item.priceCents / 100)}
              </p>
            </div>
          ))
        )}
      </section>

      {/* Fake payment method — Visa ••FAKE with a "Saved" pill
          badge. Just dressing for the receipt feel; nothing real
          gets charged. */}
      <section className="surface-quicksim mt-3 flex items-center gap-3 rounded-card p-4">
        <span className="flex h-9 w-9 flex-none items-center justify-center text-ink">
          <Card size={22} />
        </span>
        <p className="flex-1 font-sans text-[15px] font-bold text-[#0A0F1E]">
          Visa ending in FAKE
        </p>
        <span className="rounded-pill bg-[#E8F5E9] px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-[#1B5E20]">
          Saved
        </span>
      </section>

      {/* Totals — subtotal + tax + divider + grand total. The grand
          total is the same number that gets credited to savings
          when the user slides up to confirm. */}
      <section className="surface-quicksim mt-3 rounded-card p-4">
        <div className="flex items-baseline justify-between">
          <p className="text-[13px] text-ink-muted">Subtotal</p>
          <p className="font-mono text-[15px] font-bold text-ink">
            {formatUSD(subtotalCents / 100)}
          </p>
        </div>
        <div className="mt-1.5 flex items-baseline justify-between">
          <p className="text-[13px] text-ink-muted">Tax (8.25%)</p>
          <p className="font-mono text-[15px] font-bold text-ink">
            {formatUSD(taxCents / 100)}
          </p>
        </div>
        <div className="my-3 h-px bg-[#F0EDE8]" />
        <div className="flex items-baseline justify-between">
          <p className="font-heading text-[15px] font-bold text-ink">Total</p>
          <p className="type-hero-amount text-[24px] font-extrabold text-brand">
            {formatUSD(totalCents / 100)}
          </p>
        </div>
      </section>

      </div>

      {/* Slide-up-to-sim gesture — checkout only. Pinned to the
          bottom of the relative <main> (= viewport bottom, since
          QuickSimFlow is a fixed inset-0 overlay) so it stays
          visible no matter how tall the receipt grows; the receipt
          scrolls under it. Drag math is element-local and the green
          wash is fixed inset-0, so absolute positioning here does
          not affect the gesture. The scroll container above carries
          matching bottom padding so the totals row clears this bar.
          Cream-gradient bar mirrors the Tickets booking sticky bar
          (visual only — NOT its .bottom-nav offset; this overlay
          covers the app BottomNav). */}
      <div
        className="absolute inset-x-0 bottom-0 z-20 flex justify-center px-4 pt-4 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]"
        style={{
          background: "linear-gradient(180deg, #FDFAF3 0%, #F9F4E8 100%)",
          borderTop: "1.5px solid #E5E0D5",
          boxShadow:
            "0 -1px 2px rgba(42,31,24,0.04), 0 -2px 8px rgba(42,31,24,0.06)",
        }}
      >
        <SlideUpToSim onComplete={onConfirm} />
      </div>
    </>
  );
}

// ---------- Step 4: slide-up-to-sim gesture ----------

// Mapping range for the green tint: 0px → tan, 200px upward → full
// brand-green. Drag progress is piped directly through useTransform
// with no intermediate state so finger position drives the wash
// frame-perfectly on iOS Safari.
const SLIDE_FULL_TINT_PX = 200;

function SlideUpToSim({ onComplete }: { onComplete: () => void }) {
  const y = useMotionValue(0);
  const [completing, setCompleting] = useState(false);

  const progress = useTransform(y, (v) =>
    Math.min(1, Math.max(0, -v / SLIDE_FULL_TINT_PX)),
  );
  // Green overlay opacity = drag progress. 0 at rest, 1 at 200px up.
  // Animating opacity (not background-color) keeps the wash on the
  // GPU compositor, so there's no repaint / no Safari jank.
  const tintOpacity = progress;
  // Arrow + label fade out by ~40% drag — the wash takes over.
  const promptOpacity = useTransform(progress, [0, 0.4], [1, 0]);
  // Pill grows upward via scaleY (transform-only, GPU-accelerated).
  // Anchored at the bottom edge so it appears to extend upward.
  const pillScaleY = progress;
  const pillOpacity = useTransform(progress, [0, 0.05, 1], [0, 1, 1]);

  function handleDragEnd() {
    if (completing) return;
    // Any upward drag — even a single pixel — fires completion on
    // lift. No threshold, no snap-back, no spring. Downward or
    // zero drag: do nothing.
    if (y.get() < 0) {
      setCompleting(true);
      onComplete();
    }
  }

  return (
    <>
      {/* Full-screen green wash — opacity-only animation so iOS
          Safari composites it on the GPU. pointer-events-none keeps
          the gesture flowing through. */}
      <motion.div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[5] bg-[#00C853]"
        style={{ opacity: tintOpacity }}
      />

      {/* Draggable indicator — vertical-only drag, hard stop at the
          200px tint range. No elastic, no momentum: position tracks
          the finger 1:1. */}
      <motion.div
        drag="y"
        dragConstraints={{ top: -SLIDE_FULL_TINT_PX, bottom: 0 }}
        dragElastic={0}
        dragMomentum={false}
        onDragEnd={handleDragEnd}
        style={{ y, touchAction: "none" }}
        className="relative z-10 flex min-h-[88px] w-40 cursor-grab flex-col items-center justify-end pb-2 active:cursor-grabbing"
      >
        {/* Layer 1 — brand-green pill, transform-only (scaleY) so it
            grows upward without triggering layout. */}
        <motion.div
          aria-hidden
          className="absolute bottom-2 left-1/2 h-16 w-16 -translate-x-1/2 rounded-pill bg-brand"
          style={{
            scaleY: pillScaleY,
            opacity: pillOpacity,
            transformOrigin: "bottom",
          }}
        />

        {/* Layer 2 — label + bouncing arrow. Fades out as the wash
            and pill take over. */}
        <motion.div
          style={{ opacity: promptOpacity }}
          className="relative z-10 flex flex-col items-center gap-1.5"
        >
          <p className="font-heading text-[16px] font-bold text-[#0A0F1E] type-magnetic type-glow-emerald">
            Slide up to sim
          </p>
          <motion.span
            aria-hidden
            animate={{ y: [0, -6, 0] }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="text-brand"
          >
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 19V5M5 12l7-7 7 7" />
            </svg>
          </motion.span>
        </motion.div>
      </motion.div>
    </>
  );
}

// ---------- Step 5: green flash ----------

function GreenFlash({ totalCents }: { totalCents: number }) {
  // Two layered animations: an instant 200ms green wash that fades
  // over 300ms, plus a spring-bouncy checkmark + savings amount that
  // settle in as the wash fades.
  useEffect(() => {
    playDing();
  }, []);

  return (
    <motion.div
      key="flash"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-brand text-white"
    >
      {/* Quick wash to brand-vivid then fade back to brand */}
      <FlashWash />

      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{
          type: "spring",
          stiffness: 260,
          damping: 16,
          mass: 0.7,
        }}
        className="relative flex h-28 w-28 items-center justify-center rounded-full bg-white text-brand shadow-lg"
      >
        <motion.svg
          viewBox="0 0 24 24"
          width="64"
          height="64"
          fill="none"
          aria-hidden
        >
          <motion.path
            d="m5 12.5 5 5 9-10"
            stroke="currentColor"
            strokeWidth={2.8}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ delay: 0.08, duration: 0.3, ease: "easeOut" }}
          />
        </motion.svg>
      </motion.div>

      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.18, duration: 0.2 }}
        className="mt-6 font-mono text-[40px] font-extrabold tabular-nums text-white md:text-[52px]"
      >
        Saved {formatUSD(totalCents / 100)}
      </motion.p>
    </motion.div>
  );
}

function FlashWash() {
  // Layered overlay: starts at brand-vivid (lighter) and fades to
  // transparent over 300ms, leaving the underlying `bg-brand` showing.
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.opacity = "1";
    const t = window.setTimeout(() => {
      el.style.transition = "opacity 300ms ease-out";
      el.style.opacity = "0";
    }, 200);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none absolute inset-0 bg-brand-vivid"
      style={{ opacity: 0 }}
    />
  );
}
