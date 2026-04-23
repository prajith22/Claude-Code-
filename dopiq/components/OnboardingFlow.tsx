"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type {
  Cuisine,
  OrderSize,
  ProductCategory,
} from "@/types";

const SHOP_CATEGORIES: ProductCategory[] = [
  "Clothes",
  "Electronics",
  "Home Goods",
  "Beauty",
  "Sports",
];

const CUISINES: Cuisine[] = [
  "Pizza",
  "Chinese",
  "Mexican",
  "Burgers",
  "Sushi",
  "Italian",
];

const ORDER_SIZES: OrderSize[] = ["Just me", "Me + 1", "Group order"];

export function OnboardingFlow() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [shop, setShop] = useState<ProductCategory[]>([]);
  const [cuisines, setCuisines] = useState<Cuisine[]>([]);
  const [orderSize, setOrderSize] = useState<OrderSize>("Just me");
  const [sports, setSports] = useState<{ nfl: boolean; nba: boolean }>({
    nfl: true,
    nba: true,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const next = () => setStep((s) => s + 1);
  const back = () => setStep((s) => Math.max(0, s - 1));

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          shoppingPrefs: shop,
          foodPrefs: { cuisines, orderSize },
          sportsPrefs: sports,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed");
      router.push("/home");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setSubmitting(false);
    }
  }

  const canContinue =
    (step === 0 && shop.length > 0) ||
    (step === 1 && cuisines.length > 0) ||
    step === 2;

  return (
    <main className="mx-auto flex min-h-[100dvh] max-w-md flex-col px-6 pt-8 pb-6 safe-top">
      <StepDots count={3} current={step} />
      <div className="mt-6 flex-1">
        <AnimatePresence mode="wait">
          {step === 0 && (
            <StepFrame key="shop">
              <h1 className="text-[28px] font-semibold leading-tight tracking-tight">
                What do you usually shop for?
              </h1>
              <p className="mt-2 text-ink-muted">
                Pick all that apply. We&apos;ll personalize your feed.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {SHOP_CATEGORIES.map((c) => (
                  <ChipToggle
                    key={c}
                    label={c}
                    active={shop.includes(c)}
                    onClick={() =>
                      setShop((prev) =>
                        prev.includes(c)
                          ? prev.filter((x) => x !== c)
                          : [...prev, c],
                      )
                    }
                  />
                ))}
              </div>
            </StepFrame>
          )}

          {step === 1 && (
            <StepFrame key="food">
              <h1 className="text-[28px] font-semibold leading-tight tracking-tight">
                What do you usually order?
              </h1>
              <p className="mt-2 text-ink-muted">
                Pick cuisines, then tell us your typical order size.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {CUISINES.map((c) => (
                  <ChipToggle
                    key={c}
                    label={c}
                    active={cuisines.includes(c)}
                    onClick={() =>
                      setCuisines((prev) =>
                        prev.includes(c)
                          ? prev.filter((x) => x !== c)
                          : [...prev, c],
                      )
                    }
                  />
                ))}
              </div>
              <div className="mt-8">
                <p className="text-sm font-medium text-ink">Order size</p>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {ORDER_SIZES.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setOrderSize(s)}
                      className={cn(
                        "rounded-xl border px-3 py-3 text-sm font-medium transition",
                        orderSize === s
                          ? "border-brand bg-brand-light text-brand"
                          : "border-surface-border bg-white text-ink hover:bg-surface-alt",
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </StepFrame>
          )}

          {step === 2 && (
            <StepFrame key="sports">
              <h1 className="text-[28px] font-semibold leading-tight tracking-tight">
                Which sports do you follow?
              </h1>
              <p className="mt-2 text-ink-muted">
                Both are on by default. Toggle off any you don&apos;t want.
              </p>
              <div className="mt-6 space-y-3">
                <SportRow
                  label="NFL"
                  sub="Fake matchups, realistic American odds."
                  active={sports.nfl}
                  onToggle={() =>
                    setSports((s) => ({ ...s, nfl: !s.nfl }))
                  }
                />
                <SportRow
                  label="NBA"
                  sub="Moneyline, spread, and totals."
                  active={sports.nba}
                  onToggle={() =>
                    setSports((s) => ({ ...s, nba: !s.nba }))
                  }
                />
              </div>
            </StepFrame>
          )}
        </AnimatePresence>
      </div>

      {error && (
        <p className="mb-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="flex items-center gap-3">
        {step > 0 && (
          <button
            type="button"
            onClick={back}
            className="btn-secondary flex-1"
            disabled={submitting}
          >
            Back
          </button>
        )}
        {step < 2 ? (
          <button
            type="button"
            onClick={next}
            disabled={!canContinue}
            className="btn-primary flex-1"
          >
            Continue
          </button>
        ) : (
          <button
            type="button"
            onClick={submit}
            disabled={submitting}
            className="btn-primary flex-1"
          >
            {submitting ? "Saving…" : "Finish"}
          </button>
        )}
      </div>
    </main>
  );
}

function StepFrame({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="h-full"
    >
      {children}
    </motion.div>
  );
}

function StepDots({ count, current }: { count: number; current: number }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: count }).map((_, i) => (
        <span
          key={i}
          className={cn(
            "h-1.5 flex-1 rounded-full transition",
            i <= current ? "bg-brand" : "bg-surface-alt",
          )}
        />
      ))}
    </div>
  );
}

function ChipToggle({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-4 py-2 text-[15px] font-medium transition active:scale-[0.98]",
        active
          ? "border-brand bg-brand-light text-brand"
          : "border-surface-border bg-white text-ink hover:bg-surface-alt",
      )}
    >
      {label}
    </button>
  );
}

function SportRow({
  label,
  sub,
  active,
  onToggle,
}: {
  label: string;
  sub: string;
  active: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "flex w-full items-center justify-between rounded-2xl border p-4 text-left transition",
        active
          ? "border-brand bg-brand-light"
          : "border-surface-border bg-white hover:bg-surface-alt",
      )}
    >
      <div>
        <p className="text-[17px] font-semibold text-ink">{label}</p>
        <p className="mt-0.5 text-sm text-ink-muted">{sub}</p>
      </div>
      <span
        className={cn(
          "relative h-7 w-12 rounded-full transition",
          active ? "bg-brand" : "bg-surface-alt",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition",
            active ? "left-[22px]" : "left-0.5",
          )}
        />
      </span>
    </button>
  );
}
