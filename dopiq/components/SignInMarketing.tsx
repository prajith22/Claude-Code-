"use client";

import { motion } from "framer-motion";
import { Bag, Bowl, Slot, Cloud, Calm, StarFilled } from "@/components/icons";
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

const SIMS: { Icon: IconComponent; label: string }[] = [
  { Icon: Bag, label: "Shop" },
  { Icon: Bowl, label: "Food" },
  { Icon: Slot, label: "Bet" },
];

export function SignInMarketing() {
  return (
    <aside className="relative flex flex-col justify-between overflow-hidden bg-navy px-6 py-10 text-white md:min-h-[100dvh] md:px-10 md:py-12 lg:px-14">
      {/* Subtle background gradient glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background:
            "radial-gradient(circle at 0% 0%, rgba(0,200,83,0.18), transparent 45%), radial-gradient(circle at 100% 100%, rgba(0,200,83,0.10), transparent 50%)",
        }}
      />

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
            <span className="font-heading text-[28px] font-extrabold leading-none">
              dopiq
            </span>
            <span className="mt-1 text-[12px] font-semibold text-brand-vivid">
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
          className="font-heading mt-10 text-[34px] font-extrabold leading-[1.05] tracking-tight md:mt-14 md:text-[44px] lg:text-[48px]"
        >
          The urge is real.
          <br />
          The charge isn&apos;t.
        </motion.h1>

        {/* Three simulator cards */}
        <motion.div
          initial="hidden"
          animate="show"
          variants={fadeUp}
          transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
          className="mt-8 grid grid-cols-3 gap-3"
        >
          {SIMS.map((s, i) => {
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
                className="flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-navy-light px-3 py-5 text-center"
              >
                <Icon size={26} className="text-white" />
                <span className="text-[13px] font-bold text-white">
                  {s.label}
                </span>
              </motion.div>
            );
          })}
        </motion.div>

        <motion.p
          initial="hidden"
          animate="show"
          variants={fadeUp}
          transition={{ duration: 0.5, delay: 0.45, ease: "easeOut" }}
          className="mt-4 text-[14px] text-white/55"
        >
          Simulate the rush. Skip the damage.
        </motion.p>

        {/* Before / after comparison — desktop only.
            This is the only place in the app where red appears; the
            two-tone red/green carries the entire emotional arc of the
            comparison. Don't reuse red elsewhere — it dilutes the
            signal. */}
        <motion.div
          initial="hidden"
          animate="show"
          variants={fadeUp}
          transition={{ duration: 0.5, delay: 0.55, ease: "easeOut" }}
          className="mt-10 hidden grid-cols-2 overflow-hidden rounded-2xl border border-white/10 bg-navy-light md:grid"
        >
          <div className="px-5 py-5">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-white/40">
              Without Dopiq
            </p>
            <p className="mt-2 text-[15px] font-bold text-red-400">
              $340 spent on impulse buys this week
            </p>
          </div>
          <div className="border-l border-white/10 px-5 py-5">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-white/40">
              With Dopiq
            </p>
            <p className="mt-2 text-[15px] font-bold text-brand-vivid">
              $0 spent · 47 urges simulated
            </p>
          </div>
        </motion.div>

        {/* Testimonial — desktop only */}
        <motion.figure
          initial="hidden"
          animate="show"
          variants={fadeUp}
          transition={{ duration: 0.5, delay: 0.7, ease: "easeOut" }}
          className="mt-6 hidden rounded-2xl border border-white/10 bg-navy-muted px-5 py-5 md:block"
        >
          <div className="flex gap-1 text-white" aria-label="5 out of 5 stars">
            {[0, 1, 2, 3, 4].map((i) => (
              <StarFilled key={i} size={12} />
            ))}
          </div>
          <blockquote className="mt-3 text-[15px] leading-relaxed text-white/85">
            &ldquo;I almost spent $200 on Amazon last night. Opened Dopiq instead.
            Saved every penny.&rdquo;
          </blockquote>
          <figcaption className="mt-3 text-[12px] font-semibold text-white/55">
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
        className="relative mt-10 hidden text-[12px] text-white/45 md:block"
      >
        Join 10,000+ people resisting their urges
      </motion.p>
    </aside>
  );
}
