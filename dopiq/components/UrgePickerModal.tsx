"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calm,
  Eye,
  Cloud,
  Spark,
  Bag,
  Bowl,
  Couch,
  Users,
  TV,
  Flame,
  Wallet,
  Heart,
} from "@/components/icons";
import type { ComponentType, SVGProps } from "react";

type Section = "shop" | "food" | "bet";
type IconComponent = ComponentType<SVGProps<SVGSVGElement> & { size?: number }>;
type Reason = { key: string; Icon: IconComponent; label: string };

const REASONS_BY_SECTION: Record<Section, Reason[]> = {
  shop: [
    { key: "bored", Icon: Calm, label: "Bored" },
    { key: "fomo", Icon: Eye, label: "FOMO" },
    { key: "stressed", Icon: Cloud, label: "Stressed" },
    { key: "sad", Icon: Cloud, label: "Sad" },
    { key: "reward", Icon: Spark, label: "Treating myself" },
    { key: "looking", Icon: Bag, label: "Just looking" },
  ],
  food: [
    { key: "hungry", Icon: Bowl, label: "Actually hungry" },
    { key: "bored", Icon: Calm, label: "Bored" },
    { key: "stressed", Icon: Cloud, label: "Stressed" },
    { key: "sad", Icon: Cloud, label: "Sad" },
    { key: "lazy", Icon: Couch, label: "Don't want to cook" },
    { key: "social", Icon: Users, label: "Friends are eating" },
  ],
  bet: [
    { key: "watching", Icon: TV, label: "Watching the game" },
    { key: "bored", Icon: Calm, label: "Bored" },
    { key: "tip", Icon: Flame, label: "Saw a hot tip" },
    { key: "chasing", Icon: Wallet, label: "Chasing losses" },
    { key: "fomo", Icon: Eye, label: "Friend bet" },
    { key: "team", Icon: Heart, label: "I just like the team" },
  ],
};

const SECTION_LABEL: Record<Section, string> = {
  shop: "shopping",
  food: "ordering food",
  bet: "betting",
};

function todayDateStr(): string {
  // YYYY-MM-DD in the user's local TZ — server uses this verbatim for streaks.
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function flagKey(section: Section): string {
  return `dopiq-urge-${section}-${todayDateStr()}`;
}

/**
 * Universal urge-picker. Shown once per section per local day, the first
 * time the user enters that section. The `section` prop drives both the
 * reason list and the storage flag. Logging an urge also touches the
 * streak server-side.
 *
 * Skip button is intentional — coercion would tank the open rate. The
 * data we DO get is more honest because it's volunteered.
 */
export function UrgePickerModal({ section }: { section: Section }) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const seen = window.sessionStorage.getItem(flagKey(section));
      if (!seen) setOpen(true);
    } catch {
      // sessionStorage blocked — just don't show the modal.
    }
  }, [section]);

  function dismissForToday() {
    try {
      window.sessionStorage.setItem(flagKey(section), "1");
    } catch {}
    setOpen(false);
  }

  async function pick(reason: Reason) {
    if (submitting) return;
    setSubmitting(true);
    try {
      await fetch("/api/urges/log", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          section,
          reason: reason.key,
          todayDateStr: todayDateStr(),
        }),
      });
    } catch {
      // best-effort — closing the modal is more important than the log
    }
    dismissForToday();
    setSubmitting(false);
  }

  const reasons = REASONS_BY_SECTION[section];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="urge-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-end justify-center bg-ink/50 px-4 pb-4 sm:items-center sm:pb-0"
        >
          <motion.div
            key="urge-card"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: "spring", stiffness: 240, damping: 24 }}
            className="w-full max-w-md rounded-card bg-white p-6 shadow-cardHover"
          >
            <p className="text-[12px] font-bold uppercase tracking-widest text-brand">
              Quick check-in
            </p>
            <h2 className="mt-1 font-heading text-[22px] font-bold leading-tight text-ink">
              Why are you {SECTION_LABEL[section]} right now?
            </h2>
            <p className="mt-1 text-[13px] text-ink-muted">
              Naming the urge weakens it. Takes one second.
            </p>

            <div className="mt-5 grid grid-cols-2 gap-2">
              {reasons.map((r) => {
                const Icon = r.Icon;
                return (
                  <button
                    key={r.key}
                    type="button"
                    disabled={submitting}
                    onClick={() => pick(r)}
                    className="flex items-center gap-2.5 rounded-xl border border-surface-border bg-white px-3 py-3 text-left text-[14px] font-semibold text-ink transition hover:bg-surface-alt disabled:opacity-60"
                  >
                    <Icon size={16} className="text-ink-muted" />
                    <span>{r.label}</span>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={dismissForToday}
              className="mt-5 w-full text-center text-[12px] font-semibold text-ink-muted hover:text-ink"
            >
              Skip for today
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
