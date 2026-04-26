"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useCartStore, cartSubtotal } from "@/lib/cart-store";
import { formatUSD } from "@/lib/utils";
import { useSimulationGuard } from "@/lib/use-simulation-guard";
import { useSavingsStore } from "@/lib/savings-store";

function todayDateStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function ShopCheckoutPage() {
  const router = useRouter();
  const lines = useCartStore((s) => s.shop);
  const clear = useCartStore((s) => s.clear);
  const [placing, setPlacing] = useState(false);
  const { tryRun, modal } = useSimulationGuard();
  const bumpSavings = useSavingsStore((s) => s.bump);

  useEffect(() => {
    if (lines.length === 0 && !placing) {
      router.replace("/shop/cart");
    }
  }, [lines.length, placing, router]);

  const subtotal = cartSubtotal(lines);

  async function placeOrder() {
    setPlacing(true);
    const allowed = await tryRun(async () => {
      const orderNumber = `DPQ-${Math.floor(Math.random() * 9_000_000 + 1_000_000)}`;
      sessionStorage.setItem(
        "dopiq-last-shop-order",
        JSON.stringify({ orderNumber, total: subtotal, count: lines.length }),
      );

      // Credit savings + streak — fire and forget; don't block the
      // confetti page on a network round-trip.
      fetch("/api/savings/record", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          section: "shop",
          amount: subtotal,
          todayDateStr: todayDateStr(),
        }),
      })
        .then(() => bumpSavings())
        .catch(() => {});

      clear("shop");
      router.push("/shop/confirmed");
    });
    if (!allowed) setPlacing(false);
  }

  return (
    <div className="space-y-6">
      <h1 className="pt-2 text-[24px] font-semibold tracking-tight">Checkout</h1>

      <Section title="Ship to">
        <Address />
      </Section>

      <Section title="Payment">
        <PaymentMethod />
      </Section>

      <Section title="Order summary">
        <div className="space-y-2 text-[15px]">
          <Row label={`Items (${lines.reduce((n, l) => n + l.qty, 0)})`} value={formatUSD(subtotal)} />
          <Row label="Shipping" value="Free" />
          <Row label="Tax" value="$0.00" />
          <div className="my-2 border-t border-surface-border" />
          <Row label="Order total" value={formatUSD(subtotal)} bold />
        </div>
      </Section>

      <button
        type="button"
        onClick={placeOrder}
        disabled={placing || lines.length === 0}
        className="btn-primary w-full"
      >
        {placing ? "Placing order…" : `Place order · ${formatUSD(subtotal)}`}
      </button>
      <p className="pb-2 text-center text-xs text-ink-muted">
        Simulated checkout. No real money will be charged.
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

function Address() {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="font-medium text-ink">You</p>
        <p className="mt-1 text-sm text-ink">
          1 Dopamine Way
          <br />
          Brooklyn, NY 11211
        </p>
      </div>
      <button type="button" className="text-sm text-brand">
        Change
      </button>
    </div>
  );
}

function PaymentMethod() {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-14 items-center justify-center rounded-lg bg-surface-alt text-xs font-semibold text-ink">
          VISA
        </div>
        <div>
          <p className="text-sm font-medium">•••• 4242</p>
          <p className="text-xs text-ink-muted">Exp 12/29 · Simulated card</p>
        </div>
      </div>
      <button type="button" className="text-sm text-brand">
        Change
      </button>
    </div>
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
