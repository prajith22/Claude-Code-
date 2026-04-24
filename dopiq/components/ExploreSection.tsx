"use client";

import type { Product } from "@/types";
import { ExploreCard } from "@/components/ExploreCard";

export function ExploreSection({
  previous,
  current,
  next,
  canGoPrev,
  canGoNext,
  onPrev,
  onNext,
}: {
  previous: Product | undefined;
  current: Product | undefined;
  next: Product | undefined;
  canGoPrev: boolean;
  canGoNext: boolean;
  onPrev: () => void;
  onNext: () => void;
}) {
  if (!current) return null;

  return (
    <section>
      <div className="mb-4">
        <h2 className="text-[20px] font-bold tracking-tight">✨ Explore</h2>
        <p className="text-[13px] text-ink-muted">Discover something new</p>
      </div>

      {/* Clip horizontal overflow so peek cards never cause page-level scroll */}
      <div className="overflow-x-clip">
        <div className="relative mx-auto w-full max-w-[600px]">
          {/* Previous card — peeks 50px on the left */}
          {previous && (
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 z-10 opacity-50"
              style={{
                transform: "translateX(calc(-100% + 50px)) scale(0.92)",
                transformOrigin: "right center",
              }}
            >
              <ExploreCard product={previous} />
            </div>
          )}

          {/* Current card — in flow so it sets the container's height */}
          <div className="relative z-20 rounded-card shadow-2xl">
            <ExploreCard product={current} />
          </div>

          {/* Next card — peeks 50px on the right */}
          {next && (
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 z-10 opacity-50"
              style={{
                transform: "translateX(calc(100% - 50px)) scale(0.92)",
                transformOrigin: "left center",
              }}
            >
              <ExploreCard product={next} />
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-center gap-4">
        <ArrowButton direction="prev" onClick={onPrev} disabled={!canGoPrev} />
        <ArrowButton direction="next" onClick={onNext} disabled={!canGoNext} />
      </div>
    </section>
  );
}

function ArrowButton({
  direction,
  onClick,
  disabled,
}: {
  direction: "prev" | "next";
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={direction === "prev" ? "Previous product" : "Next product"}
      onClick={onClick}
      disabled={disabled}
      className="flex h-12 w-12 items-center justify-center rounded-full bg-navy text-white shadow-navy transition-all duration-150 hover:bg-navy-light active:scale-95 disabled:pointer-events-none disabled:opacity-30"
    >
      <svg
        viewBox="0 0 24 24"
        width="20"
        height="20"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        {direction === "prev" ? (
          <polyline points="15 18 9 12 15 6" />
        ) : (
          <polyline points="9 18 15 12 9 6" />
        )}
      </svg>
    </button>
  );
}
