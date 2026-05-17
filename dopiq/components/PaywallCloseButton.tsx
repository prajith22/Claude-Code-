"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { X } from "@/components/icons";

// Dismiss affordance for the web paywall. Single tap → /home, no
// confirmation (a user tapping X is decisively leaving). Prevents a
// dead-end and satisfies App Store guideline 3.1.2's requirement
// that subscription screens be dismissible. Scale micro-interaction
// is dropped under prefers-reduced-motion; the hover tint is a
// discrete state change so it stays.
export function PaywallCloseButton() {
  const router = useRouter();
  const reduce = useReducedMotion();
  const [hover, setHover] = useState(false);

  return (
    <motion.button
      type="button"
      onClick={() => router.push("/home")}
      aria-label="Close"
      onHoverStart={() => setHover(true)}
      onHoverEnd={() => setHover(false)}
      whileHover={reduce ? undefined : { scale: 1.05 }}
      whileTap={reduce ? undefined : { scale: 0.95 }}
      className="absolute z-50 flex h-9 w-9 items-center justify-center rounded-full"
      style={{
        top: "calc(env(safe-area-inset-top) + 12px)",
        right: "1rem",
        background: hover
          ? "#F5EFE0"
          : "linear-gradient(180deg, #FDFAF3 0%, #F9F4E8 100%)",
        border: "1.5px solid #E5E0D5",
        boxShadow:
          "0 1px 2px rgba(42, 31, 24, 0.04), 0 1px 3px rgba(42, 31, 24, 0.08)",
      }}
    >
      <X size={18} strokeWidth={2.5} stroke="#0A0F1E" />
    </motion.button>
  );
}
