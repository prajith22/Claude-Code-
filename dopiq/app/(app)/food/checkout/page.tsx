"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { useCartStore, cartSubtotal } from "@/lib/cart-store";
import { formatUSD } from "@/lib/utils";
import { useSimulationGuard } from "@/lib/use-simulation-guard";
import { useSavingsStore } from "@/lib/savings-store";
import { AnimatedAmount } from "@/components/AnimatedAmount";

const DELIVERY_FEE = 1.99;
const SERVICE_FEE = 2.49;

// Staggered fee-reveal choreography (mirrors the Tickets pattern;
// constants duplicated locally per brief — tiny surface).
const STAGGER_START_DELAY_S = 0.4;
const STAGGER_STEP_S = 0.35;
const TOTAL_COUNT_DURATION_S = 1.6;
const STAGGER_ROW_COUNT = 2; // Delivery fee, Service fee
const TOTAL_REVEAL_DELAY_S =
  STAGGER_START_DELAY_S + STAGGER_ROW_COUNT * STAGGER_STEP_S + 0.2; // 1.3s

function todayDateStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function FoodCheckoutPage() {
  const router = useRouter();
  const lines = useCartStore((s) => s.food);
  const clear = useCartStore((s) => s.clear);
  const [placing, setPlacing] = useState(false);
  const { tryRun, modal } = useSimulationGuard();
  const bumpSavings = useSavingsStore((s) => s.bump);

  useEffect(() => {
    if (lines.length === 0 && !placing) router.replace("/food/cart");
  }, [lines.length, placing, router]);

  const subtotal = cartSubtotal(lines);
  const total = subtotal + DELIVERY_FEE + SERVICE_FEE;

  // Fee-reveal timing — runs once on first view of the summary.
  const summaryRef = useRef<HTMLDivElement>(null);
  const inView = useInView(summaryRef, { once: true });
  const [revealed, setRevealed] = useState(false);
  const [landed, setLanded] = useState(false);

  useEffect(() => {
    if (!inView) return;
    const t1 = setTimeout(
      () => setRevealed(true),
      TOTAL_REVEAL_DELAY_S * 1000,
    );
    const t2 = setTimeout(
      () => setLanded(true),
      (TOTAL_REVEAL_DELAY_S + TOTAL_COUNT_DURATION_S) * 1000,
    );
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [inView]);

  const totalNode = (
    <motion.span
      animate={landed ? { scale: [1, 1.05, 1] } : { scale: 1 }}
      transition={{ duration: 0.3 }}
      style={{ display: "inline-block" }}
    >
      {revealed ? (
        <AnimatedAmount amount={total} duration={TOTAL_COUNT_DURATION_S} />
      ) : (
        formatUSD(total)
      )}
    </motion.span>
  );

  async function place(mode: "delivery" | "instant") {
    setPlacing(true);
    const allowed = await tryRun(async () => {
      const orderNumber = `DPQ-F-${Math.floor(Math.random() * 900_000 + 100_000)}`;
      const restaurant = lines[0]?.meta ?? "your spot";
      sessionStorage.setItem(
        "dopiq-last-food-order",
        JSON.stringify({
          orderNumber,
          total,
          restaurant,
          itemCount: lines.length,
          // `mode` rides on the sessionStorage payload only — the
          // /api/savings/record body stays unchanged across both
          // paths. The tracking page reads this field on mount to
          // decide whether to play the 12-second 5-stage animation
          // or jump straight to the delivered summary.
          mode,
        }),
      );

      fetch("/api/savings/record", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          section: "food",
          amount: total,
          todayDateStr: todayDateStr(),
        }),
      })
        .then(() => bumpSavings())
        .catch(() => {});

      clear("food");
      router.push("/food/tracking");
    });
    if (!allowed) setPlacing(false);
  }

  return (
    <div className="space-y-6">
      <h1 className="pt-2 text-[24px] font-semibold tracking-tight">Checkout</h1>

      <Section title="Deliver to">
        <p className="font-medium text-ink">Home</p>
        <p className="mt-1 text-sm text-ink">1 Dopamine Way · Brooklyn, NY</p>
        <p className="mt-1 text-xs text-ink-muted">Leave at door, no contact.</p>
      </Section>

      <Section title="Payment">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-14 items-center justify-center rounded-lg bg-surface-alt text-xs font-semibold text-ink">
            VISA
          </div>
          <div>
            <p className="text-sm font-medium">•••• FAKE</p>
            <p className="text-xs text-ink-muted">Simulated card</p>
          </div>
        </div>
      </Section>

      <Section title="Order summary">
        <div ref={summaryRef} className="space-y-2 text-[15px]">
          {/* Itemized lines — qty + name on the left, line total on
              the right. Restaurant (l.meta) is intentionally omitted:
              it's already implied by the checkout context. Guarded on
              lines.length so an edge-case empty cart skips straight
              to the fee breakdown instead of rendering an empty list
              + dangling divider. */}
          {lines.length > 0 && (
            <>
              <ul className="space-y-1.5">
                {lines.map((l) => (
                  <li
                    key={l.id}
                    className="flex items-center justify-between gap-3 text-[14px] font-medium"
                  >
                    <span className="min-w-0 truncate text-ink-muted">
                      {l.qty}x {l.name}
                    </span>
                    <span className="flex-none text-ink">
                      {formatUSD(l.price * l.qty)}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="my-2 border-t border-surface-border" />
            </>
          )}
          <Row label={`Items (${lines.reduce((n, l) => n + l.qty, 0)})`} value={formatUSD(subtotal)} />
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: STAGGER_START_DELAY_S }}
          >
            <Row label="Delivery fee" value={formatUSD(DELIVERY_FEE)} />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.3,
              delay: STAGGER_START_DELAY_S + STAGGER_STEP_S,
            }}
          >
            <Row label="Service fee" value={formatUSD(SERVICE_FEE)} />
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: TOTAL_REVEAL_DELAY_S }}
          >
            <div className="my-2 border-t border-surface-border" />
            <Row label="Total" value={totalNode} bold />
          </motion.div>
        </div>
      </Section>

      {/* Two-path commit — same savings record, same summary, same
          cart clear. Only the post-commit experience differs:
          Delivery plays the 12-second tracker, Buy Now jumps
          straight to the delivered state. Label sits above so the
          user reads "I'm picking between two paths," not "the
          second button is a skip / advanced option." */}
      <p className="pt-2 text-center text-[13px] italic text-ink-muted">
        Take your time, or skip the wait.
      </p>
      <button
        type="button"
        onClick={() => place("delivery")}
        disabled={placing || lines.length === 0}
        className="btn-primary w-full"
      >
        {placing ? "Placing order…" : `Order Delivery · ${formatUSD(total)}`}
      </button>
      <button
        type="button"
        onClick={() => place("instant")}
        disabled={placing || lines.length === 0}
        className="pill-glass inline-flex w-full items-center justify-center rounded-pill px-6 py-3.5 text-[15px] font-semibold tracking-tight text-ink transition-all duration-150 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40"
      >
        {placing ? "Placing order…" : `Buy Now · ${formatUSD(total)}`}
      </button>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: TOTAL_REVEAL_DELAY_S }}
        className="font-playful text-center text-xs italic text-ink-muted"
      >
        {revealed ? (
          <AnimatedAmount amount={total} duration={TOTAL_COUNT_DURATION_S} />
        ) : (
          formatUSD(total)
        )}{" "}
        kept · Your wallet survived
      </motion.p>
      <p className="pb-2 text-center text-xs text-ink-muted">
        Simulated order. No real food, no real charge.
      </p>

      {modal}
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="mb-2 text-[13px] font-semibold uppercase tracking-wide text-ink-muted">
        {title}
      </h2>
      <div className="surface-food p-4">{children}</div>
    </section>
  );
}

function Row({
  label,
  value,
  bold,
}: {
  label: string;
  value: React.ReactNode;
  bold?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className={bold ? "font-semibold text-ink" : "text-ink-muted"}>
        {label}
      </span>
      <span className={bold ? "font-semibold text-ink" : "text-ink"}>
        {value}
      </span>
    </div>
  );
}
