"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

type FitTextProps = {
  children: React.ReactNode;
  /** Target/maximum font size in px. The component scales down from this. */
  maxFontSizePx: number;
  /** Minimum allowed font size in px. */
  minFontSizePx: number;
  /** Class on the outer container (controls width — must be definite). */
  className?: string;
  /** Class on the inner span (font family, weight, color, gradient). */
  innerClassName?: string;
  /** Optional inline style for the inner span (e.g. gradient text). */
  innerStyle?: React.CSSProperties;
};

export type FitTextHandle = { fit: () => void };

/**
 * Renders children at a font size that auto-scales to fit the
 * container's width — so a money amount keeps a stable container
 * footprint as its digit count grows during a count-up. Outer span
 * has a definite width + overflow:hidden; the inner span carries the
 * font styles and is measured (width only; height follows the size).
 *
 * Exposes an imperative `fit()` so callers that bypass React's
 * render loop (per-frame textContent writes) can request a
 * re-measure each frame. A dependency-free useLayoutEffect also
 * re-fits after every render (covers state-driven count-ups), and a
 * ResizeObserver covers container resizes / rotation.
 */
export const FitText = forwardRef<FitTextHandle, FitTextProps>(
  function FitText(
    {
      children,
      maxFontSizePx,
      minFontSizePx,
      className,
      innerClassName,
      innerStyle,
    },
    ref,
  ) {
    const containerRef = useRef<HTMLSpanElement>(null);
    const innerRef = useRef<HTMLSpanElement>(null);
    const [fontSize, setFontSize] = useState(maxFontSizePx);

    const fit = useCallback(() => {
      const container = containerRef.current;
      const inner = innerRef.current;
      if (!container || !inner) return;

      const containerWidth = container.clientWidth;
      if (containerWidth === 0) return;

      // Measure at max, then scale down proportionally if needed.
      inner.style.fontSize = `${maxFontSizePx}px`;
      const measured = inner.scrollWidth;

      if (measured <= containerWidth) {
        setFontSize(maxFontSizePx);
        return;
      }

      const scaled = Math.max(
        minFontSizePx,
        Math.floor((containerWidth / measured) * maxFontSizePx * 0.98),
      );
      setFontSize(scaled);
    }, [maxFontSizePx, minFontSizePx]);

    useImperativeHandle(ref, () => ({ fit }), [fit]);

    // No dep array: re-fit after every render (covers state-driven
    // count-ups that re-render per frame). Converges because
    // setFontSize bails when the value is unchanged.
    useLayoutEffect(() => {
      fit();
    });

    useEffect(() => {
      const container = containerRef.current;
      if (!container) return;
      const ro = new ResizeObserver(() => fit());
      ro.observe(container);
      return () => ro.disconnect();
    }, [fit]);

    return (
      <span
        ref={containerRef}
        className={className}
        style={{ display: "block", overflow: "hidden" }}
      >
        <span
          ref={innerRef}
          className={innerClassName}
          style={{
            display: "inline-block",
            whiteSpace: "nowrap",
            fontSize: `${fontSize}px`,
            lineHeight: 1,
            ...innerStyle,
          }}
        >
          {children}
        </span>
      </span>
    );
  },
);
