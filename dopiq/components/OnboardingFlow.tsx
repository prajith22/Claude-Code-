"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, type Variants } from "framer-motion";

type Stage = 1 | 2 | 3;

const RESPONSE_HOLD_MS = 1500;

const screenVariants: Variants = {
  enter: { x: 320, opacity: 0 },
  center: { x: 0, opacity: 1 },
  exit: { x: -320, opacity: 0 },
};

const screenTransition = { type: "spring", stiffness: 280, damping: 30 } as const;

export function OnboardingFlow() {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>(1);
  const [submitting, setSubmitting] = useState(false);

  async function complete(redirectTo: "/paywall" = "/paywall") {
    if (submitting) return;
    setSubmitting(true);
    try {
      await fetch("/api/onboarding/complete", { method: "POST" });
    } catch {
      // best-effort — if the write fails, the user still moves on;
      // they'll see the onboarding once more on next visit.
    }
    router.push(redirectTo);
  }

  return (
    <main className="relative flex min-h-[100dvh] flex-col bg-[#FAFAF8] safe-top">
      {/* Top bar — progress dots + skip */}
      <header className="flex items-center justify-between px-6 pb-3 pt-4">
        <ProgressDots stage={stage} />
        <button
          type="button"
          onClick={() => complete()}
          disabled={submitting}
          className="text-[13px] font-semibold text-ink-muted underline-offset-4 hover:text-ink hover:underline disabled:opacity-60"
        >
          Skip
        </button>
      </header>

      <div className="relative flex flex-1 flex-col overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          {stage === 1 && (
            <motion.div
              key="s1"
              variants={screenVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={screenTransition}
              className="flex flex-1 flex-col"
            >
              <Screen1 onAdvance={() => setStage(2)} />
            </motion.div>
          )}
          {stage === 2 && (
            <motion.div
              key="s2"
              variants={screenVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={screenTransition}
              className="flex flex-1 flex-col"
            >
              <Screen2 onAdvance={() => setStage(3)} />
            </motion.div>
          )}
          {stage === 3 && (
            <motion.div
              key="s3"
              variants={screenVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={screenTransition}
              className="flex flex-1 flex-col"
            >
              <Screen3
                onComplete={() => complete()}
                submitting={submitting}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}

// ---------- Top bar ----------

function ProgressDots({ stage }: { stage: Stage }) {
  return (
    <div className="flex items-center gap-2" aria-label={`Step ${stage} of 3`}>
      {[1, 2, 3].map((n) => (
        <span
          key={n}
          className={`h-2 rounded-full transition-all duration-300 ${
            n === stage
              ? "w-6 bg-[#0A0F1E]"
              : "w-2 bg-[#E5E7EB]"
          }`}
        />
      ))}
    </div>
  );
}

// ---------- Screen 1: confessions + response ----------

const CONFESSIONS = [
  {
    emoji: "🛒",
    text: "You've added things to your cart at 2am that you didn't need.",
  },
  {
    emoji: "🍔",
    text: "You've ordered food delivery when your fridge was full.",
  },
  {
    emoji: "🎰",
    text: "You've placed a bet just to feel something.",
  },
];

function Screen1({ onAdvance }: { onAdvance: () => void }) {
  const [agreed, setAgreed] = useState(false);
  const advanceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (advanceRef.current) clearTimeout(advanceRef.current);
    };
  }, []);

  function agree() {
    setAgreed(true);
    advanceRef.current = setTimeout(onAdvance, RESPONSE_HOLD_MS);
  }

  return (
    <div className="flex flex-1 flex-col px-5 pb-8 pt-2">
      <motion.h1
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="font-heading text-center text-[28px] font-bold leading-tight tracking-tight text-[#0A0F1E] md:text-[32px]"
      >
        Be honest with yourself for a second.
      </motion.h1>

      <div className="relative mt-8 flex flex-1 flex-col">
        <AnimatePresence mode="wait">
          {!agreed ? (
            <motion.div
              key="cards"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
              className="flex flex-1 flex-col"
            >
              <motion.ul
                initial="hidden"
                animate="show"
                variants={{
                  hidden: {},
                  show: { transition: { staggerChildren: 0.4, delayChildren: 0.2 } },
                }}
                className="space-y-3"
              >
                {CONFESSIONS.map((c, i) => (
                  <motion.li
                    key={i}
                    variants={{
                      hidden: { opacity: 0, y: 24 },
                      show: { opacity: 1, y: 0 },
                    }}
                    transition={{
                      type: "spring",
                      stiffness: 240,
                      damping: 24,
                    }}
                    className="flex items-center gap-4 rounded-card border border-[#E8E4E0] bg-white p-5 shadow-card"
                  >
                    <span aria-hidden className="text-[34px] leading-none">
                      {c.emoji}
                    </span>
                    <p className="text-[15px] font-medium leading-snug text-[#0A0F1E] md:text-[16px]">
                      {c.text}
                    </p>
                  </motion.li>
                ))}
              </motion.ul>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.6, duration: 0.5, ease: "easeOut" }}
                className="mt-auto pt-8"
              >
                <motion.button
                  type="button"
                  onClick={agree}
                  animate={{ scale: [1, 1.02, 1] }}
                  transition={{
                    duration: 2.4,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full rounded-pill bg-[#0A0F1E] px-6 py-4 text-[16px] font-bold text-white shadow-navy transition active:bg-navy-light"
                >
                  …yeah, that&rsquo;s me →
                </motion.button>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              key="response"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="flex flex-1 flex-col items-center justify-center text-center"
            >
              <motion.div
                initial={{ scale: 0, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 240,
                  damping: 14,
                  delay: 0.05,
                }}
                className="flex h-24 w-24 items-center justify-center rounded-full bg-brand text-white shadow-cardHover"
              >
                <motion.svg
                  viewBox="0 0 24 24"
                  width="56"
                  height="56"
                  fill="none"
                  aria-hidden
                >
                  <motion.path
                    d="m5 12.5 5 5 9-10"
                    stroke="currentColor"
                    strokeWidth={2.8}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ delay: 0.32, duration: 0.5, ease: "easeOut" }}
                  />
                </motion.svg>
              </motion.div>

              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.4 }}
                className="mt-6 font-heading text-[24px] font-bold leading-tight text-[#0A0F1E] md:text-[28px]"
              >
                We built Dopiq for exactly this moment.
              </motion.p>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.78, duration: 0.4 }}
                className="mt-3 max-w-md text-[15px] text-ink-muted"
              >
                That urge you feel? We can help you handle it.
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ---------- Screen 2: brain science ----------

const WITHOUT_STEPS = [
  { icon: "brain", label: "Sees a deal or feels bored" },
  { icon: "bolt", label: "Dopamine spike 🔥" },
  { icon: "bag", label: "Spend $200" },
  { icon: "sad", label: "Regret" },
] as const;

const WITH_STEPS = [
  { icon: "brain", label: "Feels the urge" },
  { icon: "phone", label: "Opens Dopiq" },
  { icon: "bolt", label: "Same dopamine spike 🔥" },
  { icon: "money", label: "$0 spent · No regret" },
] as const;

function Screen2({ onAdvance }: { onAdvance: () => void }) {
  return (
    <div className="flex flex-1 flex-col px-5 pb-8 pt-2">
      <motion.h1
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="font-heading text-center text-[26px] font-bold leading-tight tracking-tight text-[#0A0F1E] md:text-[32px]"
      >
        Here&rsquo;s what&rsquo;s actually happening in your brain
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12, duration: 0.4 }}
        className="mt-2 text-center text-[14px] text-ink-muted md:text-[15px]"
      >
        It&rsquo;s not weakness. It&rsquo;s chemistry.
      </motion.p>

      <div className="mt-7 grid flex-1 grid-cols-1 gap-4 md:grid-cols-2">
        <FlowColumn
          tone="red"
          label="Without Dopiq"
          steps={WITHOUT_STEPS}
          startDelay={0.3}
        />
        <FlowColumn
          tone="green"
          label="With Dopiq"
          steps={WITH_STEPS}
          startDelay={1.5}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2.7, duration: 0.5 }}
        className="mt-6 rounded-card bg-[#F0E9DC] px-5 py-4"
      >
        <p className="text-center text-[14px] italic leading-relaxed text-[#0A0F1E] md:text-[15px]">
          Your brain literally cannot tell the difference. The dopamine
          hit is identical. We just redirected it.
        </p>
      </motion.div>

      <motion.button
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2.9, duration: 0.4 }}
        whileTap={{ scale: 0.98 }}
        type="button"
        onClick={onAdvance}
        className="mt-4 w-full rounded-pill bg-[#0A0F1E] px-6 py-4 text-[16px] font-bold text-white shadow-navy transition active:bg-navy-light"
      >
        Next →
      </motion.button>
    </div>
  );
}

function FlowColumn({
  tone,
  label,
  steps,
  startDelay,
}: {
  tone: "red" | "green";
  label: string;
  steps: ReadonlyArray<{ icon: string; label: string }>;
  startDelay: number;
}) {
  const isRed = tone === "red";
  const labelClass = isRed
    ? "bg-red-50 text-red-700"
    : "bg-brand-light text-[#1B5E20]";
  const cardClass = isRed
    ? "border border-red-100 bg-red-50/60 text-[#7F1D1D]"
    : "border border-brand-light bg-brand-light/40 text-[#1B5E20]";
  const arrowClass = isRed ? "text-red-300" : "text-brand/60";

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{
        hidden: {},
        show: {
          transition: {
            staggerChildren: 0.3,
            delayChildren: startDelay,
          },
        },
      }}
      className="flex flex-col"
    >
      <motion.span
        variants={{
          hidden: { opacity: 0, y: -6 },
          show: { opacity: 1, y: 0 },
        }}
        className={`inline-flex w-fit items-center rounded-pill px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${labelClass}`}
      >
        {label}
      </motion.span>

      <ol className="mt-3 flex-1 space-y-1.5">
        {steps.map((s, i) => (
          <motion.li
            key={i}
            variants={{
              hidden: { opacity: 0, y: 16 },
              show: { opacity: 1, y: 0 },
            }}
            transition={{ type: "spring", stiffness: 220, damping: 22 }}
            className="flex flex-col items-stretch gap-0"
          >
            <div
              className={`flex items-center gap-3 rounded-xl px-4 py-3 ${cardClass}`}
            >
              <FlowIcon name={s.icon} />
              <span className="text-[14px] font-semibold">{s.label}</span>
            </div>
            {i < steps.length - 1 && (
              <span
                aria-hidden
                className={`mx-auto block h-3 w-0.5 ${arrowClass.replace("text-", "bg-")}`}
              />
            )}
          </motion.li>
        ))}
      </ol>
    </motion.div>
  );
}

function FlowIcon({ name }: { name: string }) {
  const common = {
    width: 22,
    height: 22,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  switch (name) {
    case "brain":
      return (
        <svg {...common}>
          <path d="M9 4a3 3 0 0 0-3 3v1a3 3 0 0 0-2 2.8V14a3 3 0 0 0 3 3v0a3 3 0 0 0 3 3h0a3 3 0 0 0 3-3" />
          <path d="M15 4a3 3 0 0 1 3 3v1a3 3 0 0 1 2 2.8V14a3 3 0 0 1-3 3v0a3 3 0 0 1-3 3h0a3 3 0 0 1-3-3" />
          <path d="M12 4v16" />
        </svg>
      );
    case "bolt":
      return (
        <svg {...common}>
          <path d="M13 3 5 14h6l-1 7 8-11h-6l1-7Z" />
        </svg>
      );
    case "bag":
      return (
        <svg {...common}>
          <path d="M5 8h14l-1 12H6L5 8Z" />
          <path d="M9 8a3 3 0 1 1 6 0" />
        </svg>
      );
    case "sad":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M9 9.5h.01M15 9.5h.01M8.5 16c1-1 2-1.5 3.5-1.5s2.5.5 3.5 1.5" />
        </svg>
      );
    case "phone":
      return (
        <svg {...common}>
          <rect x="7" y="3" width="10" height="18" rx="2" />
          <path d="M11 18h2" />
        </svg>
      );
    case "money":
      return (
        <svg {...common}>
          <path d="M5 7c0-1 1-2 2-2h10c1 0 2 1 2 2v0c0 1-1 2-2 2c1 0 2 1 2 2v0c0 1-1 2-2 2c1 0 2 1 2 2v0c0 1-1 2-2 2H7c-1 0-2-1-2-2v0c0-1 1-2 2-2c-1 0-2-1-2-2v0c0-1 1-2 2-2c-1 0-2-1-2-2V7Z" />
          <path d="M11 9h2a1.5 1.5 0 0 1 0 3h-2a1.5 1.5 0 0 0 0 3h2M12 8v9" />
        </svg>
      );
    default:
      return null;
  }
}

// ---------- Screen 3: social proof ----------

const TESTIMONIALS = [
  {
    initials: "M.R.",
    avatarBg: "#1B5E20",
    quote:
      "I almost bought $300 worth of stuff on Amazon last night. Opened Dopiq instead. Saved every dollar.",
  },
  {
    initials: "J.K.",
    avatarBg: "#4A148C",
    quote:
      "The food simulator is scary accurate. I get the same satisfaction without the delivery bill.",
  },
  {
    initials: "A.T.",
    avatarBg: "#0D47A1",
    quote:
      "I was spending way too much on impulse bets. Now I sim bet and it scratches the exact same itch.",
  },
];

function Screen3({
  onComplete,
  submitting,
}: {
  onComplete: () => void;
  submitting: boolean;
}) {
  return (
    <div className="flex flex-1 flex-col px-5 pb-8 pt-2">
      <motion.h1
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="font-heading text-center text-[28px] font-bold leading-tight tracking-tight text-[#0A0F1E] md:text-[32px]"
      >
        10,000+ people are spending smarter.
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12, duration: 0.4 }}
        className="mt-2 text-center text-[14px] text-ink-muted md:text-[15px]"
      >
        They used to impulse spend. Now they simulate.
      </motion.p>

      <motion.ul
        initial="hidden"
        animate="show"
        variants={{
          hidden: {},
          show: { transition: { staggerChildren: 0.2, delayChildren: 0.35 } },
        }}
        className="mt-6 space-y-3"
      >
        {TESTIMONIALS.map((t, i) => (
          <motion.li
            key={i}
            variants={{
              hidden: { opacity: 0, y: 18 },
              show: { opacity: 1, y: 0 },
            }}
            transition={{ type: "spring", stiffness: 220, damping: 24 }}
            className="rounded-card border border-[#E8E4E0] bg-white p-4 shadow-card"
          >
            <div className="flex items-center gap-3">
              <span
                className="flex h-10 w-10 flex-none items-center justify-center rounded-full text-[12px] font-bold text-white"
                style={{ backgroundColor: t.avatarBg }}
              >
                {t.initials}
              </span>
              <div className="flex gap-0.5 text-[#FACC15]">
                {[0, 1, 2, 3, 4].map((s) => (
                  <Star key={s} />
                ))}
              </div>
            </div>
            <p className="mt-3 text-[14px] leading-relaxed text-[#0A0F1E]">
              {t.quote}
            </p>
          </motion.li>
        ))}
      </motion.ul>

      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.05, duration: 0.5, ease: "easeOut" }}
        className="mt-6 rounded-card bg-brand px-5 py-4 text-center text-[14px] font-semibold text-white shadow-[0_2px_12px_rgba(0,200,83,0.3)]"
      >
        ✨ Start free for 7 days — no charge until your trial ends.
        Cancel anytime.
      </motion.div>

      {/* Outer wrapper handles the staggered fade-in so the button
          itself can run a continuous pulse loop without conflicts. */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2, duration: 0.4 }}
        className="mt-4"
      >
        <motion.button
          animate={{ scale: [1, 1.02, 1] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          whileTap={{ scale: 0.98 }}
          type="button"
          onClick={onComplete}
          disabled={submitting}
          className="w-full rounded-pill bg-[#0A0F1E] px-6 py-4 text-[16px] font-bold text-white shadow-navy transition active:bg-navy-light disabled:opacity-60"
        >
          {submitting ? "Loading…" : "Let's go →"}
        </motion.button>
      </motion.div>
    </div>
  );
}

function Star() {
  return (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path d="M10 1.5l2.6 5.27 5.82.85-4.21 4.1.99 5.78L10 14.77 4.8 17.5l.99-5.78L1.58 7.62l5.82-.85L10 1.5z" />
    </svg>
  );
}
