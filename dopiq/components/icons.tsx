import type { SVGProps } from "react";

/**
 * Dopiq icon set. Hand-rolled monoline SVGs, 24x24 viewBox, 1.5px stroke,
 * rounded line caps + joins. Use the `size` prop (default 16) to render
 * at a chosen pixel size; stroke uses `currentColor` so colour is set by
 * the surrounding text colour.
 *
 * Naming: nouns, no decoration — Bag, Bowl, Slot, Spark, Coin, Flame,
 * Clock, Ticket, Pin, Lock, Card, Bolt, Eye, Cloud, Calm, Heart, Star,
 * TV, Wallet, Cart, Couch, Person, Users, Question, ArrowRight.
 *
 * Why this exists: every emoji in the app reads as platform-rendered
 * "demo" — Apple looks different from Windows looks different from
 * Discord, and they break visual hierarchy. One icon style = one brand.
 */

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

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

export function Bag({ size = 16, ...rest }: IconProps) {
  return (
    <svg {...base(size)} {...rest}>
      <path d="M5 8h14l-1 12H6L5 8Z" />
      <path d="M9 8a3 3 0 1 1 6 0" />
    </svg>
  );
}

export function Cart({ size = 16, ...rest }: IconProps) {
  return (
    <svg {...base(size)} {...rest}>
      <path d="M3 4h2l2 12h11l2-8H7" />
      <circle cx="9" cy="20" r="1.4" />
      <circle cx="17" cy="20" r="1.4" />
    </svg>
  );
}

export function Bowl({ size = 16, ...rest }: IconProps) {
  return (
    <svg {...base(size)} {...rest}>
      <path d="M3 11h18a9 9 0 0 1-9 9 9 9 0 0 1-9-9Z" />
      <path d="M9 7c0-1 1-1 1-2s-1-1-1-2M14 7c0-1 1-1 1-2s-1-1-1-2" />
    </svg>
  );
}

export function Slot({ size = 16, ...rest }: IconProps) {
  return (
    <svg {...base(size)} {...rest}>
      <rect x="3.5" y="5" width="17" height="14" rx="2" />
      <path d="M8 9v6M12 9v6M16 9v6" />
    </svg>
  );
}

export function Flame({ size = 16, ...rest }: IconProps) {
  return (
    <svg {...base(size)} {...rest}>
      <path d="M12 3c1 3 4 4 4 8a4 4 0 0 1-8 0c0-2 1-3 1-5 1 1 2 1 3-3Z" />
    </svg>
  );
}

export function Spark({ size = 16, ...rest }: IconProps) {
  return (
    <svg {...base(size)} {...rest}>
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.5 5.5l2.8 2.8M15.7 15.7l2.8 2.8M5.5 18.5l2.8-2.8M15.7 8.3l2.8-2.8" />
    </svg>
  );
}

export function Bolt({ size = 16, ...rest }: IconProps) {
  return (
    <svg {...base(size)} {...rest}>
      <path d="M13 3 5 14h6l-1 7 8-11h-6l1-7Z" />
    </svg>
  );
}

export function Star({ size = 16, ...rest }: IconProps) {
  return (
    <svg {...base(size)} {...rest}>
      <path d="m12 3 2.6 5.3 5.9.9-4.3 4.1 1 5.7L12 16.6l-5.2 2.4 1-5.7L3.5 9.2l5.9-.9L12 3Z" />
    </svg>
  );
}

export function StarFilled({ size = 16, ...rest }: IconProps) {
  return (
    <svg {...base(size)} fill="currentColor" {...rest}>
      <path d="m12 3 2.6 5.3 5.9.9-4.3 4.1 1 5.7L12 16.6l-5.2 2.4 1-5.7L3.5 9.2l5.9-.9L12 3Z" />
    </svg>
  );
}

export function Clock({ size = 16, ...rest }: IconProps) {
  return (
    <svg {...base(size)} {...rest}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

export function Ticket({ size = 16, ...rest }: IconProps) {
  return (
    <svg {...base(size)} {...rest}>
      <path d="M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4V8Z" />
      <path d="M14 6v12" strokeDasharray="2 2" />
    </svg>
  );
}

export function Coin({ size = 16, ...rest }: IconProps) {
  return (
    <svg {...base(size)} {...rest}>
      <circle cx="12" cy="12" r="9" />
      <path d="M9 9h4a2 2 0 0 1 0 4h-4M9 13h4a2 2 0 0 1 0 4h-4M11 7v10" />
    </svg>
  );
}

export function Wallet({ size = 16, ...rest }: IconProps) {
  return (
    <svg {...base(size)} {...rest}>
      <path d="M3 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v0H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2" />
      <circle cx="17" cy="13" r="1.2" />
    </svg>
  );
}

export function Card({ size = 16, ...rest }: IconProps) {
  return (
    <svg {...base(size)} {...rest}>
      <rect x="3" y="6" width="18" height="13" rx="2" />
      <path d="M3 10h18M7 15h3" />
    </svg>
  );
}

export function Lock({ size = 16, ...rest }: IconProps) {
  return (
    <svg {...base(size)} {...rest}>
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 1 1 8 0v3" />
    </svg>
  );
}

export function Pin({ size = 16, ...rest }: IconProps) {
  return (
    <svg {...base(size)} {...rest}>
      <path d="M12 22s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

export function Eye({ size = 16, ...rest }: IconProps) {
  return (
    <svg {...base(size)} {...rest}>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export function Heart({ size = 16, ...rest }: IconProps) {
  return (
    <svg {...base(size)} {...rest}>
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 1 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

export function HeartFilled({ size = 16, ...rest }: IconProps) {
  return (
    <svg {...base(size)} fill="currentColor" {...rest}>
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 1 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

export function TV({ size = 16, ...rest }: IconProps) {
  return (
    <svg {...base(size)} {...rest}>
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <path d="M9 21h6M12 18v3" />
    </svg>
  );
}

export function Couch({ size = 16, ...rest }: IconProps) {
  return (
    <svg {...base(size)} {...rest}>
      <path d="M4 16v-3a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v3" />
      <rect x="3" y="13" width="18" height="6" rx="1.5" />
      <path d="M6 19v2M18 19v2" />
    </svg>
  );
}

export function Users({ size = 16, ...rest }: IconProps) {
  return (
    <svg {...base(size)} {...rest}>
      <circle cx="9" cy="9" r="3.5" />
      <path d="M3 20a6 6 0 0 1 12 0" />
      <circle cx="17" cy="10" r="2.5" />
      <path d="M16 20a5 5 0 0 1 5-5" />
    </svg>
  );
}

export function Calm({ size = 16, ...rest }: IconProps) {
  return (
    <svg {...base(size)} {...rest}>
      <circle cx="12" cy="12" r="9" />
      <path d="M8.5 14c1 1 2 1.5 3.5 1.5s2.5-.5 3.5-1.5M9 9.5h.01M15 9.5h.01" />
    </svg>
  );
}

export function Cloud({ size = 16, ...rest }: IconProps) {
  return (
    <svg {...base(size)} {...rest}>
      <path d="M7 18a4 4 0 0 1 0-8 5 5 0 0 1 9.6-1.6A4.5 4.5 0 0 1 17 18H7Z" />
    </svg>
  );
}

export function Question({ size = 16, ...rest }: IconProps) {
  return (
    <svg {...base(size)} {...rest}>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-1 .4-1 1.2-1 2.2M12 17h.01" />
    </svg>
  );
}

export function ArrowRight({ size = 16, ...rest }: IconProps) {
  return (
    <svg {...base(size)} {...rest}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

export function Check({ size = 16, ...rest }: IconProps) {
  return (
    <svg {...base(size)} {...rest}>
      <path d="m5 12.5 5 5 9-10" />
    </svg>
  );
}

export function X({ size = 16, ...rest }: IconProps) {
  return (
    <svg {...base(size)} {...rest}>
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  );
}

export function Plate({ size = 16, ...rest }: IconProps) {
  return (
    <svg {...base(size)} {...rest}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
    </svg>
  );
}

export function Football({ size = 16, ...rest }: IconProps) {
  return (
    <svg {...base(size)} {...rest}>
      <ellipse cx="12" cy="12" rx="9" ry="5" transform="rotate(-30 12 12)" />
      <path d="m9 12 6 0M11 10v4M13 10v4" />
    </svg>
  );
}

export function Basketball({ size = 16, ...rest }: IconProps) {
  return (
    <svg {...base(size)} {...rest}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3v18M5 5l14 14M19 5 5 19" />
    </svg>
  );
}

export function Baseball({ size = 16, ...rest }: IconProps) {
  return (
    <svg {...base(size)} {...rest}>
      <circle cx="12" cy="12" r="9" />
      <path d="M5 7c2 1.5 3 3.5 3 5.5S7 16.5 5 17M19 7c-2 1.5-3 3.5-3 5.5s1 4 3 4.5" />
    </svg>
  );
}

export function Hockey({ size = 16, ...rest }: IconProps) {
  return (
    <svg {...base(size)} {...rest}>
      <ellipse cx="12" cy="14" rx="9" ry="3" />
      <path d="M3 14v-2a9 3 0 0 1 18 0v2" />
    </svg>
  );
}

export function Soccer({ size = 16, ...rest }: IconProps) {
  return (
    <svg {...base(size)} {...rest}>
      <circle cx="12" cy="12" r="9" />
      <path d="m12 7 4 3-1.5 5h-5L8 10l4-3Z" />
    </svg>
  );
}

export function Glove({ size = 16, ...rest }: IconProps) {
  return (
    <svg {...base(size)} {...rest}>
      <path d="M9 21V8a2 2 0 1 1 4 0v5l3-2a2 2 0 0 1 3 2v3a5 5 0 0 1-5 5H9Z" />
    </svg>
  );
}

export function Cage({ size = 16, ...rest }: IconProps) {
  return (
    <svg {...base(size)} {...rest}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M7 5l10 14M17 5 7 19" />
    </svg>
  );
}

export function Flag({ size = 16, ...rest }: IconProps) {
  return (
    <svg {...base(size)} {...rest}>
      <path d="M5 21V4M5 4h11l-2 4 2 4H5" />
    </svg>
  );
}

export function Receipt({ size = 16, ...rest }: IconProps) {
  return (
    <svg {...base(size)} {...rest}>
      <path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z" />
      <path d="M9 8h6M9 12h6M9 16h4" />
    </svg>
  );
}
