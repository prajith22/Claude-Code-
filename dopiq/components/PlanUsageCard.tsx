"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useSavingsStore } from "@/lib/savings-store";
import { isUnlimited, PLANS, type PlanId } from "@/lib/stripe";

type PlanSummary = {
  plan: string | null;
  simulationsUsed: number;
  simulationsLimit: number;
};

const PLAN_LABELS: Record<PlanId, string> = {
  lite: "Lite",
  plus: "Plus",
  pro: "Pro",
};

function planLabel(plan: string | null): string {
  if (plan && plan in PLAN_LABELS) {
    return PLAN_LABELS[plan as PlanId];
  }
  return "Trial";
}

/**
 * Plan-usage card on the home page. Reads simulationsUsed and
 * simulationsLimit off /api/savings/me (which we extended to carry
 * those fields). Polls on the same savings-store version bump as the
 * other counters so the bar shrinks live after a Quick Sim or
 * Shop / Food / Bet checkout.
 *
 * Two layouts:
 *  - Limited plan: progress bar + "X sims left this month".
 *  - Unlimited (Pro): no bar, just "Unlimited this month."
 */
export function PlanUsageCard({ initial }: { initial: PlanSummary }) {
  const { status } = useSession();
  const version = useSavingsStore((s) => s.version);
  const [summary, setSummary] = useState<PlanSummary>(initial);

  useEffect(() => {
    if (status !== "authenticated") return;
    let cancelled = false;
    fetch(`/api/savings/me`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d: PlanSummary | null) => {
        if (!cancelled && d) {
          setSummary({
            plan: d.plan ?? null,
            simulationsUsed: d.simulationsUsed,
            simulationsLimit: d.simulationsLimit,
          });
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [status, version]);

  const used = Math.max(0, summary.simulationsUsed);
  const limit = Math.max(0, summary.simulationsLimit);
  const unlimited = isUnlimited(limit);
  const remaining = Math.max(0, limit - used);
  const pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  const lowOnSims = !unlimited && limit > 0 && remaining <= Math.max(5, Math.floor(limit * 0.1));
  const label = planLabel(summary.plan);

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="rounded-card border bg-[#FFEDD5] p-5"
      style={{ borderColor: "#FDC78A" }}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-bold uppercase tracking-widest text-[#1A1A1A]/60">
          Plan usage
        </p>
        <span
          className="rounded-pill border bg-[#FFF7ED] px-3 py-1 text-[11px] font-bold text-[#7C2D12]"
          style={{ borderColor: "#FDC78A" }}
        >
          {label} plan
        </span>
      </div>

      {unlimited ? (
        <div className="mt-2">
          <p className="font-heading text-[20px] font-extrabold leading-tight text-ink md:text-[22px]">
            Unlimited this month
          </p>
          <p className="mt-1 text-[13px] text-ink-muted">
            Sim as much as you want. The cap doesn&rsquo;t apply to you.
          </p>
        </div>
      ) : (
        <>
          <div className="mt-2 flex items-baseline gap-2">
            <p className="font-mono text-[28px] font-extrabold leading-none tabular-nums text-brand md:text-[32px]">
              {remaining}
            </p>
            <p className="text-[13px] text-ink-muted">
              of {limit} sims left this month
            </p>
          </div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-alt">
            <motion.div
              className="h-full bg-brand"
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
          </div>
          {lowOnSims && (
            <p className="mt-2 text-[12px] font-semibold text-[#BF360C]">
              You&rsquo;re close to your limit.{" "}
              <Link
                href="/settings"
                className="underline underline-offset-2 hover:text-[#8B2500]"
              >
                Upgrade
              </Link>{" "}
              for more.
            </p>
          )}
        </>
      )}
    </motion.section>
  );
}
