"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import type { Product } from "@/types";
import { formatUSD } from "@/lib/utils";
import { useSimulationGuard } from "@/lib/use-simulation-guard";
import { useSavingsStore } from "@/lib/savings-store";
import { AnimatedAmount } from "@/components/AnimatedAmount";

const BUY_NOW_KEY = "dopiq-buy-now-shop";

function todayDateStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// Single-product express checkout. Intentionally isolated from
// useCartStore.shop — the product is carried in via sessionStorage
// ("dopiq-buy-now-shop") so a user's real cart is never read,
// written, or cleared by this flow. On confirm it writes the same
// "dopiq-last-shop-order" payload the multi-item /shop/checkout
// writes, so /shop/confirmed renders unchanged for both paths.
export default function ShopBuyNowPage() {
  const router = useRouter();
  const [item, setItem] = useState<Product | null>(null);
  const [placing, setPlacing] = useState(false);
  const { tryRun, modal } = useSimulationGuard();
  const bumpSavings = useSavingsStore((s) => s.bump);

  useEffect(() => {
    const raw = sessionStorage.getItem(BUY_NOW_KEY);
    if (!raw) {
      router.replace("/shop");
      return;
    }
    try {
      const parsed = JSON.parse(raw) as Product;
      // Defensive: a malformed / partial payload (hand-edited
      // sessionStorage, schema drift) can't render a coherent
      // preview — bounce back to /shop rather than crash.
      if (
        !parsed ||
        typeof parsed.name !== "string" ||
        typeof parsed.price !== "number"
      ) {
        router.replace("/shop");
        return;
      }
      setItem(parsed);
    } catch {
      router.replace("/shop");
    }
  }, [router]);

  // Nothing to show until the sessionStorage read resolves (or the
  // redirect fires). Rendering null avoids a flash of empty chrome.
  if (!item) return null;

  const total = item.price;

  function cancel() {
    sessionStorage.removeItem(BUY_NOW_KEY);
    router.push("/shop");
  }

  async function place() {
    if (!item) return;
    setPlacing(true);
    const allowed = await tryRun(async () => {
      const orderNumber = `DPQ-${Math.floor(Math.random() * 9_000_000 + 1_000_000)}`;

      sessionStorage.setItem(
        "dopiq-last-shop-order",
        JSON.stringify({ orderNumber, total: item.price, count: 1 }),
      );

      // Fire-and-forget — don't block the confetti page on a
      // network round-trip. Single-product amount only.
      fetch("/api/savings/record", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          section: "shop",
          amount: item.price,
          todayDateStr: todayDateStr(),
        }),
      })
        .then(() => bumpSavings())
        .catch(() => {});

      sessionStorage.removeItem(BUY_NOW_KEY);
      router.push("/shop/confirmed");
    });
    if (!allowed) setPlacing(false);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="pt-2 text-[24px] font-semibold tracking-tight">
          Buy Now
        </h1>
        <p className="mt-1 text-[14px] text-ink-muted">
          One product. One tap. Savings logged.
        </p>
      </div>

      {/* Single-product preview — explicit 2.5px warm-dark frame
          per the brief, so the one thing being bought reads as the
          hero of the page. */}
      <div
        className="overflow-hidden rounded-card border-[2.5px] bg-white shadow-card"
        style={{ borderColor: "#2A1F18" }}
      >
        <div className="relative aspect-[4/3] w-full bg-surface-alt">
          <Image
            src={item.imageUrl}
            alt={item.name}
            fill
            sizes="(max-width: 640px) 100vw, 600px"
            className="object-cover"
          />
        </div>
        <div className="flex items-start justify-between gap-4 p-4">
          <div className="min-w-0">
            <p className="text-[16px] font-bold leading-snug text-ink">
              {item.name}
            </p>
            <p className="mt-1 text-[12px] font-semibold uppercase tracking-wide text-ink-muted">
              {item.category}
            </p>
          </div>
          <p className="flex-none text-[18px] font-bold text-navy money">
            {formatUSD(item.price)}
          </p>
        </div>
      </div>

      <Section title="Ship to">
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
      </Section>

      <Section title="Payment">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-14 items-center justify-center rounded-lg bg-surface-alt text-xs font-semibold text-ink">
              VISA
            </div>
            <div>
              <p className="text-sm font-medium">•••• FAKE</p>
              <p className="text-xs text-ink-muted">
                Exp 12/29 · Simulated card
              </p>
            </div>
          </div>
          <button type="button" className="text-sm text-brand">
            Change
          </button>
        </div>
      </Section>

      <Section title="Order summary">
        <div className="space-y-2 text-[15px]">
          <ul className="space-y-1.5">
            <li className="flex items-center justify-between gap-3 text-[14px] font-medium">
              <span className="min-w-0 truncate text-ink-muted">
                1x {item.name}
              </span>
              <span className="flex-none text-ink">
                {formatUSD(item.price)}
              </span>
            </li>
          </ul>
          <div className="my-2 border-t border-surface-border" />
          <Row label="Subtotal" value={formatUSD(item.price)} />
          <Row label="Shipping" value="Free" />
          <Row label="Tax" value="$0.00" />
          <div className="my-2 border-t border-surface-border" />
          <Row
            label="Order total"
            value={<AnimatedAmount amount={total} />}
            bold
          />
        </div>
      </Section>

      <button
        type="button"
        onClick={place}
        disabled={placing}
        className="btn-primary w-full"
      >
        {placing ? "Placing order…" : `Confirm Order · ${formatUSD(total)}`}
      </button>
      <button
        type="button"
        onClick={cancel}
        disabled={placing}
        className="inline-flex w-full items-center justify-center rounded-pill bg-white px-6 py-3.5 text-[15px] font-semibold tracking-tight text-ink shadow-sm transition-all duration-150 hover:bg-surface-alt active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40"
      >
        Cancel
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
      <div className="card-subtle p-4">{children}</div>
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
