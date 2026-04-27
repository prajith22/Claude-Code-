"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AnimatePresence,
  motion,
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
import { Pin } from "@/components/icons";
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
      // Selected items can be toggled freely on the new tap-grid.
      // Order in the array matches tap order, which doesn't matter
      // for math but is stable for React keys.
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

  async function commitSimulation(totalCents: number) {
    const allowed = await tryRun(async () => {
      // Show the flash the instant the cap check passes — fire the
      // savings record in the background so the network round-trip
      // doesn't sit between the user's gesture and the flash. The
      // home-page chip bumps as soon as the request resolves; on a
      // flaky network it just reconciles on the next visit.
      setStage({ kind: "flash", totalCents });
      window.setTimeout(() => router.push("/home"), 1900);
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
    });
    return allowed;
  }

  function checkout(selected: QuickSimItem[]) {
    const subtotalCents = selected.reduce((n, i) => n + i.priceCents, 0);
    if (subtotalCents === 0) {
      // Empty cart — flash $0.00 so the user still gets the
      // satisfying completion. No savings credit, no cap consumed.
      setStage({ kind: "flash", totalCents: 0 });
      window.setTimeout(() => router.push("/home"), 1500);
      return;
    }
    // Grand total — applies the same 8.25% tax the receipt used to
    // surface, so the savings counter still credits the realistic
    // total instead of the tax-free subtotal.
    const taxCents = Math.round(subtotalCents * TAX_RATE);
    const grandTotalCents = subtotalCents + taxCents;
    void commitSimulation(grandTotalCents);
  }

  function close() {
    router.push("/home");
  }

  function back() {
    setStage((s) => (s.kind === "items" ? { kind: "location" } : s));
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
          <ItemSelectionGrid
            stage={stage}
            onToggle={toggleItem}
            onCheckout={() => checkout(stage.selected)}
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

// ---------- Step 2: item selection grid ----------

function ItemSelectionGrid({
  stage,
  onToggle,
  onCheckout,
}: {
  stage: Extract<Stage, { kind: "items" }>;
  onToggle: (item: QuickSimItem) => void;
  onCheckout: () => void;
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
      <section className="rounded-card border border-[#E8E4E0] bg-white p-4 shadow-card">
        <p className="font-heading text-[16px] font-bold leading-tight text-ink">
          {stage.location.name}
        </p>
        <p className="mt-1 flex items-center gap-1.5 text-[12px] text-ink-muted">
          <Pin size={12} className="flex-none" />
          {STORE_ADDRESSES[stage.location.key]}
        </p>
      </section>

      {/* Running total — selection count + subtotal updating live. */}
      <div className="mt-3 flex items-baseline justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-ink-muted">
            Cart
          </p>
          <p className="mt-0.5 text-[13px] text-ink">
            {stage.selected.length} of {stage.queue.length} selected
          </p>
        </div>
        <p className="font-mono text-[24px] font-extrabold leading-none text-brand">
          {formatUSD(subtotalCents / 100)}
        </p>
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

      {/* Slide-up-to-sim — sits at the bottom of the column via
          mt-auto. Always visible, always pressable — empty cart
          still triggers the flash with $0.00 (just won't credit
          savings). */}
      <div className="mt-auto flex justify-center pt-6">
        <SlideUpToSim onComplete={onCheckout} />
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
      whileTap={{ scale: 0.98 }}
      animate={{
        backgroundColor: selected ? "#E8F5E9" : "#FFF8E7",
        color: selected ? "#1B5E20" : "#5D4037",
      }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="flex w-full items-center gap-3 rounded-card px-4 py-3 text-left"
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
      {selected && (
        <span
          aria-hidden
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
        </span>
      )}
    </motion.button>
  );
}

// ---------- Step 3: slide-up-to-sim gesture ----------

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
          <p className="font-heading text-[16px] font-bold text-[#0A0F1E]">
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

// ---------- Step 4: green flash ----------

function GreenFlash({ totalCents }: { totalCents: number }) {
  // Two layered animations: an instant 200ms green wash that fades
  // over 300ms, plus a spring-bouncy checkmark + savings amount that
  // settle in as the wash fades.
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
