"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

/**
 * Subtle dotted texture overlay — the same pattern the Quick Sim
 * card and home-grid SimCards have always used, extracted to a
 * shared component so every pastel surface in the app can wear it
 * consistently.
 *
 * Usage: drop inside any `relative overflow-hidden` parent. The
 * dot color comes from `currentColor` — set it on the parent (or
 * on this component via Tailwind text-color classes) so each card
 * tints its dots to a darker tone of its own background. Stays
 * `pointer-events-none` so taps pass straight through to the
 * underlying link / button.
 *
 * Default opacity matches the existing Quick Sim / SimCard
 * intensity (~7%) — overridable through className for the rare
 * surface that needs a different read.
 */
export function DotTexture({
  className,
  style,
}: {
  className?: string;
  /** Inline color override — handy when the dot color is
   *  computed at render time (e.g. the wheel result card tints
   *  its speckle to match the winning wedge). Most surfaces
   *  should set color via Tailwind text-* in className instead. */
  style?: React.CSSProperties;
}) {
  const patternId = `dot-pattern-${useId()}`;
  return (
    <svg
      className={cn(
        "pointer-events-none absolute inset-0 h-full w-full opacity-[0.07]",
        className,
      )}
      style={style}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <defs>
        <pattern
          id={patternId}
          x="0"
          y="0"
          width="14"
          height="14"
          patternUnits="userSpaceOnUse"
        >
          <circle cx="2" cy="2" r="1.4" fill="currentColor" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${patternId})`} />
    </svg>
  );
}
