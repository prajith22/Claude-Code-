"use client";

import { motion } from "framer-motion";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};

const fadeLeft = {
  hidden: { opacity: 0, x: -24 },
  show: { opacity: 1, x: 0 },
};

const SIMS = [
  { emoji: "🛍️", label: "Shop" },
  { emoji: "🍔", label: "Food" },
  { emoji: "🎰", label: "Bet" },
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
          {SIMS.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.4,
                delay: 0.25 + i * 0.07,
                ease: "easeOut",
              }}
              className="flex flex-col items-center gap-2 rounded-2xl border border-white/10 bg-navy-light px-3 py-4 text-center"
            >
              <span className="text-[28px] leading-none">{s.emoji}</span>
              <span className="text-[13px] font-bold text-white">{s.label}</span>
            </motion.div>
          ))}
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

        {/* Before / after comparison — desktop only */}
        <motion.div
          initial="hidden"
          animate="show"
          variants={fadeUp}
          transition={{ duration: 0.5, delay: 0.55, ease: "easeOut" }}
          className="mt-10 hidden grid-cols-2 overflow-hidden rounded-2xl border border-white/10 bg-navy-light md:grid"
        >
          <div className="px-5 py-5">
            <p className="text-[20px] leading-none">😰</p>
            <p className="mt-3 text-[12px] font-semibold uppercase tracking-widest text-white/50">
              Without Dopiq
            </p>
            <p className="mt-1 text-[15px] font-bold text-red-400">
              $340 spent on impulse buys this week
            </p>
          </div>
          <div className="border-l border-white/10 px-5 py-5">
            <p className="text-[20px] leading-none">😌</p>
            <p className="mt-3 text-[12px] font-semibold uppercase tracking-widest text-white/50">
              With Dopiq
            </p>
            <p className="mt-1 text-[15px] font-bold text-brand-vivid">
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
          <div className="flex gap-0.5" aria-label="5 out of 5 stars">
            {[0, 1, 2, 3, 4].map((i) => (
              <svg
                key={i}
                width="14"
                height="14"
                viewBox="0 0 20 20"
                fill="#FACC15"
                aria-hidden
              >
                <path d="M10 1.5l2.6 5.27 5.82.85-4.21 4.1.99 5.78L10 14.77 4.8 17.5l.99-5.78L1.58 7.62l5.82-.85L10 1.5z" />
              </svg>
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
