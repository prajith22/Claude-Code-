"use client";

import { useEffect, useState } from "react";
import { TICKETS_BRAND } from "@/data/tickets";

/**
 * Full-screen waiting-room overlay. Mirrors the queue-page UX that
 * makes you feel like the entire internet is fighting you for the
 * same seat. Progress bar fills erratically — stalls, then leaps —
 * over 3-5 seconds, then onComplete fires.
 */
export function WaitingRoom({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0);
  const [queue, setQueue] = useState(() =>
    Math.floor(3000 + Math.random() * 22000),
  );

  useEffect(() => {
    const totalMs = 3000 + Math.random() * 2000;
    const startTime = Date.now();
    const initialQueue = queue;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const baseProgress = Math.min(100, (elapsed / totalMs) * 100);

      // Jitter — sometimes stall behind, sometimes leap ahead.
      const r = Math.random();
      let actual: number;
      if (r < 0.3) actual = baseProgress * 0.7;
      else if (r < 0.55) actual = baseProgress;
      else actual = Math.min(100, baseProgress + Math.random() * 8);

      setProgress(actual);
      setQueue(
        Math.max(1, Math.floor(initialQueue * (1 - elapsed / totalMs))),
      );

      if (elapsed >= totalMs) {
        clearInterval(interval);
        setProgress(100);
        setQueue(0);
        setTimeout(onComplete, 250);
      }
    }, 120);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const minutesLeft = Math.max(1, Math.ceil((100 - progress) / 25));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ backgroundColor: TICKETS_BRAND.cream }}
    >
      <div className="w-full max-w-sm text-center">
        <div className="mb-4 text-6xl" aria-hidden>
          ⏳
        </div>
        <h2
          className="text-[26px] font-extrabold tracking-tight"
          style={{ color: TICKETS_BRAND.ink }}
        >
          You&rsquo;re in the queue.
        </h2>
        <p
          className="mt-2 text-[14px]"
          style={{ color: TICKETS_BRAND.inkSoft }}
        >
          Don&rsquo;t refresh or you&rsquo;ll lose your spot.
        </p>

        <div
          className="mt-6 rounded-2xl bg-white p-6"
          style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}
        >
          <div
            className="text-[11px] uppercase tracking-wider"
            style={{ color: TICKETS_BRAND.inkSoft }}
          >
            You are number
          </div>
          <div
            className="mt-1 text-[44px] font-extrabold tabular-nums leading-none"
            style={{ color: TICKETS_BRAND.emerald }}
          >
            {queue.toLocaleString()}
          </div>
          <div
            className="text-[12px]"
            style={{ color: TICKETS_BRAND.inkSoft }}
          >
            in line
          </div>

          <div
            className="mt-5 h-2.5 w-full overflow-hidden rounded-full"
            style={{ backgroundColor: TICKETS_BRAND.cream }}
          >
            <div
              className="h-full transition-all duration-150 ease-out"
              style={{
                width: `${progress}%`,
                backgroundColor: TICKETS_BRAND.emerald,
              }}
            />
          </div>
        </div>

        <p
          className="mt-3 text-[11px]"
          style={{ color: TICKETS_BRAND.inkSoft }}
        >
          Estimated wait: {minutesLeft} minute{minutesLeft === 1 ? "" : "s"}
        </p>
      </div>
    </div>
  );
}
