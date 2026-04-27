"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AnimatePresence,
  motion,
  type PanInfo,
  useMotionValue,
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
import { Pin, Card as CardIcon } from "@/components/icons";
import { useSimulationGuard } from "@/lib/use-simulation-guard";
import { useSavingsStore } from "@/lib/savings-store";
import { formatUSD } from "@/lib/utils";

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
      idx: number;
      selected: QuickSimItem[];
    }
  | {
      kind: "summary";
      location: QuickSimLocation;
      // Carry the queue forward so back-from-summary can re-show the
      // last card without re-shuffling (which would surface a different
      // 5-item subset and lose any items the user already swiped on).
      queue: QuickSimItem[];
      selected: QuickSimItem[];
    }
  | { kind: "flash"; totalCents: number };

const SWIPE_OFFSET = 100;
const SWIPE_VELOCITY = 500;

function todayDateStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function QuickSimFlow() {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>({ kind: "location" });
  const { tryRun, modal } = useSimulationGuard();
  const bumpSavings = useSavingsStore((s) => s.bump);

  function selectLocation(location: QuickSimLocation) {
    // Pick a fresh random 5 from the location's full 10 every time
    // the user lands here — so revisiting the same location keeps it
    // surprising.
    const queue = pickQuickSimItems(location.key);
    setStage({
      kind: "items",
      location,
      queue,
      idx: 0,
      selected: [],
    });
  }

  function decideItem(add: boolean) {
    setStage((s) => {
      if (s.kind !== "items") return s;
      const item = s.queue[s.idx];
      const nextSelected = add ? [...s.selected, item] : s.selected;
      const nextIdx = s.idx + 1;
      if (nextIdx >= s.queue.length) {
        return {
          kind: "summary",
          location: s.location,
          queue: s.queue,
          selected: nextSelected,
        };
      }
      return { ...s, idx: nextIdx, selected: nextSelected };
    });
  }

  async function commitSimulation(totalCents: number) {
    const allowed = await tryRun(async () => {
      // Credit savings synchronously enough that the green flash and
      // the post-flash home-page chip are in lockstep. Fire-and-forget
      // is OK — the bump fires after the response returns.
      try {
        await fetch("/api/savings/record", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            section: "shop",
            amount: totalCents / 100,
            todayDateStr: todayDateStr(),
          }),
        });
        bumpSavings();
      } catch {
        // best-effort — the green flash should not get blocked on a
        // flaky network. Streak / savings will reconcile next visit.
      }
      setStage({ kind: "flash", totalCents });
      window.setTimeout(() => router.push("/home"), 1900);
    });
    return allowed;
  }

  function commitFromSummary(selected: QuickSimItem[]) {
    const subtotalCents = selected.reduce((n, i) => n + i.priceCents, 0);
    if (subtotalCents === 0) {
      // Empty cart — credit nothing, but still flash so the user gets
      // their micro-reward for completing the simulation.
      setStage({ kind: "flash", totalCents: 0 });
      window.setTimeout(() => router.push("/home"), 1500);
      return;
    }
    // Grand total — matches the receipt the user just saw. Credit the
    // savings counter and drive the green-flash amount off the same
    // figure so "Saved $4.52" matches what the receipt's Total said.
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
      if (s.kind === "summary") {
        // Re-show the last card of the deck the user already swiped
        // through — same items, no new shuffle.
        return {
          kind: "items",
          location: s.location,
          queue: s.queue,
          idx: s.queue.length - 1,
          selected: s.selected,
        };
      }
      return s;
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#F5EFE4] safe-top">
      {stage.kind !== "flash" && (
        <Header
          showBack={stage.kind !== "location"}
          onBack={back}
          onClose={close}
        />
      )}

      <main className="relative flex flex-1 flex-col overflow-hidden">
        {stage.kind === "location" && (
          <LocationGrid onPick={selectLocation} />
        )}
        {stage.kind === "items" && (
          <ItemDeck
            stage={stage}
            onDecide={decideItem}
            onSkipAll={() =>
              setStage({
                kind: "summary",
                location: stage.location,
                queue: stage.queue,
                selected: stage.selected,
              })
            }
          />
        )}
        {stage.kind === "summary" && (
          <SummaryView
            selected={stage.selected}
            location={stage.location}
            onSimIt={() => commitFromSummary(stage.selected)}
            onAddMore={() => {
              // "Browse again" reshuffles for a fresh set of 5 — the
              // user is choosing to look at NEW items, not redo the
              // ones they already swiped through.
              const queue = pickQuickSimItems(stage.location.key);
              setStage({
                kind: "items",
                location: stage.location,
                queue,
                idx: 0,
                selected: stage.selected,
              });
            }}
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
      <p className="text-[12px] font-bold uppercase tracking-widest text-ink-muted">
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

function LocationGrid({
  onPick,
}: {
  onPick: (loc: QuickSimLocation) => void;
}) {
  return (
    <div className="flex flex-1 flex-col px-5 pb-8 pt-2">
      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="font-heading text-[36px] font-extrabold leading-tight tracking-tight text-ink md:text-[44px]"
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
        {QUICK_SIM_LOCATIONS.map((loc, i) => (
          <motion.button
            key={loc.key}
            type="button"
            onClick={() => onPick(loc)}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.35,
              delay: 0.1 + i * 0.04,
              ease: "easeOut",
            }}
            whileTap={{ scale: 0.97 }}
            className="card flex flex-col items-start gap-2 p-5 text-left transition hover:shadow-cardHover"
          >
            <span aria-hidden className="text-[40px] leading-none">
              {loc.emoji}
            </span>
            <p className="font-heading text-[18px] font-bold text-ink">
              {loc.name}
            </p>
            <p className="text-[12px] leading-snug text-ink-muted">
              {loc.subtitle}
            </p>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

// ---------- Step 2: item deck ----------

function ItemDeck({
  stage,
  onDecide,
  onSkipAll,
}: {
  stage: Extract<Stage, { kind: "items" }>;
  onDecide: (add: boolean) => void;
  onSkipAll: () => void;
}) {
  const total = stage.selected.reduce((n, i) => n + i.priceCents, 0);
  const remaining = stage.queue.length - stage.idx;
  const progress = ((stage.idx + 1) / stage.queue.length) * 100;
  const item = stage.queue[stage.idx];

  // Track which way the previous card exited so the AnimatePresence
  // exit variant slides off in that direction. The button taps and
  // swipes both call this before invoking onDecide.
  const [exitDir, setExitDir] = useState<"left" | "right">("right");
  function decide(add: boolean) {
    setExitDir(add ? "right" : "left");
    onDecide(add);
  }

  return (
    <div className="flex flex-1 flex-col px-5 pb-6 pt-2">
      {/* Top bar — running total + progress */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-ink-muted">
            Cart
          </p>
          <p className="font-mono text-[20px] font-extrabold leading-none text-brand">
            {formatUSD(total / 100)}
          </p>
          <p className="mt-1 text-[11px] text-ink-muted">
            {stage.selected.length} item{stage.selected.length === 1 ? "" : "s"}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[11px] font-bold uppercase tracking-widest text-ink-muted">
            Left
          </p>
          <p className="font-mono text-[20px] font-extrabold leading-none text-ink">
            {remaining}
          </p>
          <button
            type="button"
            onClick={onSkipAll}
            className="mt-1 text-[11px] font-semibold text-ink-muted hover:text-ink"
          >
            Skip rest →
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-surface-alt">
        <motion.div
          className="h-full bg-brand"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
      </div>

      {/* Card stage */}
      <div className="relative mt-6 flex flex-1 items-center justify-center">
        <AnimatePresence mode="popLayout" custom={exitDir}>
          <SwipeCard
            key={item.id}
            item={item}
            onDecide={decide}
          />
        </AnimatePresence>
      </div>

      {/* Permanent swipe hint — always visible, never dismissable. */}
      <p
        aria-hidden
        className="mt-3 text-center font-sans text-[12px] text-ink-muted"
      >
        ← Skip · Swipe to decide · Sim it →
      </p>

      {/* Bottom action buttons */}
      <div className="mt-4 flex items-center justify-center gap-6">
        <ActionButton
          variant="skip"
          onClick={() => decide(false)}
          ariaLabel="Skip"
        />
        <ActionButton
          variant="add"
          onClick={() => decide(true)}
          ariaLabel="Add to cart"
        />
      </div>
    </div>
  );
}

function SwipeCard({
  item,
  onDecide,
}: {
  item: QuickSimItem;
  onDecide: (add: boolean) => void;
}) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 0, 200], [-12, 0, 12]);
  // Add (right) flashes green; skip (left) flashes red — visible only
  // while dragging. Built from x with useTransform so it stays buttery.
  const greenOpacity = useTransform(x, [0, 80, 160], [0, 0.4, 0.7]);
  const redOpacity = useTransform(x, [-160, -80, 0], [0.5, 0.25, 0]);

  // Per-category pastel — icon, name, and price all inherit via
  // currentColor so we set the foreground once on the card root.
  const palette = QUICK_SIM_ICON_COLORS[item.iconKey];

  function handleDragEnd(_: unknown, info: PanInfo) {
    if (info.offset.x < -SWIPE_OFFSET || info.velocity.x < -SWIPE_VELOCITY) {
      onDecide(false);
    } else if (
      info.offset.x > SWIPE_OFFSET ||
      info.velocity.x > SWIPE_VELOCITY
    ) {
      onDecide(true);
    }
  }

  return (
    <motion.div
      key={item.id}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.6}
      onDragEnd={handleDragEnd}
      style={{
        x,
        rotate,
        backgroundColor: palette.bg,
        color: palette.fg,
      }}
      variants={{
        initial: { opacity: 0, y: 30, scale: 0.95 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: (dir: "left" | "right" | undefined) => ({
          x: dir === "right" ? 480 : dir === "left" ? -480 : 0,
          opacity: 0,
          scale: 0.9,
          transition: { duration: 0.25 },
        }),
      }}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{
        type: "spring",
        stiffness: 280,
        damping: 26,
      }}
      className="relative w-full max-w-sm cursor-grab touch-pan-y rounded-card p-8 shadow-cardHover active:cursor-grabbing"
    >
      {/* Green / red wash overlays driven by drag x — these are
          action signals (add vs skip), not card decoration, so they
          stay brand-green / red regardless of the card's pastel. */}
      <motion.div
        style={{ opacity: greenOpacity }}
        className="pointer-events-none absolute inset-0 rounded-card bg-brand"
      />
      <motion.div
        style={{ opacity: redOpacity }}
        className="pointer-events-none absolute inset-0 rounded-card bg-red-500"
      />

      <div className="relative flex flex-col items-center gap-5 text-center">
        <QuickSimItemIcon kind={item.iconKey} size={48} />
        <div className="space-y-2">
          <p className="font-heading text-[24px] font-extrabold leading-tight md:text-[28px]">
            {item.name}
          </p>
          <p className="font-mono text-[28px] font-extrabold md:text-[32px]">
            {formatUSD(item.priceCents / 100)}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

function ActionButton({
  variant,
  onClick,
  ariaLabel,
}: {
  variant: "skip" | "add";
  onClick: () => void;
  ariaLabel: string;
}) {
  const isSkip = variant === "skip";
  return (
    <motion.button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      whileTap={{ scale: 0.9 }}
      whileHover={{ scale: 1.05 }}
      transition={{ type: "spring", stiffness: 360, damping: 22 }}
      className={`flex h-16 w-16 items-center justify-center rounded-full shadow-cardHover ${
        isSkip
          ? "border-2 border-red-200 bg-white text-red-500"
          : "bg-brand text-white"
      }`}
    >
      {isSkip ? (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M6 6l12 12M18 6L6 18"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>
      ) : (
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="m5 12.5 5 5 9-10"
            stroke="currentColor"
            strokeWidth="2.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </motion.button>
  );
}

// ---------- Step 3: summary ----------

function SummaryView({
  selected,
  location,
  onSimIt,
  onAddMore,
}: {
  selected: QuickSimItem[];
  location: QuickSimLocation;
  onSimIt: () => void;
  onAddMore: () => void;
}) {
  const totalCents = selected.reduce((n, i) => n + i.priceCents, 0);

  if (selected.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 pb-10 text-center">
        <span aria-hidden className="text-[64px] leading-none">
          {location.emoji}
        </span>
        <p className="font-heading text-[28px] font-extrabold leading-tight text-ink">
          You skipped everything.
        </p>
        <p className="text-[15px] text-ink-muted">
          That’s the strongest sim of all. Want to look again?
        </p>
        <div className="mt-3 flex w-full max-w-sm flex-col gap-2">
          <button
            type="button"
            onClick={onAddMore}
            className="btn-secondary w-full"
          >
            Browse again
          </button>
          <button
            type="button"
            onClick={onSimIt}
            className="text-[13px] font-semibold text-ink-muted hover:text-ink"
          >
            Done — back to home
          </button>
        </div>
      </div>
    );
  }

  // Receipt math — subtotal + 8.25% tax, all rounded to cents so
  // "Subtotal + Tax = Total" never drifts by a penny on display.
  const subtotalCents = totalCents;
  const taxCents = Math.round(subtotalCents * TAX_RATE);
  const grandTotalCents = subtotalCents + taxCents;

  return (
    // min-h-0 is non-negotiable here — without it, the default
    // min-height: auto on a flex child stops overflow-y-auto from
    // engaging on iOS Safari, and any content past the viewport just
    // clips off (you'd see the items list cut mid-row, no scroll).
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-5 pt-2 safe-bottom">
      {/* Store header — feels like the location you're physically
          checking out at. */}
      <section className="rounded-card border border-[#E8E4E0] bg-white p-4 shadow-card">
        <p className="font-heading text-[18px] font-bold leading-tight text-ink">
          {location.name}
        </p>
        <p className="mt-1 flex items-center gap-1.5 text-[12px] text-ink-muted">
          <Pin size={12} className="flex-none" />
          {STORE_ADDRESSES[location.key]}
        </p>
      </section>

      <h1 className="mt-5 font-heading text-[28px] font-extrabold leading-tight text-ink md:text-[34px]">
        Ready to checkout?
      </h1>
      <p className="mt-1 text-[13px] text-ink-muted">
        {selected.length} item{selected.length === 1 ? "" : "s"} ·{" "}
        {location.name}
      </p>

      {/* Items — receipt block. Quantity bubble, name, price, hairline
          divider between rows, single white surface around the lot. */}
      <section className="mt-4 overflow-hidden rounded-card border border-[#E8E4E0] bg-white shadow-card">
        <ul className="divide-y divide-[#F0EAE0]">
          {selected.map((item) => (
            <li key={item.id} className="flex items-center gap-3 px-4 py-3">
              <span className="flex h-7 w-12 flex-none items-center justify-center rounded-full bg-surface-alt font-mono text-[12px] font-semibold text-ink-muted">
                x1
              </span>
              <p className="flex-1 text-[15px] font-bold text-ink">
                {item.name}
              </p>
              <p className="font-mono text-[15px] font-bold text-ink">
                {formatUSD(item.priceCents / 100)}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {/* Payment method — the most "this feels real" element on the
          page. The Saved pill mirrors what every checkout shows when
          a card is on file. */}
      <section className="mt-3 rounded-card border border-[#E8E4E0] bg-white p-4 shadow-card">
        <p className="text-[10px] font-bold uppercase tracking-widest text-ink-muted">
          Payment
        </p>
        <div className="mt-2 flex items-center gap-3">
          <span className="flex h-9 w-12 flex-none items-center justify-center rounded-lg bg-surface-alt text-ink">
            <CardIcon size={20} />
          </span>
          <p className="flex-1 text-[15px] font-bold text-ink">
            Visa ending in 4242
          </p>
          <span className="rounded-full bg-brand-light px-2.5 py-0.5 text-[11px] font-bold text-brand">
            Saved
          </span>
        </div>
      </section>

      {/* Receipt total breakdown — Subtotal / Tax / divider / Total
          mirroring an actual paper receipt. */}
      <section className="mt-4 rounded-card border border-[#E8E4E0] bg-white p-4 shadow-card">
        <div className="flex items-baseline justify-between text-[14px]">
          <span className="text-ink-muted">Subtotal</span>
          <span className="font-mono font-semibold text-ink">
            {formatUSD(subtotalCents / 100)}
          </span>
        </div>
        <div className="mt-2 flex items-baseline justify-between text-[14px]">
          <span className="text-ink-muted">Tax (8.25%)</span>
          <span className="font-mono font-semibold text-ink">
            {formatUSD(taxCents / 100)}
          </span>
        </div>
        <div className="my-3 h-px bg-[#F0EAE0]" />
        <div className="flex items-baseline justify-between">
          <span className="text-[13px] font-semibold uppercase tracking-widest text-ink-muted">
            Total
          </span>
          <span className="font-mono text-[26px] font-extrabold text-brand">
            {formatUSD(grandTotalCents / 100)}
          </span>
        </div>
      </section>

      <motion.button
        type="button"
        onClick={onSimIt}
        whileTap={{ scale: 0.98 }}
        className="btn-primary mt-5 w-full"
      >
        Sim It
      </motion.button>
      <p className="mt-2 pb-1 text-center text-[11px] text-ink-muted">
        Simulated checkout — no real money will be charged.
      </p>
    </div>
  );
}

// ---------- Step 4: green flash ----------

function GreenFlash({ totalCents }: { totalCents: number }) {
  // Two layered animations: an instant 200ms green wash that fades
  // over 300ms, plus a spring-bouncy checkmark + savings amount that
  // settle in as the wash fades.
  return (
    <motion.div
      key="flash"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-brand text-white"
    >
      {/* Quick wash to brand-vivid then fade back to brand */}
      <FlashWash />

      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{
          type: "spring",
          stiffness: 220,
          damping: 14,
          mass: 0.9,
          delay: 0.18,
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
            transition={{ delay: 0.32, duration: 0.45, ease: "easeOut" }}
          />
        </motion.svg>
      </motion.div>

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.3 }}
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
