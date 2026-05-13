"use client";

import { motion } from "framer-motion";
import { Bag, Bowl, Slot, StarFilled, Ticket } from "@/components/icons";
import type { ComponentType, SVGProps } from "react";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};

const fadeLeft = {
  hidden: { opacity: 0, x: -24 },
  show: { opacity: 1, x: 0 },
};

type IconComponent = ComponentType<SVGProps<SVGSVGElement> & { size?: number }>;

// Pastel palette mirrors the Quick Sim and onboarding screens —
// each simulator gets the same accent across the app so the sign-in
// preview reads as the same surface users will land on.
const SIMS: {
  Icon: IconComponent;
  label: string;
  bg: string;
  fg: string;
}[] = [
  { Icon: Bag, label: "Shop", bg: "#F3E8FF", fg: "#4A148C" },
  { Icon: Bowl, label: "Food", bg: "#FFF9E6", fg: "#5D4037" },
  { Icon: Slot, label: "Bet", bg: "#E8F0FF", fg: "#1A237E" },
  // Warm peach + terracotta — matches the Streak hero card on
  // /home and the "Almost gone" SeatMap badge, so the Tickets
  // accent is consistent across every surface that previews it.
  { Icon: Ticket, label: "Tickets", bg: "#FFE4D6", fg: "#7C2D12" },
];

export function SignInMarketing({
  excludeBet = false,
}: {
  excludeBet?: boolean;
}) {
  // iOS users never see the betting preview tile — Apple disallows
  // gambling features for individual developer accounts. Filter
  // the static SIMS list rather than rendering and hiding so the
  // grid stays balanced with two columns.
  const sims = excludeBet ? SIMS.filter((s) => s.label !== "Bet") : SIMS;
  return (
    <aside className="relative flex flex-col justify-between overflow-hidden bg-[#FAFAF8] px-6 py-10 text-[#0A0F1E] md:min-h-[100dvh] md:px-10 md:py-12 lg:px-14">
      <div className="relative">
        {/* Logo */}
        <motion.div
          initial="hidden"
          animate="show"
          variants={fadeLeft}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="flex items-center gap-3"
        >
          <svg width="44" height="44" viewBox="0 0 44 44" fill="none" aria-hidden>
            <rect width="44" height="44" rx="10" fill="#00C853" />
            <path
              d="M10 10 L10 34 L18 34 Q30 34 30 22 Q30 10 18 10 Z"
              fill="white"
            />
            <line
              x1="10"
              y1="22"
              x2="27"
              y2="22"
              stroke="#00C853"
              strokeWidth="2.5"
            />
          </svg>
          <div className="flex flex-col leading-none">
            <span className="font-heading text-[28px] font-extrabold leading-none text-[#0A0F1E]">
              dopiq
            </span>
            <span className="mt-1 text-[12px] font-semibold text-brand">
              spend smarter
            </span>
          </div>
        </motion.div>

        {/* Hero headline */}
        <motion.h1
          initial="hidden"
          animate="show"
          variants={fadeUp}
          transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
          className="font-heading mt-10 text-[34px] font-extrabold leading-[1.05] tracking-tight text-[#0A0F1E] md:mt-14 md:text-[44px] lg:text-[48px]"
        >
          The urge is real.
          <br />
          The charge isn&apos;t.
        </motion.h1>

        {/* Three simulator cards — pastel surfaces matching the rest
            of the app. Same size and rounded corners as before. */}
        <motion.div
          initial="hidden"
          animate="show"
          variants={fadeUp}
          transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
          // 4 cards on web → 2x2 (3-across would shrink each card
          // below comfortable tap targets on mobile breakpoints).
          // 3 cards on iOS (Bet filtered out) → single row of 3.
          // 2 cards (hypothetical future filter) → tight row of 2.
          className={`mt-8 grid gap-3 ${
            sims.length === 3 ? "grid-cols-3" : "grid-cols-2"
          }`}
        >
          {sims.map((s, i) => {
            const Icon = s.Icon;
            return (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.4,
                  delay: 0.25 + i * 0.07,
                  ease: "easeOut",
                }}
                className="flex flex-col items-center gap-3 rounded-2xl px-3 py-5 text-center"
                style={{ backgroundColor: s.bg, color: s.fg }}
              >
                <Icon size={26} />
                <span className="text-[13px] font-bold">{s.label}</span>
              </motion.div>
            );
          })}
        </motion.div>

        <motion.p
          initial="hidden"
          animate="show"
          variants={fadeUp}
          transition={{ duration: 0.5, delay: 0.45, ease: "easeOut" }}
          className="mt-4 text-[14px] text-ink-muted"
        >
          Simulate the rush. Skip the damage.
        </motion.p>

        {/* Before / after comparison — desktop only. Two pastel
            tiles instead of a dark navy card; red still carries the
            "without" half so the contrast lands. */}
        <motion.div
          initial="hidden"
          animate="show"
          variants={fadeUp}
          transition={{ duration: 0.5, delay: 0.55, ease: "easeOut" }}
          className="mt-10 hidden grid-cols-2 overflow-hidden rounded-2xl md:grid"
        >
          <div className="px-5 py-5" style={{ backgroundColor: "#FFEBEE" }}>
            <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: "#C62828" }}>
              Without Dopiq
            </p>
            <p className="mt-2 text-[15px] font-bold" style={{ color: "#B71C1C" }}>
              $340 spent on impulse buys this week
            </p>
          </div>
          <div className="px-5 py-5" style={{ backgroundColor: "#E8F5E9" }}>
            <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: "#2E7D32" }}>
              With Dopiq
            </p>
            <p className="mt-2 text-[15px] font-bold" style={{ color: "#1B5E20" }}>
              $0 spent · 47 urges simulated
            </p>
          </div>
        </motion.div>

        {/* Testimonial — desktop only. Soft yellow pastel matches
            the Food card so the marketing column feels like a tour
            of the app's palette. */}
        <motion.figure
          initial="hidden"
          animate="show"
          variants={fadeUp}
          transition={{ duration: 0.5, delay: 0.7, ease: "easeOut" }}
          className="mt-6 hidden rounded-2xl px-5 py-5 md:block"
          style={{ backgroundColor: "#FFF9E6", color: "#5D4037" }}
        >
          <div className="flex gap-1" aria-label="5 out of 5 stars">
            {[0, 1, 2, 3, 4].map((i) => (
              <StarFilled key={i} size={12} />
            ))}
          </div>
          <blockquote className="mt-3 text-[15px] leading-relaxed" style={{ color: "#5D4037" }}>
            &ldquo;I almost spent $200 on Amazon last night. Opened Dopiq instead.
            Saved every penny.&rdquo;
          </blockquote>
          <figcaption className="mt-3 text-[12px] font-semibold" style={{ color: "#8D6E63" }}>
            — Sarah M., 24
          </figcaption>
        </motion.figure>
      </div>

      {/* Social proof — desktop only */}
      <motion.p
        initial="hidden"
        animate="show"
        variants={fadeUp}
        transition={{ duration: 0.5, delay: 0.85, ease: "easeOut" }}
        className="relative mt-10 hidden text-[12px] text-ink-muted md:block"
      >
        Join 10,000+ people resisting their urges
      </motion.p>
    </aside>
  );
}
