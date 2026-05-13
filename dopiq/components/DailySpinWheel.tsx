"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";

type Sector = {
  key: "shop" | "food" | "bet" | "tickets";
  label: string;
  href: string;
  fill: string;
  textColor: string;
  centerDeg: number; // measured clockwise from the top
};

// Four sectors at 0° / 90° / 180° / 270° — used on web where every
// simulator (Shop / Food / Bet / Tickets) is in play. The no-Bet
// variant below drops Bet (Apple prohibits gambling on individual
// developer accounts) and falls back to a three-wedge layout at
// 0° / 120° / 240°. Slice math is parameterized off sectors.length,
// so the same render path produces 90°-wide or 120°-wide wedges
// without any further branching.
const SECTORS_FULL: Sector[] = [
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
    centerDeg: 90,
  },
  {
    key: "bet",
    label: "Bet",
    href: "/bet",
    fill: "#DBEAFE",
    textColor: "#1E3A8A",
    centerDeg: 180,
  },
  {
    key: "tickets",
    label: "Tickets",
    href: "/tickets",
    fill: "#D1FAE5",
    textColor: "#064E3B",
    centerDeg: 270,
  },
];

const SECTORS_NO_BET: Sector[] = [
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
    key: "tickets",
    label: "Tickets",
    href: "/tickets",
    fill: "#D1FAE5",
    textColor: "#064E3B",
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

export function DailySpinWheel({
  excludeBet = false,
}: {
  excludeBet?: boolean;
}) {
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [landedIdx, setLandedIdx] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // On iOS, drop the Bet sector and fall back to the three-wedge
  // layout (Shop / Food / Tickets). Slice math (start = center -
  // half, end = center + half) is parameterized off sectors.length
  // so 90°-wide and 120°-wide wedges both draw correctly.
  const sectors = excludeBet ? SECTORS_NO_BET : SECTORS_FULL;
  const sliceHalfWidth = 360 / sectors.length / 2;

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  function spin() {
    if (spinning) return;
    setLandedIdx(null);
    setSpinning(true);

    const idx = Math.floor(Math.random() * sectors.length);
    const sectorCenter = sectors[idx].centerDeg;

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

  const landed = landedIdx !== null ? sectors[landedIdx] : null;

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
        className="relative h-[240px] w-[240px] cursor-pointer rounded-full focus:outline-none focus-visible:ring-4 focus-visible:ring-brand/30 disabled:cursor-default md:h-[280px] md:w-[280px]"
        style={{
          // Brand-green glow appears only while spinning — fades out when settled.
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
            {/* Outer dark-navy ring */}
            <circle cx={CX} cy={CY} r={R + 4} fill="#0A0F1E" />

            {sectors.map((sector, i) => {
              const start = sector.centerDeg - sliceHalfWidth;
              const end = sector.centerDeg + sliceHalfWidth;
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

            {/* Center hub — dark navy with brand-green accent dot. */}
            <circle cx={CX} cy={CY} r={12} fill="#0A0F1E" />
            <circle cx={CX} cy={CY} r={5} fill="#00C853" />
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
        // Pastel mint outlined pill — keeps the wheel as the focal
        // point. Hex matches the Saved Today / Tickets SimCard mint
        // family so it pairs with the surrounding home palette.
        className="inline-flex w-full max-w-xs items-center justify-center rounded-pill border bg-[#D1FAE5] px-6 py-3.5 text-[15px] font-semibold tracking-tight text-[#064E3B] shadow-sm transition-colors duration-150 active:bg-[#B8E5CC] disabled:pointer-events-none disabled:opacity-60"
        style={{ borderColor: "#A7E8C1" }}
      >
        {spinning ? "Spinning…" : landed ? "Spin again" : "Can't Decide"}
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
