"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";

type Sector = {
  key: "shop" | "food" | "bet";
  label: string;
  href: string;
  fill: string;
  textColor: string;
  centerDeg: number; // measured clockwise from the top
};

// Three sectors at 0°, 120°, 240° from the top. Sector colours match
// the home simulator cards so the wheel feels like a continuation of
// the same surface.
const SECTORS: Sector[] = [
  {
    key: "shop",
    label: "Shop",
    href: "/shop",
    fill: "#E8E3FF",
    textColor: "#4C1D95",
    centerDeg: 0,
  },
  {
    key: "food",
    label: "Food",
    href: "/food",
    fill: "#FFF3CD",
    textColor: "#78350F",
    centerDeg: 120,
  },
  {
    key: "bet",
    label: "Bet",
    href: "/bet",
    fill: "#DBEAFE",
    textColor: "#1E3A8A",
    centerDeg: 240,
  },
];

const CX = 100;
const CY = 100;
const R = 92;
const SPIN_MS = 2800;
const TURNS = 6;
const EASING = "cubic-bezier(0.17, 0.67, 0.15, 1)";

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

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  function spin() {
    if (spinning) return;
    setLandedIdx(null);
    setSpinning(true);

    const idx = Math.floor(Math.random() * SECTORS.length);
    const sectorCenter = SECTORS[idx].centerDeg;

    // For sector N's center to land at the top (0°), total rotation modulo
    // 360 must equal (360 - centerDeg) % 360. Compute how far to travel
    // clockwise from the current visual position, add TURNS full turns.
    const targetMod = (360 - sectorCenter) % 360;
    const currentMod = ((rotation % 360) + 360) % 360;
    let travel = targetMod - currentMod;
    if (travel <= 0) travel += 360;
    const next = rotation + TURNS * 360 + travel;

    setRotation(next);

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setSpinning(false);
      setLandedIdx(idx);
    }, SPIN_MS);
  }

  const landed = landedIdx !== null ? SECTORS[landedIdx] : null;

  return (
    <div className="flex flex-col items-center gap-5">
      {/* Wheel — tap to spin */}
      <motion.button
        type="button"
        onClick={spin}
        disabled={spinning}
        aria-label={spinning ? "Spinning" : "Tap to spin"}
        whileHover={!spinning ? { scale: 1.03 } : undefined}
        whileTap={!spinning ? { scale: 0.97 } : undefined}
        transition={{ duration: 0.15, ease: "easeOut" }}
        className="relative h-[240px] w-[240px] cursor-pointer rounded-full focus:outline-none focus-visible:ring-4 focus-visible:ring-[#E65100]/30 disabled:cursor-default md:h-[280px] md:w-[280px]"
        style={{
          // Warm glow appears only while spinning — fades out when settled.
          boxShadow: spinning
            ? "0 0 60px rgba(230, 81, 0, 0.35), 0 0 24px rgba(230, 81, 0, 0.25)"
            : "0 8px 28px rgba(44, 24, 16, 0.10)",
          transition: "box-shadow 0.4s ease",
        }}
      >
        {/* Fixed pointer — warm dark brown */}
        <svg
          width="32"
          height="26"
          viewBox="0 0 32 26"
          className="absolute left-1/2 top-[-8px] z-10 -translate-x-1/2 drop-shadow-md"
          aria-hidden
        >
          <path d="M16 26 L2 2 L30 2 Z" fill="#2C1810" />
        </svg>

        {/* Rotating wheel — plain CSS transform + transition */}
        <div
          className="h-full w-full"
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: `transform ${SPIN_MS}ms ${EASING}`,
            willChange: "transform",
          }}
        >
          <svg
            viewBox="0 0 200 200"
            className="h-full w-full"
            role="img"
            aria-label="Spin wheel"
          >
            {/* Outer warm-brown ring */}
            <circle cx={CX} cy={CY} r={R + 4} fill="#2C1810" />

            {SECTORS.map((sector, i) => {
              const start = sector.centerDeg - 60;
              const end = sector.centerDeg + 60;
              const isWinner = landedIdx === i;
              const labelAngle = ((sector.centerDeg - 90) * Math.PI) / 180;
              const labelRadius = R * 0.58;
              const labelX = CX + labelRadius * Math.cos(labelAngle);
              const labelY = CY + labelRadius * Math.sin(labelAngle);
              return (
                <g key={sector.key}>
                  <path
                    d={slicePath(start, end)}
                    fill={sector.fill}
                    stroke="#FBF3E5"
                    strokeWidth={2}
                    style={{
                      filter: isWinner
                        ? `drop-shadow(0 0 12px ${sector.fill}) drop-shadow(0 0 22px ${sector.fill})`
                        : "none",
                      transition: "filter 0.35s ease",
                    }}
                  />
                  <g
                    transform={`translate(${labelX}, ${labelY}) rotate(${sector.centerDeg})`}
                  >
                    <text
                      x={0}
                      y={4}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize={15}
                      fontWeight={800}
                      letterSpacing={0.5}
                      fill={sector.textColor}
                      style={{ fontFamily: "var(--font-sora)" }}
                    >
                      {sector.label}
                    </text>
                  </g>
                </g>
              );
            })}

            {/* Center hub — warm brown with amber dot to match the
                streak card's accent. */}
            <circle cx={CX} cy={CY} r={12} fill="#2C1810" />
            <circle cx={CX} cy={CY} r={5} fill="#E65100" />
          </svg>
        </div>
      </motion.button>

      {/* Spin button */}
      <motion.button
        type="button"
        onClick={spin}
        disabled={spinning}
        whileTap={!spinning ? { scale: 0.94 } : undefined}
        whileHover={!spinning ? { scale: 1.03 } : undefined}
        animate={!spinning && !landed ? { y: [0, -3, 0] } : { y: 0 }}
        transition={
          !spinning && !landed
            ? { duration: 1.6, repeat: Infinity, ease: "easeInOut" }
            : { duration: 0.2 }
        }
        className="btn-primary w-full max-w-xs disabled:opacity-100"
      >
        {spinning ? "Spinning…" : landed ? "Spin again" : "Spin to simulate"}
      </motion.button>

      {/* Result card */}
      <AnimatePresence>
        {landed && !spinning && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="card w-full max-w-xs p-5 text-center"
          >
            <p className="text-[18px] font-bold text-ink">
              You landed on {landed.label}.
            </p>
            <Link href={landed.href} className="btn-primary mt-4 w-full">
              Let&rsquo;s go →
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
