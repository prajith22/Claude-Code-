"use client";

import { useState } from "react";

export function FoodPromoBanner() {
  const [visible, setVisible] = useState(true);
  if (!visible) return null;

  return (
    <div className="flex items-center gap-3 rounded-card bg-brand px-4 py-3 shadow-sm">
      <p className="flex-1 text-[14px] font-semibold leading-snug text-white">
        Free delivery on all orders today — simulated orders only.
      </p>
      <button
        type="button"
        onClick={() => setVisible(false)}
        aria-label="Dismiss promo"
        className="flex h-7 w-7 flex-none items-center justify-center rounded-full text-white transition hover:bg-white/15 active:scale-95"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden
        >
          <path
            d="M4 4l8 8M12 4l-8 8"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </div>
  );
}
