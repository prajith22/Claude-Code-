import type { SVGProps } from "react";
import type { QuickSimIconKey } from "@/data/quick-sim-items";

/**
 * Quick Sim item-category icons. Single-color monoline outlines, 24x24
 * viewBox, 1.5px stroke, rounded line caps + joins. Stroke uses
 * currentColor so callers can recolor with a className.
 *
 * 10 categories: drink, snack, food, candy, scratch, accessory,
 * magazine, flower, candle, coffee — mapped per-item in
 * data/quick-sim-items.ts.
 */
type Props = SVGProps<SVGSVGElement> & { kind: QuickSimIconKey; size?: number };

function base(size: number): SVGProps<SVGSVGElement> {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.5,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  };
}

export function QuickSimItemIcon({ kind, size = 48, ...rest }: Props) {
  switch (kind) {
    case "drink":
      return <Drink size={size} {...rest} />;
    case "snack":
      return <Snack size={size} {...rest} />;
    case "food":
      return <Food size={size} {...rest} />;
    case "candy":
      return <Candy size={size} {...rest} />;
    case "scratch":
      return <Scratch size={size} {...rest} />;
    case "accessory":
      return <Accessory size={size} {...rest} />;
    case "magazine":
      return <Magazine size={size} {...rest} />;
    case "flower":
      return <Flower size={size} {...rest} />;
    case "candle":
      return <Candle size={size} {...rest} />;
    case "coffee":
      return <Coffee size={size} {...rest} />;
  }
}

function Drink({ size, ...rest }: SVGProps<SVGSVGElement> & { size: number }) {
  return (
    <svg {...base(size)} {...rest}>
      <path d="M6 6h12l-1.5 14a1.5 1.5 0 0 1-1.5 1.4H9A1.5 1.5 0 0 1 7.5 20L6 6Z" />
      <path d="M6 6h12" />
      <path d="M15 3v6" />
    </svg>
  );
}

function Snack({ size, ...rest }: SVGProps<SVGSVGElement> & { size: number }) {
  // Chip / snack bag — sealed jagged top, vertical body.
  return (
    <svg {...base(size)} {...rest}>
      <path d="M6 8h12v12a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 20V8Z" />
      <path d="M6 8 7 5l2 2 1.5-2 1.5 2 1.5-2 1.5 2 2-2 1 3" />
      <path d="M9 13h6M9 16h6" />
    </svg>
  );
}

function Food({ size, ...rest }: SVGProps<SVGSVGElement> & { size: number }) {
  // Plate flanked by fork + knife.
  return (
    <svg {...base(size)} {...rest}>
      <circle cx="12" cy="13" r="5" />
      <path d="M5 3v8M3 3v3M7 3v3" />
      <path d="M19 3v18" />
      <path d="M19 3a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2" />
    </svg>
  );
}

function Candy({ size, ...rest }: SVGProps<SVGSVGElement> & { size: number }) {
  // Wrapper twisted at both ends, capsule center.
  return (
    <svg {...base(size)} {...rest}>
      <rect x="8" y="9" width="8" height="6" rx="1.5" />
      <path d="M8 12c-1.5 1-3 1.5-5 1.5 .8-1 1.2-2.4 1.2-3 0-.6-.4-2-1.2-3 2 0 3.5.5 5 1.5" />
      <path d="M16 12c1.5 1 3 1.5 5 1.5-.8-1-1.2-2.4-1.2-3 0-.6.4-2 1.2-3-2 0-3.5.5-5 1.5" />
    </svg>
  );
}

function Scratch({ size, ...rest }: SVGProps<SVGSVGElement> & { size: number }) {
  // Card with a star.
  return (
    <svg {...base(size)} {...rest}>
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <path d="m12 9 1.4 2.8 3.1.5-2.3 2.2.6 3-2.8-1.5-2.8 1.5.6-3-2.3-2.2 3.1-.5z" />
    </svg>
  );
}

function Accessory({ size, ...rest }: SVGProps<SVGSVGElement> & { size: number }) {
  // Sunglasses — two lenses + bridge.
  return (
    <svg {...base(size)} {...rest}>
      <circle cx="7" cy="14" r="3.5" />
      <circle cx="17" cy="14" r="3.5" />
      <path d="M10.5 14h3" />
      <path d="M3.5 13.5L5 10M20.5 13.5 19 10" />
    </svg>
  );
}

function Magazine({ size, ...rest }: SVGProps<SVGSVGElement> & { size: number }) {
  // Open book — two pages with center spine.
  return (
    <svg {...base(size)} {...rest}>
      <path d="M3 6c3-1 6-1 9 1c3-2 6-2 9-1v12c-3-1-6-1-9 1c-3-2-6-2-9-1V6Z" />
      <path d="M12 7v12" />
      <path d="M6 10h3M6 13h3M15 10h3M15 13h3" />
    </svg>
  );
}

function Flower({ size, ...rest }: SVGProps<SVGSVGElement> & { size: number }) {
  // 5-petal flower with a center disc.
  return (
    <svg {...base(size)} {...rest}>
      <circle cx="12" cy="11" r="2" />
      <circle cx="12" cy="6" r="2.2" />
      <circle cx="16.5" cy="9" r="2.2" />
      <circle cx="14.7" cy="14.5" r="2.2" />
      <circle cx="9.3" cy="14.5" r="2.2" />
      <circle cx="7.5" cy="9" r="2.2" />
      <path d="M12 16v6" />
    </svg>
  );
}

function Candle({ size, ...rest }: SVGProps<SVGSVGElement> & { size: number }) {
  // Cylinder body + wick + teardrop flame.
  return (
    <svg {...base(size)} {...rest}>
      <rect x="9" y="11" width="6" height="10" rx="0.5" />
      <path d="M9 21h6" />
      <path d="M12 11V9" />
      <path d="M12 9c-1.4-1-1.4-2.5 0-4 1.4 1.5 1.4 3 0 4Z" />
    </svg>
  );
}

function Coffee({ size, ...rest }: SVGProps<SVGSVGElement> & { size: number }) {
  // Cup with handle + two steam squiggles.
  return (
    <svg {...base(size)} {...rest}>
      <path d="M5 10h12v6a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3v-6Z" />
      <path d="M17 11h2a2 2 0 0 1 0 4h-2" />
      <path d="M9 4c0 1 1 1 1 2s-1 1-1 2M13 4c0 1 1 1 1 2s-1 1-1 2" />
    </svg>
  );
}
