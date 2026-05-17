"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type Variants,
} from "framer-motion";
import AmbientBreath from "@/components/motion/AmbientBreath";

type Stage = 1 | 2 | 3 | 4;

const screenVariants: Variants = {
  enter: { x: 320, opacity: 0 },
  center: { x: 0, opacity: 1 },
  exit: { x: -320, opacity: 0 },
};

const screenTransition = { type: "spring", stiffness: 280, damping: 30 } as const;

export function OnboardingFlow({
  excludeBet = false,
}: {
  excludeBet?: boolean;
}) {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>(1);
  const [submitting, setSubmitting] = useState(false);

  async function complete() {
    if (submitting) return;
    setSubmitting(true);
    try {
      await fetch("/api/onboarding/complete", { method: "POST" });
    } catch {
      // best-effort — if the write fails the user moves on; they'll
      // see the onboarding once more on next visit.
    }
    router.push("/paywall");
  }

  return (
    <main className="relative flex min-h-[100dvh] flex-col bg-[#FAFAF8] safe-top">
      {/* Top bar — progress dots + skip */}
      <header className="flex items-center justify-between px-6 pb-3 pt-4">
        <ProgressDots stage={stage} />
        <button
          type="button"
          onClick={complete}
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
              <Screen1
                onAdvance={() => setStage(2)}
                excludeBet={excludeBet}
              />
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
              <Screen2
                onAdvance={() => setStage(3)}
                excludeBet={excludeBet}
              />
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
              <Screen3 onAdvance={() => setStage(4)} />
            </motion.div>
          )}
          {stage === 4 && (
            <motion.div
              key="s4"
              variants={screenVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={screenTransition}
              className="flex flex-1 flex-col"
            >
              <Screen4 onComplete={complete} submitting={submitting} />
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
    <div className="flex items-center gap-2" aria-label={`Step ${stage} of 4`}>
      {[1, 2, 3, 4].map((n) => (
        <span
          key={n}
          className={`h-2 rounded-full transition-all duration-300 ${
            n === stage ? "w-6 bg-[#0A0F1E]" : "w-2 bg-[#E5E7EB]"
          }`}
        />
      ))}
    </div>
  );
}

// ---------- Shared primitives ----------

const PRIMARY_BUTTON_CLASS =
  "w-full rounded-pill bg-[#0A0F1E] px-6 py-4 text-center font-heading text-[16px] font-bold text-white shadow-navy transition active:bg-navy-light disabled:opacity-60";

function NextButton({
  label = "Next",
  onClick,
  delay = 0,
  pulse = false,
  disabled = false,
}: {
  label?: string;
  onClick: () => void;
  delay?: number;
  pulse?: boolean;
  disabled?: boolean;
}) {
  if (pulse) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.45 }}
        className="mt-4"
      >
        <motion.button
          animate={{ scale: [1, 1.02, 1] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          whileTap={{ scale: 0.98 }}
          type="button"
          onClick={onClick}
          disabled={disabled}
          className={PRIMARY_BUTTON_CLASS}
        >
          {label}
        </motion.button>
      </motion.div>
    );
  }
  return (
    <motion.button
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.45 }}
      whileTap={{ scale: 0.98 }}
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`${PRIMARY_BUTTON_CLASS} mt-4`}
    >
      {label}
    </motion.button>
  );
}

// ---------- Screen 1: Who are you? ----------

// Each option is tagged with a `category` so the iOS path can
// drop the betting prompt — Apple disallows gambling features for
// individual developer accounts, so even asking the user to
// self-identify as a bettor doesn't fit the iOS surface.
const SCREEN_1_OPTIONS = [
  {
    category: "shop" as const,
    bg: "#F3E8FF",
    fg: "#4A148C",
    label: "My cart is always full of things I don't need.",
    response: "Your cart deserves a safe place to live. We built it.",
  },
  {
    category: "food" as const,
    bg: "#FFF9E6",
    fg: "#5D4037",
    label: "I order food delivery way more than I should.",
    response: "Those cravings are real. So is our food simulator.",
  },
  {
    category: "tickets" as const,
    bg: "#FFE4D6",
    fg: "#7C2D12",
    label: "I doom-scroll Ticketmaster and StubHub for fun.",
    response: "The hunt is real. The fees aren't. Now sim it.",
  },
  {
    category: "bet" as const,
    bg: "#E8F0FF",
    fg: "#1A237E",
    label: "I bet for the thrill more than the money.",
    response: "The thrill is real. Now you can keep your money too.",
  },
  {
    category: "all" as const,
    bg: "#E8F5E9",
    fg: "#1B5E20",
    label: "I do all of these and I want to stop.",
    response:
      "You came to exactly the right place. Dopiq was built for you.",
  },
];

function Screen1({
  onAdvance,
  excludeBet,
}: {
  onAdvance: () => void;
  excludeBet: boolean;
}) {
  // Drop the betting trigger when this is rendering inside the iOS
  // shell — Apple disallows gambling features for individual
  // developer accounts.
  const options = excludeBet
    ? SCREEN_1_OPTIONS.filter((o) => o.category !== "bet")
    : SCREEN_1_OPTIONS;
  const [selected, setSelected] = useState<number | null>(null);
  const [nextVisible, setNextVisible] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (selected === null) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setNextVisible(true), 1500);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [selected]);

  const response =
    selected !== null ? options[selected].response : null;

  return (
    <div className="flex flex-1 flex-col px-5 pb-8 pt-2">
      <motion.h1
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="font-heading text-center text-[28px] font-bold leading-tight tracking-tight text-[#0A0F1E] md:text-[32px]"
      >
        Which of these sounds like you?
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12, duration: 0.4 }}
        className="mt-2 text-center text-[15px] text-ink-muted md:text-[16px]"
      >
        Be honest. No judgment here.
      </motion.p>

      <motion.ul
        initial="hidden"
        animate="show"
        variants={{
          hidden: {},
          show: { transition: { staggerChildren: 0.15, delayChildren: 0.25 } },
        }}
        className="mt-6 flex flex-col gap-3"
      >
        {options.map((opt, i) => {
          const isSelected = selected === i;
          const restShadow = "0 2px 12px rgba(0,0,0,0.08)";
          // Glow matches the option's own colour identity (lavender
          // card → lavender glow, amber → amber, etc.) via the fg
          // hue at low alpha.
          const glowShadow = `${restShadow}, 0 0 0 1px ${opt.fg}33, 0 12px 30px -8px ${opt.fg}66`;
          return (
            <motion.li
              key={i}
              variants={{
                hidden: { opacity: 0, y: 18 },
                show: { opacity: 1, y: 0 },
              }}
              transition={{ type: "spring", stiffness: 220, damping: 24 }}
            >
              <motion.button
                type="button"
                onClick={() => setSelected(i)}
                animate={{
                  scale: isSelected ? (reduce ? 1.02 : [1, 1.04, 1.02]) : 1,
                  boxShadow: isSelected ? glowShadow : restShadow,
                }}
                whileTap={{ scale: 0.99 }}
                transition={
                  reduce ? { duration: 0 } : { duration: 0.25, ease: "easeOut" }
                }
                className="w-full rounded-card border-2 px-5 py-4 text-left transition-colors duration-200"
                style={{
                  backgroundColor: opt.bg,
                  color: opt.fg,
                  borderColor: isSelected ? "#0A0F1E" : "transparent",
                }}
              >
                <p className="font-sans text-[15px] font-bold leading-snug md:text-[16px]">
                  {opt.label}
                </p>
              </motion.button>
            </motion.li>
          );
        })}
      </motion.ul>

      <AnimatePresence>
        {selected !== null && (
          <motion.p
            key="seeyou"
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 8 }}
            animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.2 }}
            className="font-playful mt-5 text-center text-[14px] italic text-ink-muted"
          >
            Yeah, we see you.
          </motion.p>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {response && (
          <motion.p
            key="response"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.35 }}
            className="mt-5 text-center text-[14px] italic leading-relaxed text-ink-muted md:text-[15px]"
          >
            {response}
          </motion.p>
        )}
      </AnimatePresence>

      <div className="mt-auto pt-6">
        <AnimatePresence>
          {nextVisible && <NextButton onClick={onAdvance} />}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ---------- Screen 2: Meet Dopiq ----------

const SCREEN_2_FEATURES = [
  {
    category: "shop" as const,
    bg: "#F3E8FF",
    title: "Shop Simulator",
    body: "Fill the cart. Scratch the itch. Close the app richer.",
  },
  {
    category: "food" as const,
    bg: "#FFF9E6",
    title: "Food Simulator",
    body: "Build the order. Watch the driver. Skip the charge.",
  },
  {
    category: "bet" as const,
    bg: "#E8F0FF",
    title: "Betting Simulator",
    body: "Real odds, fake money. Place parlays, feel the rush. All the thrill, none of the risk.",
  },
  {
    category: "tickets" as const,
    bg: "#D1FAE5",
    title: "Tickets Simulator",
    body: "Feel the rush. Beat the queue. Keep the cash.",
  },
  {
    category: "quick-sim" as const,
    bg: "#E8F5E9",
    title: "Quick Sim",
    body: "Impulse hitting? Sim it. Walk away.",
  },
];

function Screen2({
  onAdvance,
  excludeBet,
}: {
  onAdvance: () => void;
  excludeBet: boolean;
}) {
  // Drop the Betting Simulator card on iOS for the same reason
  // Screen1 drops the betting trigger.
  const features = excludeBet
    ? SCREEN_2_FEATURES.filter((f) => f.category !== "bet")
    : SCREEN_2_FEATURES;
  return (
    <div className="flex flex-1 flex-col px-5 pb-8 pt-2">
      <motion.h1
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="font-heading text-[26px] font-bold leading-tight tracking-tight text-[#0A0F1E] md:text-[30px]"
      >
        Meet Dopiq. Your impulse control companion.
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12, duration: 0.4 }}
        className="mt-3 text-[15px] leading-relaxed text-ink-muted md:text-[16px]"
      >
        Your brain wants the hit. Dopiq gives it somewhere safe to go.
      </motion.p>

      <motion.ul
        initial="hidden"
        animate="show"
        variants={{
          hidden: {},
          show: { transition: { staggerChildren: 0.2, delayChildren: 0.45 } },
        }}
        className="mt-6 flex flex-col gap-3"
      >
        {features.map((f, i) => (
          <motion.li
            key={i}
            variants={{
              hidden: { opacity: 0, y: 18 },
              show: { opacity: 1, y: 0 },
            }}
            transition={{ type: "spring", stiffness: 220, damping: 24 }}
            className="rounded-card px-5 py-4 shadow-card"
            style={{ backgroundColor: f.bg }}
          >
            <p className="font-heading text-[16px] font-bold text-[#0A0F1E]">
              {f.title}
            </p>
            <p className="mt-1 text-[14px] leading-relaxed text-[#0A0F1E]/80">
              {f.body}
            </p>
          </motion.li>
        ))}
      </motion.ul>

      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.45, duration: 0.45 }}
        className="mt-6 text-center text-[14px] italic text-ink-muted"
      >
        The urge is real. The charge isn&rsquo;t.
      </motion.p>

      <div className="mt-auto pt-6">
        <NextButton onClick={onAdvance} delay={1.6} />
      </div>
    </div>
  );
}

// ---------- Screen 3: Stats ----------

const SCREEN_3_STATS = [
  {
    bg: "#F3E8FF",
    heroClass: "type-hero-amount-lavender",
    target: 89,
    format: (v: number) => `${Math.round(v)}%`,
    description: "of Gen Z regret at least one impulse purchase.",
    source: "Consumer Survey, 2025",
  },
  {
    bg: "#FFF9E6",
    heroClass: "type-hero-amount-amber",
    target: 60,
    format: (v: number) => `${Math.round(v)}%`,
    description:
      "of people impulse buy because of social media — and most regret it.",
    source: "Bankrate, 2023",
  },
  {
    bg: "#E8F0FF",
    heroClass: "type-hero-amount-blue",
    target: 2,
    format: (v: number) => `${Math.round(v)}x`,
    description: "Gen Z spends nearly twice as much as they have in savings.",
    source: "Bank of America Institute, 2025",
  },
];

function Screen3({ onAdvance }: { onAdvance: () => void }) {
  return (
    <div className="flex flex-1 flex-col px-5 pb-8 pt-2">
      <motion.h1
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="font-heading text-center text-[28px] font-bold leading-tight tracking-tight text-[#0A0F1E] md:text-[32px]"
      >
        You are not alone in this.
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12, duration: 0.4 }}
        className="mt-2 text-center text-[15px] text-ink-muted md:text-[16px]"
      >
        The numbers tell the real story.
      </motion.p>

      <ul className="mt-6 flex flex-col gap-3">
        {SCREEN_3_STATS.map((s, i) => (
          <StatCard
            key={i}
            bg={s.bg}
            heroClass={s.heroClass}
            target={s.target}
            format={s.format}
            description={s.description}
            source={s.source}
            delay={0.3 + i * 0.3}
          />
        ))}
      </ul>

      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.4, duration: 0.5 }}
        className="mt-6 text-center font-heading text-[20px] font-bold leading-snug text-[#0A0F1E] md:text-[22px]"
      >
        Dopiq gives the urge somewhere safe to go.
      </motion.p>

      <div className="mt-auto pt-6">
        <NextButton onClick={onAdvance} delay={1.6} />
      </div>
    </div>
  );
}

function StatCard({
  bg,
  heroClass,
  target,
  format,
  description,
  source,
  delay,
}: {
  bg: string;
  heroClass: string;
  target: number;
  format: (v: number) => string;
  description: string;
  source: string;
  delay: number;
}) {
  return (
    <motion.li
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: "spring", stiffness: 220, damping: 24 }}
      className="rounded-card px-5 py-5 shadow-card"
      style={{ backgroundColor: bg }}
    >
      <CountUpNumber
        target={target}
        format={format}
        heroClass={heroClass}
        durationMs={1000}
        startDelayMs={Math.round(delay * 1000)}
      />
      <p className="mt-2 text-[15px] leading-snug text-[#0A0F1E] md:text-[16px]">
        {description}
      </p>
      <p className="mt-2 text-[11px] italic text-ink-muted">{source}</p>
    </motion.li>
  );
}

function CountUpNumber({
  target,
  format,
  heroClass,
  durationMs,
  startDelayMs,
}: {
  target: number;
  format: (v: number) => string;
  heroClass: string;
  durationMs: number;
  startDelayMs: number;
}) {
  const ref = useRef<HTMLParagraphElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    // Reduced motion: skip the count-up entirely and paint the
    // final value on first frame.
    if (reduce) {
      if (ref.current) ref.current.textContent = format(target);
      return;
    }
    // Wait until the card has slid in before kicking off the count-up.
    // Writing directly to textContent via a ref keeps React out of
    // the per-frame loop.
    if (ref.current) ref.current.textContent = format(0);
    let raf = 0;
    const startTimer = window.setTimeout(() => {
      const start = performance.now();
      const tick = (now: number) => {
        const elapsed = now - start;
        const t = Math.min(1, elapsed / durationMs);
        const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
        const current = target * eased;
        if (ref.current) {
          ref.current.textContent = t === 1 ? format(target) : format(current);
        }
        if (t < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }, startDelayMs);

    return () => {
      window.clearTimeout(startTimer);
      cancelAnimationFrame(raf);
    };
  }, [target, format, durationMs, startDelayMs, reduce]);

  return (
    <p
      ref={ref}
      className={`${heroClass} text-[56px] leading-none tracking-tight md:text-[64px]`}
    >
      {format(0)}
    </p>
  );
}

// ---------- Screen 4: Closer ----------

const PREVIEW_CARDS = [
  {
    surface: "surface-shop",
    title: "Simulate the urge",
    sub: "Fake checkouts. Real relief.",
  },
  {
    surface: "surface-food",
    title: "Watch the relief land",
    sub: "Tracker, ding, payoff — no charge.",
  },
  {
    surface: "surface-quicksim",
    title: "Keep the money",
    sub: "Your savings counter goes up. Nothing else does.",
  },
];

function Screen4({
  onComplete,
  submitting,
}: {
  onComplete: () => void;
  submitting: boolean;
}) {
  const reduce = useReducedMotion();
  return (
    <div className="flex flex-1 flex-col items-stretch justify-center px-5 pb-8 pt-2">
      <motion.div
        initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
        animate={reduce ? { opacity: 1 } : { opacity: 1, scale: 1 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="mx-auto mb-7"
      >
        <motion.div
          animate={reduce ? undefined : { scale: [1, 1.03, 1] }}
          transition={
            reduce
              ? undefined
              : { duration: 3, repeat: Infinity, ease: "easeInOut" }
          }
        >
          <Image
            src="/onboarding/dopiq-dog.png"
            alt="Dopiq mascot"
            width={200}
            height={200}
            priority
            className="h-[160px] w-[160px] md:h-[200px] md:w-[200px]"
          />
        </motion.div>
      </motion.div>
      <motion.h1
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="font-heading text-center text-[32px] font-bold leading-tight tracking-tight text-[#0A0F1E] md:text-[36px]"
      >
        Ready to feel the rush — without the damage?
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4 }}
        className="mt-3 text-center text-[17px] text-ink-muted md:text-[18px]"
      >
        Welcome to Dopiq.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, scaleX: 0.6 }}
        animate={{ opacity: 1, scaleX: 1 }}
        transition={{ delay: 0.28, duration: 0.4 }}
        className="mx-auto mt-5 h-px w-24 bg-[#E5E7EB]"
      />

      <motion.div
        initial="hidden"
        animate="show"
        variants={{
          hidden: {},
          show: { transition: { staggerChildren: 0.15, delayChildren: 0.4 } },
        }}
        className="mt-6 flex flex-col gap-3"
      >
        {PREVIEW_CARDS.map((c, i) => (
          <motion.div
            key={i}
            variants={{
              hidden: { opacity: 0, y: 8 },
              show: { opacity: 1, y: 0 },
            }}
            transition={{ duration: 0.35 }}
          >
            <AmbientBreath duration={3.4 + i * 0.5} amplitude={1.5}>
              <div className={`${c.surface} px-5 py-4`}>
                <p className="font-heading text-[16px] font-bold text-[#0A0F1E]">
                  {c.title}
                </p>
                <p className="mt-1 text-[14px] leading-snug text-[#0A0F1E]/70">
                  {c.sub}
                </p>
              </div>
            </AmbientBreath>
          </motion.div>
        ))}
      </motion.div>

      <NextButton
        label={submitting ? "Loading…" : "Let's get started"}
        onClick={onComplete}
        delay={0.95}
        pulse
        disabled={submitting}
      />

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.15, duration: 0.4 }}
        className="mt-3 text-center text-[12px] text-ink-muted"
      >
        By continuing you agree to our{" "}
        <Link
          href="/terms"
          className="text-brand underline-offset-2 hover:underline"
        >
          terms
        </Link>{" "}
        and{" "}
        <Link
          href="/privacy"
          className="text-brand underline-offset-2 hover:underline"
        >
          privacy policy
        </Link>
        .
      </motion.p>
    </div>
  );
}
