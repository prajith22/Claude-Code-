"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import confetti from "canvas-confetti";
import { cn } from "@/lib/utils";
import { playAchievementBell } from "@/lib/sounds";
import DeliveryMap from "@/components/food/DeliveryMap";
import { AnimatedAmount } from "@/components/AnimatedAmount";

type Stage = {
  key: string;
  label: string;
  caption: string;
  eta: string;
  icon: React.ReactNode;
};

const STAGES: Stage[] = [
  {
    key: "received",
    label: "Order received",
    caption: "The kitchen has your order.",
    eta: "Just now",
    icon: <ReceiptIcon />,
  },
  {
    key: "preparing",
    label: "Preparing your food",
    caption: "They just fired up the burner.",
    eta: "5–8 min",
    icon: <PanIcon />,
  },
  {
    key: "picked_up",
    label: "Driver picked up",
    caption: "Your driver is on the way out the door.",
    eta: "2–3 min",
    icon: <BagIcon />,
  },
  {
    key: "on_way",
    label: "On the way",
    caption: "Two turns away. Kind of.",
    eta: "4–6 min",
    icon: <CarIcon />,
  },
  {
    key: "delivered",
    label: "Delivered",
    caption: "Left at door. Enjoy.",
    eta: "Done",
    icon: <CheckIcon />,
  },
];

const STAGE_MS = 2400;

type LastOrder = {
  orderNumber: string;
  total: number;
  restaurant: string;
  itemCount: number;
  /** Set by the checkout page. "instant" skips the 5-stage
   *  animation and jumps straight to the delivered summary;
   *  "delivery" (or missing — back-compat with any older
   *  sessionStorage payloads) plays the existing 12-second
   *  tracker. */
  mode?: "delivery" | "instant";
};

export default function FoodTrackingPage() {
  const [stage, setStage] = useState(0);
  const [order, setOrder] = useState<LastOrder | null>(null);
  // Default to "delivery" so the existing tracker UI renders on
  // the first frame unchanged for users coming from the Order
  // Delivery button. The useEffect below flips to "instant" only
  // if the sessionStorage payload says so.
  const [mode, setMode] = useState<"delivery" | "instant">("delivery");
  const celebrated = useRef(false);

  useEffect(() => {
    const raw = sessionStorage.getItem("dopiq-last-food-order");
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as LastOrder;
      setOrder(parsed);
      if (parsed.mode === "instant") {
        setMode("instant");
        // Jump straight to the final stage so `delivered` flips
        // true on the next render — that triggers the confetti +
        // ding effect below and renders the summary card.
        setStage(STAGES.length - 1);
      }
    } catch {}
  }, []);

  useEffect(() => {
    // Auto-advance only applies to the delivery path. Instant mode
    // mounted with stage already set to the final index, so this
    // effect's guard returns early and no timer is scheduled.
    if (mode !== "delivery") return;
    if (stage >= STAGES.length - 1) return;
    const t = setTimeout(() => setStage((s) => s + 1), STAGE_MS);
    return () => clearTimeout(t);
  }, [stage, mode]);

  useEffect(() => {
    if (stage !== STAGES.length - 1 || celebrated.current) return;
    celebrated.current = true;
    playAchievementBell();
    const colors = ["#00A650", "#1A1A1A", "#ffffff"];
    const duration = 1400;
    const end = Date.now() + duration;
    const frame = () => {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 80,
        origin: { x: 0, y: 0.7 },
        colors,
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 80,
        origin: { x: 1, y: 0.7 },
        colors,
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }, [stage]);

  const progress = ((stage + 1) / STAGES.length) * 100;
  const current = STAGES[stage];
  const delivered = stage === STAGES.length - 1;

  return (
    <div className="space-y-6 pb-6">
      <div className="pt-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
          {order?.orderNumber ?? "Order"}
        </p>
        <h1 className="mt-1 text-[24px] font-semibold tracking-tight">
          {delivered ? "Delivered" : `From ${order?.restaurant ?? "your spot"}`}
        </h1>
      </div>

      {/* Tracker card — only rendered for the delivery path. The
          instant path never creates this JSX at all (not just
          hidden), so its 5-stage legend + progress bar + animated
          stage icon don't run. The summary card below still fires
          via the `delivered` flag because instant mode mounts with
          stage already at the final index. */}
      {mode === "delivery" && (
        <>
          <div className="surface-food p-5">
          <div className="flex items-center gap-4">
            <motion.div
              key={current.key}
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 220, damping: 16 }}
              className={cn(
                "flex h-14 w-14 items-center justify-center rounded-full",
                delivered ? "bg-brand text-white" : "bg-brand-light text-brand",
              )}
            >
              {current.icon}
            </motion.div>
            <div className="flex-1">
              <AnimatePresence mode="wait">
                <motion.div
                  key={current.key}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.25 }}
                >
                  <p className="text-[17px] font-semibold">{current.label}</p>
                  <p className="mt-0.5 text-sm text-ink-muted">
                    {current.caption}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>
            <span className="pill">{current.eta}</span>
          </div>

          <div className="mt-5 h-2 w-full overflow-hidden rounded-full bg-surface-alt">
            <motion.div
              className="h-full bg-brand"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
          </div>

          <ol className="mt-5 grid grid-cols-5 gap-1 text-[10px] font-medium">
            {STAGES.map((s, i) => (
              <li
                key={s.key}
                className={cn(
                  "text-center leading-tight",
                  i <= stage ? "text-ink" : "text-ink-muted",
                )}
              >
                {s.label.split(" ")[0]}
              </li>
            ))}
          </ol>
          </div>
          <DeliveryMap stage={stage} />
        </>
      )}

      {delivered && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="surface-food space-y-4 p-5"
        >
          <p className="text-[15px] font-semibold">Order summary</p>
          {order && (
            <dl className="space-y-2 text-[15px]">
              <div className="flex justify-between">
                <dt className="text-ink-muted">Restaurant</dt>
                <dd>{order.restaurant}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-muted">Items</dt>
                <dd>{order.itemCount}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-muted">Total</dt>
                <dd className="font-semibold">
                  <AnimatedAmount amount={order.total} />
                </dd>
              </div>
            </dl>
          )}
          <div className="rounded-xl bg-brand-light px-3 py-2 text-center text-xs font-medium text-brand">
            Simulated delivery · no charge
          </div>
          <div className="flex flex-col gap-2">
            <Link href="/food" className="btn-primary w-full">
              Order again
            </Link>
            <Link href="/home" className="btn-secondary w-full">
              Back to home
            </Link>
          </div>
        </motion.div>
      )}
    </div>
  );
}

function ReceiptIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden>
      <path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z" stroke="currentColor" strokeWidth={1.8} strokeLinejoin="round" />
      <path d="M9 8h6M9 12h6M9 16h4" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" />
    </svg>
  );
}
function PanIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden>
      <path d="M3 13h14a2 2 0 0 1 0 4H7a4 4 0 0 1-4-4Z" stroke="currentColor" strokeWidth={1.8} />
      <path d="M17 13V9" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" />
      <path d="M9 7c0-1 1-1 1-2s-1-1-1-2M13 7c0-1 1-1 1-2s-1-1-1-2" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" />
    </svg>
  );
}
function BagIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden>
      <path d="M6 8h12l-1 13H7L6 8Z" stroke="currentColor" strokeWidth={1.8} strokeLinejoin="round" />
      <path d="M9 8a3 3 0 1 1 6 0" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" />
    </svg>
  );
}
function CarIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden>
      <path d="M3 16v-3l2-5h14l2 5v3h-2a2 2 0 1 1-4 0H9a2 2 0 1 1-4 0H3Z" stroke="currentColor" strokeWidth={1.8} strokeLinejoin="round" />
      <path d="M5 13h14" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" />
    </svg>
  );
}
function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" aria-hidden>
      <path d="M5 12.5 10 17.5 19 7.5" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
