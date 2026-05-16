"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { DotTexture } from "@/components/DotTexture";

// The wheel no longer routes to a simulator — it hands the user a
// dollar-amount commitment for the day ("don't spend more than $X
// on impulse buys today"). Pure honor system: no in-app reporting,
// no streak coupling, no server-side state. The landed amount is
// persisted to localStorage so the wheel locks for 24h.

type Wedge = {
  amount: number;
  bg: string;
  text: string;
  centerDeg: number; // measured clockwise from the top
};

// 8 wedges, equal 45° distribution. Pastel palette is arranged so
// no two adjacent wedges share a hue family — read counter-clockwise
// the order is lavender → yellow → mint → coral → sky → peach →
// lavender-variant → mint-variant, with the loop closing back on
// lavender from mint-variant (still different families). The `text`
// color also doubles as the dot-pattern fill so each slice gets
// "darker tone of itself" speckling, matching every other pastel
// surface in the app.
const WEDGES: Wedge[] = [
  { amount: 5, bg: "#E8E3FF", text: "#4C1D95", centerDeg: 0 }, // lavender
  { amount: 6, bg: "#FFF3CD", text: "#78350F", centerDeg: 45 }, // soft yellow
  { amount: 7, bg: "#D1FAE5", text: "#064E3B", centerDeg: 90 }, // mint
  { amount: 8, bg: "#FFE4E1", text: "#8B2500", centerDeg: 135 }, // coral
  { amount: 10, bg: "#DBEAFE", text: "#1E3A8A", centerDeg: 180 }, // sky blue
  { amount: 11, bg: "#FFE4D1", text: "#9A3412", centerDeg: 225 }, // peach
  { amount: 12, bg: "#F3E8FF", text: "#6B21A8", centerDeg: 270 }, // lavender variant
  { amount: 13, bg: "#ECFDF5", text: "#047857", centerDeg: 315 }, // mint variant
];

const CX = 100;
const CY = 100;
const R = 92;
const SPIN_MS = 2800;
const TURNS = 6;
const EASING = "cubic-bezier(0.17, 0.67, 0.15, 1)";
const SLICE_HALF = 360 / WEDGES.length / 2; // 22.5°

// Persistence — the wheel is locked for 24h after each spin. Stored
// shape: { date: "YYYY-MM-DD", amount: number }. The date is
// compared against the user's local midnight on mount, so the lock
// naturally releases when the date rolls over. Intentionally
// client-only: no API call, no DB write.
const STORAGE_KEY = "dopiq-daily-challenge";

type StoredChallenge = { date: string; amount: number };

function todayLocal(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function slicePath(startDeg: number, endDeg: number): string {
  const toRad = (d: number) => ((d - 90) * Math.PI) / 180;
  const s = toRad(startDeg);
  const e = toRad(endDeg);
  const x1 = CX + R * Math.cos(s);
  const y1 = CY + R * Math.sin(s);
  const x2 = CX + R * Math.cos(e);
  const y2 = CY + R * Math.sin(e);
  const largeArc = endDeg - startDeg > 180 ? 1 : 0;
  return `M${CX},${CY} L${x1},${y1} A${R},${R} 0 ${largeArc} 1 ${x2},${y2} Z`;
}

export function DailySpinWheel() {
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [landedIdx, setLandedIdx] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Hydrate from localStorage. If the user already spun today, snap
  // the wheel to that wedge without animating (the spin already
  // happened earlier today) and lock the button. The SSR pass
  // renders rotation=0 / landedIdx=null; this effect runs after
  // first paint and either confirms that state or jumps to the
  // landed position.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as StoredChallenge | null;
      if (
        !parsed ||
        typeof parsed.amount !== "number" ||
        typeof parsed.date !== "string"
      ) {
        return;
      }
      if (parsed.date !== todayLocal()) return;
      const idx = WEDGES.findIndex((w) => w.amount === parsed.amount);
      if (idx < 0) return;
      setRotation((360 - WEDGES[idx].centerDeg) % 360);
      setLandedIdx(idx);
    } catch {
      // Malformed JSON / unavailable storage — leave the wheel
      // spinnable and don't surface the error.
    }
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  function spin() {
    if (spinning || landedIdx !== null) return;
    setSpinning(true);

    const idx = Math.floor(Math.random() * WEDGES.length);
    const centerDeg = WEDGES[idx].centerDeg;

    // For wedge N's center to land at the top (0°), total rotation
    // modulo 360 must equal (360 - centerDeg) % 360. Travel clockwise
    // from the current visual position, add TURNS full turns.
    const targetMod = (360 - centerDeg) % 360;
    const currentMod = ((rotation % 360) + 360) % 360;
    let travel = targetMod - currentMod;
    if (travel <= 0) travel += 360;
    const next = rotation + TURNS * 360 + travel;

    setRotation(next);

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setSpinning(false);
      setLandedIdx(idx);
      try {
        const payload: StoredChallenge = {
          date: todayLocal(),
          amount: WEDGES[idx].amount,
        };
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      } catch {
        // Private mode / quota exhausted — accept a one-session
        // result instead of a 24h lock.
      }
    }, SPIN_MS);
  }

  const landed = landedIdx !== null ? WEDGES[landedIdx] : null;
  const locked = landedIdx !== null;

  return (
    <div className="flex flex-col items-center gap-5">
      {/* Wheel — tap to spin */}
      <motion.button
        type="button"
        onClick={spin}
        disabled={spinning || locked}
        aria-label={
          spinning
            ? "Spinning"
            : locked
              ? "Already spun today"
              : "Tap to spin the daily challenge wheel"
        }
        whileHover={!spinning && !locked ? { scale: 1.03 } : undefined}
        whileTap={!spinning && !locked ? { scale: 0.97 } : undefined}
        transition={{ duration: 0.15, ease: "easeOut" }}
        className="relative h-[240px] w-[240px] cursor-pointer rounded-full focus:outline-none focus-visible:ring-4 focus-visible:ring-brand/30 disabled:cursor-default md:h-[280px] md:w-[280px]"
        style={{
          boxShadow: spinning
            ? "0 0 60px rgba(0, 200, 83, 0.35), 0 0 24px rgba(0, 200, 83, 0.25)"
            : "0 8px 28px rgba(10, 15, 30, 0.12)",
          transition: "box-shadow 0.4s ease",
        }}
      >
        {/* Fixed pointer — dark navy */}
        <svg
          width="32"
          height="26"
          viewBox="0 0 32 26"
          className="absolute left-1/2 top-[-8px] z-10 -translate-x-1/2 drop-shadow-md"
          aria-hidden
        >
          <path d="M16 26 L2 2 L30 2 Z" fill="#0A0F1E" />
        </svg>

        {/* Rotating wheel — plain CSS transform + transition. The
            transition is suppressed when we snap on hydrate so the
            wheel doesn't ease from 0° into the stored landed
            position on already-spun mounts. */}
        <div
          className="h-full w-full"
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: spinning
              ? `transform ${SPIN_MS}ms ${EASING}`
              : "none",
            willChange: "transform",
          }}
        >
          <svg
            viewBox="0 0 200 200"
            className="h-full w-full"
            role="img"
            aria-label="Daily challenge wheel"
          >
            {/* Per-wedge dot patterns — fill keyed off each wedge's
                deep text color so the speckle matches the existing
                pastel-card vocabulary. Lives inside the rotating
                <svg> so the dots rotate with the wedges instead of
                staying static. */}
            <defs>
              {WEDGES.map((w) => (
                <pattern
                  key={w.amount}
                  id={`wheel-dots-${w.amount}`}
                  x="0"
                  y="0"
                  width="14"
                  height="14"
                  patternUnits="userSpaceOnUse"
                >
                  <circle cx="2" cy="2" r="1.4" fill={w.text} />
                </pattern>
              ))}
            </defs>

            {/* Outer dark-navy ring */}
            <circle cx={CX} cy={CY} r={R + 4} fill="#0A0F1E" />

            {WEDGES.map((w, i) => {
              const start = w.centerDeg - SLICE_HALF;
              const end = w.centerDeg + SLICE_HALF;
              const isWinner = landedIdx === i;
              const labelAngle = ((w.centerDeg - 90) * Math.PI) / 180;
              // Outer-rim placement (0.75R). Wedges fan wider toward
              // the rim, so a label here has more arc room than at
              // the old 0.62R — $13 in particular stops crowding its
              // wedge edges.
              const labelRadius = R * 0.75;
              const labelX = CX + labelRadius * Math.cos(labelAngle);
              const labelY = CY + labelRadius * Math.sin(labelAngle);
              const d = slicePath(start, end);
              return (
                <g key={w.amount}>
                  <path
                    d={d}
                    fill={w.bg}
                    stroke="#FBF3E5"
                    strokeWidth={2}
                    style={{
                      filter: isWinner
                        ? `drop-shadow(0 0 12px ${w.bg}) drop-shadow(0 0 22px ${w.bg})`
                        : "none",
                      transition: "filter 0.35s ease",
                    }}
                  />
                  <path
                    d={d}
                    fill={`url(#wheel-dots-${w.amount})`}
                    opacity={0.07}
                    pointerEvents="none"
                  />
                  {/* Carnival-wheel labels: rotated to follow their
                      wedge's center ray (centerDeg). Top reads
                      upright, sides sideways, bottom upside-down —
                      the classic wheel-of-fortune look. centerDeg
                      is the true wedge midpoint (slicePath draws
                      centerDeg ± SLICE_HALF) so the label sits dead
                      center of its wedge. */}
                  <g
                    transform={`translate(${labelX}, ${labelY}) rotate(${w.centerDeg})`}
                  >
                    <text
                      x={0}
                      y={5}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize={17}
                      fontWeight={800}
                      letterSpacing={0.2}
                      fill={w.text}
                      style={{ fontFamily: "var(--font-sniglet)" }}
                    >
                      ${w.amount}
                    </text>
                  </g>
                </g>
              );
            })}

            {/* Center hub — dark navy with brand-green accent dot. */}
            <circle cx={CX} cy={CY} r={12} fill="#0A0F1E" />
            <circle cx={CX} cy={CY} r={5} fill="#00C853" />
          </svg>
        </div>
      </motion.button>

      {/* Take the Dopiq Challenge button */}
      <motion.button
        type="button"
        onClick={spin}
        disabled={spinning || locked}
        whileTap={!spinning && !locked ? { scale: 0.94 } : undefined}
        whileHover={!spinning && !locked ? { scale: 1.03 } : undefined}
        animate={!spinning && !locked ? { y: [0, -3, 0] } : { y: 0 }}
        transition={
          !spinning && !locked
            ? { duration: 1.6, repeat: Infinity, ease: "easeInOut" }
            : { duration: 0.2 }
        }
        // Pastel lavender outlined pill with the shared DotTexture
        // baked in — same treatment as the previous "Can't Decide"
        // pill so the visual rhythm of the home page stays put. The
        // disabled state (already-spun-today) drops to 0.6 opacity
        // via the disabled: utility.
        className="relative inline-flex w-full max-w-xs items-center justify-center overflow-hidden rounded-pill border-[2.5px] bg-[#E8E3FF] px-6 py-3.5 text-[15px] font-semibold tracking-tight text-[#4C1D95] shadow-sm transition-colors duration-150 active:bg-[#D8CFFF] disabled:pointer-events-none disabled:opacity-60"
        style={{ borderColor: "#2A1F18" }}
      >
        <DotTexture className="text-[#4C1D95]" />
        <span className="relative">
          {spinning
            ? "Spinning…"
            : locked
              ? "Already spun today"
              : "Take the Dopiq Challenge"}
        </span>
      </motion.button>

      {/* Result card — pure commitment moment. No CTA, no nav. */}
      <AnimatePresence>
        {landed && !spinning && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            // Card tint follows the winning wedge — DotTexture
            // inherits the same deep text color (passed via inline
            // `color`) for darker-tone-of-itself speckling.
            className="relative w-full max-w-xs overflow-hidden rounded-card border-[2.5px] p-5 text-center shadow-card"
            style={{
              backgroundColor: landed.bg,
              borderColor: "#2A1F18",
            }}
          >
            <DotTexture style={{ color: landed.text }} />
            <p
              className="font-playful relative text-[16px] font-bold leading-snug"
              style={{ color: landed.text }}
            >
              Your Dopiq Challenge: don&rsquo;t spend more than $
              {landed.amount} on impulse buys today.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
