"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useCartStore, cartSubtotal } from "@/lib/cart-store";
import { formatUSD } from "@/lib/utils";
import { useSimulationGuard } from "@/lib/use-simulation-guard";
import { useSavingsStore } from "@/lib/savings-store";

const DELIVERY_FEE = 1.99;
const SERVICE_FEE = 2.49;

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
        <div className="space-y-2 text-[15px]">
          <Row label={`Items (${lines.reduce((n, l) => n + l.qty, 0)})`} value={formatUSD(subtotal)} />
          <Row label="Delivery fee" value={formatUSD(DELIVERY_FEE)} />
          <Row label="Service fee" value={formatUSD(SERVICE_FEE)} />
          <div className="my-2 border-t border-surface-border" />
          <Row label="Total" value={formatUSD(total)} bold />
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
        className="inline-flex w-full items-center justify-center rounded-pill bg-white px-6 py-3.5 text-[15px] font-semibold tracking-tight text-ink shadow-sm transition-all duration-150 hover:bg-surface-alt active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40"
      >
        {placing ? "Placing order…" : `Buy Now · ${formatUSD(total)}`}
      </button>
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
      <div className="card p-4">{children}</div>
    </section>
  );
}

function Row({
  label,
  value,
  bold,
}: {
  label: string;
  value: string;
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
