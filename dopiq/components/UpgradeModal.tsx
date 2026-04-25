"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { PLANS, type PlanId } from "@/lib/stripe";

export type UpgradeModalProps = {
  open: boolean;
  onClose: () => void;
  currentPlan: string | null;
  used: number;
  limit: number;
};

const ORDER: PlanId[] = ["lite", "plus", "pro"];

function planLabel(planId: string | null): string {
  if (!planId) return "Free trial";
  if (planId === "trial") return "Free trial";
  const plan = PLANS[planId as PlanId];
  return plan?.name ?? "Current plan";
}

function nextTiers(current: string | null): PlanId[] {
  // Always offer all three so the user can jump straight to Pro.
  // We just promote tiers strictly above the current one when available.
  if (!current || current === "trial") return ORDER;
  const idx = ORDER.indexOf(current as PlanId);
  if (idx === -1) return ORDER;
  const above = ORDER.slice(idx + 1);
  return above.length > 0 ? above : [ORDER[ORDER.length - 1]];
}

export function UpgradeModal({
  open,
  onClose,
  currentPlan,
  used,
  limit,
}: UpgradeModalProps) {
  const tiers = nextTiers(currentPlan);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="absolute inset-0 bg-navy/60 backdrop-blur-sm"
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            initial={{ y: "100%", opacity: 1 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            className="relative z-10 w-full max-w-md rounded-t-3xl bg-white p-6 shadow-cardHover sm:rounded-3xl"
          >
            <div className="text-center">
              <span className="text-5xl" aria-hidden>
                😢
              </span>
              <h2 className="mt-3 font-heading text-[22px] font-bold leading-tight text-ink">
                You&rsquo;ve hit your monthly tier limit
              </h2>
              <p className="mt-2 text-[14px] text-ink-muted">
                {planLabel(currentPlan)} ·{" "}
                <span className="font-semibold text-ink">
                  {used}/{limit}
                </span>{" "}
                simulations used
              </p>
            </div>

            <ul className="mt-6 space-y-2">
              {tiers.map((id) => {
                const plan = PLANS[id];
                return (
                  <li key={id}>
                    <Link
                      href={`/paywall?plan=${id}`}
                      className="flex items-center justify-between rounded-2xl border border-surface-border bg-white px-4 py-3 transition hover:border-navy hover:bg-surface-alt"
                    >
                      <div className="text-left">
                        <p className="text-[14px] font-bold text-ink">
                          Upgrade to {plan.name}
                        </p>
                        <p className="text-[12px] text-ink-muted">
                          {plan.simulationsLimit >= 999_999
                            ? "Unlimited simulations"
                            : `${plan.simulationsLimit} simulations / mo`}
                        </p>
                      </div>
                      <span className="money text-[15px] text-navy">
                        ${plan.priceUsd.toFixed(2)}
                        <span className="ml-1 text-[11px] font-normal text-ink-muted">
                          /mo
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>

            <button
              type="button"
              onClick={onClose}
              className="mt-5 w-full text-center text-[13px] font-semibold text-ink-muted transition hover:text-ink"
            >
              Maybe later
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
