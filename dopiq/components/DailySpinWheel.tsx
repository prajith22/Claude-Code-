"use client";

import { useEffect, useState } from "react";
import { motion, useAnimation } from "framer-motion";
import { useRouter } from "next/navigation";

type Sector = {
  key: "shop" | "food" | "bet";
  label: string;
  href: string;
  fill: string;
  textColor: string;
  centerDeg: number; // measured clockwise from top
};

// Sectors rendered with centers at 0°, 120°, 240° from the top.
// Colors match the home simulator cards.
const SECTORS: Sector[] = [
  { key: "shop", label: "Shop", href: "/shop", fill: "#E8E3FF", textColor: "#4C1D95", centerDeg: 0 },
  { key: "food", label: "Food", href: "/food", fill: "#FFF3CD", textColor: "#78350F", centerDeg: 120 },
  { key: "bet",  label: "Bet",  href: "/bet",  fill: "#DBEAFE", textColor: "#1E3A8A", centerDeg: 240 },
];

const STORAGE_KEY = "dopiq-spin-date";
const CX = 100;
const CY = 100;
const R = 92;

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

// Build an SVG path for a pie slice from start→end angles, measured in degrees
// clockwise from the top (12 o'clock).
function slicePath(startDeg: number, endDeg: number) {
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

function playLandingSound() {
  try {
    const AudioCtx =
      (window as unknown as { AudioContext: typeof AudioContext; webkitAudioContext?: typeof AudioContext })
        .AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    // Two-tone bell: perfect fifth, quick decay
    [880, 1320].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      const start = ctx.currentTime + i * 0.04;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.35, start + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.5);
      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.5);
    });
  } catch {
    // AudioContext blocked or unavailable — silently skip.
  }
}

export function DailySpinWheel() {
  const router = useRouter();
  const controls = useAnimation();
  const [mounted, setMounted] = useState(false);
  const [hasSpunToday, setHasSpunToday] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [landedIdx, setLandedIdx] = useState<number | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      setHasSpunToday(stored === todayKey());
    } catch {
      setHasSpunToday(false);
    }
    setMounted(true);
  }, []);

  async function spin() {
    if (spinning || hasSpunToday) return;
    setSpinning(true);
    setLandedIdx(null);

    const idx = Math.floor(Math.random() * SECTORS.length);
    const sector = SECTORS[idx];

    // Aim the wheel so sector N's center lands at the top pointer.
    // We want `(centerDeg + rotation) mod 360 === 0`, so rotate by -centerDeg.
    // Add 5 full turns + a small jitter inside the wedge so it doesn't always
    // land dead center.
    const jitter = Math.random() * 70 - 35; // ±35° (wedge is 120° wide)
    const finalRotation = 5 * 360 + ((360 - sector.centerDeg) % 360) + jitter;

    await controls.start({
      rotate: finalRotation,
      transition: { duration: 2.6, ease: [0.17, 0.67, 0.15, 1.0] },
    });

    playLandingSound();
    setLandedIdx(idx);

    try {
      localStorage.setItem(STORAGE_KEY, todayKey());
    } catch {
      // ignore
    }

    setTimeout(() => {
      router.push(sector.href);
    }, 1000);
  }

  const landedSector = landedIdx != null ? SECTORS[landedIdx] : null;

  // Don't render until we know the localStorage state — avoids flicker.
  if (!mounted) {
    return <div className="h-[360px]" aria-hidden />;
  }

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="relative">
        {/* Pointer */}
        <svg
          width="28"
          height="22"
          viewBox="0 0 28 22"
          className="absolute left-1/2 top-[-6px] z-10 -translate-x-1/2 drop-shadow-md"
          aria-hidden
        >
          <path d="M14 22 L2 2 L26 2 Z" fill="#0A0F1E" />
        </svg>

        {/* Wheel */}
        <svg
          width="260"
          height="260"
          viewBox="0 0 200 200"
          className="drop-shadow-[0_10px_32px_rgba(10,15,30,0.18)]"
          role="img"
          aria-label="Daily spin wheel"
        >
          {/* Outer ring */}
          <circle cx={CX} cy={CY} r={R + 4} fill="#0A0F1E" />

          <motion.g
            animate={controls}
            initial={{ rotate: 0 }}
            style={{ transformBox: "fill-box", transformOrigin: "center" }}
          >
            {SECTORS.map((sector, i) => {
              const start = sector.centerDeg - 60;
              const end = sector.centerDeg + 60;
              const isWinner = landedIdx === i;
              // Place label at 60% of radius from center of the sector
              const labelAngle = ((sector.centerDeg - 90) * Math.PI) / 180;
              const labelX = CX + R * 0.62 * Math.cos(labelAngle);
              const labelY = CY + R * 0.62 * Math.sin(labelAngle);
              return (
                <g key={sector.key}>
                  <motion.path
                    d={slicePath(start, end)}
                    fill={sector.fill}
                    stroke="#FFFFFF"
                    strokeWidth={2}
                    animate={{
                      filter: isWinner
                        ? `drop-shadow(0 0 18px ${sector.fill})`
                        : "drop-shadow(0 0 0px transparent)",
                    }}
                    transition={{ duration: 0.3 }}
                  />
                  <text
                    x={labelX}
                    y={labelY}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    transform={`rotate(${sector.centerDeg} ${labelX} ${labelY})`}
                    fontSize={18}
                    fontWeight={800}
                    fill={sector.textColor}
                    style={{ fontFamily: "var(--font-sora)" }}
                  >
                    {sector.label}
                  </text>
                </g>
              );
            })}
          </motion.g>

          {/* Center hub */}
          <circle cx={CX} cy={CY} r={10} fill="#0A0F1E" />
          <circle cx={CX} cy={CY} r={4} fill="#00C853" />
        </svg>
      </div>

      {/* Button */}
      {hasSpunToday && landedIdx === null ? (
        <div className="w-full max-w-xs rounded-pill border border-surface-border bg-white px-6 py-3.5 text-center text-[14px] font-semibold text-ink-muted">
          Come back tomorrow for another spin
        </div>
      ) : (
        <motion.button
          type="button"
          onClick={spin}
          disabled={spinning || landedIdx !== null}
          whileTap={landedIdx === null && !spinning ? { scale: 0.94 } : undefined}
          whileHover={landedIdx === null && !spinning ? { scale: 1.03 } : undefined}
          animate={
            landedIdx === null && !spinning
              ? { y: [0, -3, 0] }
              : { y: 0 }
          }
          transition={
            landedIdx === null && !spinning
              ? { duration: 1.6, repeat: Infinity, ease: "easeInOut" }
              : { duration: 0.2 }
          }
          className="btn-primary w-full max-w-xs disabled:opacity-100"
        >
          {landedSector
            ? `Going to ${landedSector.label}…`
            : spinning
              ? "Spinning…"
              : "Spin to simulate"}
        </motion.button>
      )}
    </div>
  );
}
