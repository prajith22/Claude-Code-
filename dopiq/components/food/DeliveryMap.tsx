"use client";

import { motion } from "framer-motion";

type DeliveryMapProps = {
  stage: number; // 0–4, mirrors the tracking page's stage state
};

// Discrete car positions per stage, tuned for the 400×300 (4:3)
// viewBox. The route is `M 70 95 L 70 150 Q 150 250 330 228`:
// a short straight run down the left vertical street, then ONE
// pronounced quadratic curve sweeping along the lower streets to
// the home pin. Stage-3 (x:175,y:214) is the computed ~midpoint of
// that Bézier; stage-4 lands on the road right at the home marker.
const CAR_POSITIONS: Array<{ x: number; y: number; opacity: number }> = [
  { x: 70, y: 95, opacity: 0 }, // 0 received — hidden at restaurant
  { x: 70, y: 95, opacity: 1 }, // 1 preparing — visible, parked
  { x: 70, y: 120, opacity: 1 }, // 2 picked up — nudged, about to leave
  { x: 175, y: 214, opacity: 1 }, // 3 on the way — mid-route
  { x: 330, y: 228, opacity: 1 }, // 4 delivered — at the home pin
];

// 3×3 light-warm-gray "city blocks". Stylized suggestion of a
// neighborhood, not a real map — the streets are the cream gaps
// between these rects.
const BLOCKS: Array<{ x: number; y: number; w: number; h: number }> = [
  { x: 82, y: 82, w: 106, h: 56 },
  { x: 212, y: 82, w: 106, h: 56 },
  { x: 342, y: 82, w: 54, h: 56 },
  { x: 82, y: 162, w: 106, h: 56 },
  { x: 212, y: 162, w: 106, h: 56 },
  { x: 342, y: 162, w: 54, h: 56 },
  { x: 82, y: 242, w: 106, h: 50 },
  { x: 212, y: 242, w: 106, h: 50 },
];

const ROUTE_D = "M 70 95 L 70 150 Q 150 250 330 228";

export default function DeliveryMap({ stage }: DeliveryMapProps) {
  const pos = CAR_POSITIONS[Math.min(Math.max(stage, 0), 4)];
  // Idle "engine running" wiggle while the car is parked at the
  // restaurant (stages 1–2). Runs on an inner group so it composes
  // cleanly with the outer position tween.
  const idling = stage === 1 || stage === 2;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="surface-food-fill overflow-hidden rounded-card border-[2.5px] p-5 shadow-card"
      style={{ borderColor: "#2A1F18" }}
    >
      <svg
        viewBox="0 0 400 300"
        className="block w-full"
        role="img"
        aria-label="Stylized delivery map showing the driver's progress"
      >
        {/* Cream base */}
        <rect x="0" y="0" width="400" height="300" fill="#F5F0E6" />

        {/* City blocks */}
        {BLOCKS.map((b, i) => (
          <rect
            key={i}
            x={b.x}
            y={b.y}
            width={b.w}
            height={b.h}
            rx="6"
            fill="#E5E0D5"
          />
        ))}

        {/* Street grid — wide light strokes between the blocks */}
        <g stroke="#FBF7EE" strokeWidth="20" strokeLinecap="round">
          <line x1="70" y1="20" x2="70" y2="290" />
          <line x1="200" y1="20" x2="200" y2="290" />
          <line x1="330" y1="20" x2="330" y2="290" />
          <line x1="20" y1="70" x2="396" y2="70" />
          <line x1="20" y1="150" x2="396" y2="150" />
          <line x1="20" y1="230" x2="396" y2="230" />
        </g>

        {/* The delivery route — dashed emerald */}
        <path
          d={ROUTE_D}
          fill="none"
          stroke="#10B981"
          strokeWidth="4"
          strokeDasharray="6 4"
          strokeLinecap="round"
        />

        {/* Both endpoints use the same Pin shape (mirrors
            icons.tsx's Pin) at the same size — only the fill
            differs: coral = food/restaurant, emerald = brand/home.
            Same shape + size reads as "these are both endpoints";
            color tells them apart at a glance. */}
        <MapPin x={58} y={62} fill="#FFE4E1" label="Restaurant" />
        <MapPin x={345} y={238} fill="#10B981" label="Home" />

        {/* The car. Outer group tweens to the stage position; inner
            group carries the optional idle wiggle; innermost group
            centers + scales the car drawing on the origin so the
            position tween places the car's center on the route. */}
        <motion.g
          initial={false}
          animate={{ x: pos.x, y: pos.y, opacity: pos.opacity }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        >
          <motion.g
            animate={idling ? { y: [0, -1.5, 0] } : { y: 0 }}
            transition={
              idling
                ? { duration: 1.1, repeat: Infinity, ease: "easeInOut" }
                : { duration: 0.2 }
            }
          >
            <g transform="scale(1.25)">
              <g transform="translate(-15 -13)">
                {/* Travelling shadow */}
                <ellipse
                  cx="15"
                  cy="20"
                  rx="14"
                  ry="3"
                  fill="#2A1F18"
                  opacity="0.15"
                />
                {/* Body */}
                <path
                  d="M1 14 L3 9 Q4 7 7 7 L21 7 Q24 7 26 10 L29 14 L29 17 Q29 18 28 18 L26.5 18 A2.7 2.7 0 0 0 21 18 L9 18 A2.7 2.7 0 0 0 3.5 18 L2 18 Q1 18 1 17 Z"
                  fill="#10B981"
                  stroke="#2A1F18"
                  strokeWidth="1.4"
                  strokeLinejoin="round"
                />
                {/* Window */}
                <path
                  d="M7.5 8.6 L19 8.6 Q21 8.6 22 10.4 L23.2 12.4 L7.5 12.4 Z"
                  fill="#F5F0E6"
                  stroke="#2A1F18"
                  strokeWidth="1"
                  strokeLinejoin="round"
                />
                {/* Wheels */}
                <circle
                  cx="6.2"
                  cy="18"
                  r="2.7"
                  fill="#2A1F18"
                  stroke="#2A1F18"
                />
                <circle
                  cx="23.8"
                  cy="18"
                  r="2.7"
                  fill="#2A1F18"
                  stroke="#2A1F18"
                />
              </g>
            </g>
          </motion.g>
        </motion.g>
      </svg>
    </motion.div>
  );
}

// Shared endpoint marker. The Pin path is lifted inline from
// components/icons.tsx (same teardrop + center dot) so fill and
// stroke can be controlled independently per marker. The path's
// local tip is (12,22); we anchor that point at (x,y) so the pin
// "points at" its map location. strokeWidth is pre-divided by the
// scale so the rendered outline stays ~2px regardless of S.
function MapPin({
  x,
  y,
  fill,
  label,
}: {
  x: number;
  y: number;
  fill: string;
  label: string;
}) {
  const S = 1.8; // ~25 SVG units wide — matched across both pins
  return (
    <g>
      <g
        transform={`translate(${x - 12 * S} ${y - 22 * S}) scale(${S})`}
      >
        <path
          d="M12 22s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12Z"
          fill={fill}
          stroke="#2A1F18"
          strokeWidth={2 / S}
          strokeLinejoin="round"
        />
        <circle cx="12" cy="10" r="2.5" fill="#2A1F18" />
      </g>
      <text
        x={x}
        y={y + 16}
        textAnchor="middle"
        fontSize="11"
        fontWeight="700"
        fill="#2A1F18"
        style={{ fontFamily: "var(--font-sora)" }}
      >
        {label}
      </text>
    </g>
  );
}
