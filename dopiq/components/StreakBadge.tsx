"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function StreakBadge({ streak }: { streak: number }) {
  // Streak of 0 or 1 — don't show anything
  if (streak < 2) return null;

  const isAchievement = streak >= 7;

  return (
    <motion.div
      initial={{ scale: 0.3, opacity: 0, rotate: -12 }}
      animate={{ scale: 1, opacity: 1, rotate: 0 }}
      transition={{
        type: "spring",
        stiffness: 260,
        damping: 14,
        delay: 0.2,
      }}
      className={cn(
        "flex-none inline-flex items-center gap-1.5 rounded-pill",
        isAchievement
          ? "bg-gradient-to-br from-orange-500 to-red-500 px-4 py-2 shadow-[0_0_24px_rgba(249,115,22,0.55)]"
          : "bg-gradient-to-br from-orange-400 to-orange-500 px-3 py-1.5",
      )}
      aria-label={`${streak} day streak`}
    >
      <span
        aria-hidden
        className={cn(
          "leading-none",
          isAchievement ? "text-[20px]" : "text-[15px]",
        )}
      >
        🔥
      </span>
      <span
        className={cn(
          "font-bold text-white leading-none",
          isAchievement ? "text-[14px]" : "text-[12px]",
        )}
      >
        <span className="money">{streak}</span>
        <span className="ml-1 font-semibold">day streak</span>
      </span>
    </motion.div>
  );
}
