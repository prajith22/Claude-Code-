import type { TargetAndTransition, Transition } from "framer-motion";

// Shared hover effect for interactive cards across Shop and Food pages.
// Matches the home simulator card language: lift + green outline + deeper shadow.
export const cardHover: TargetAndTransition = {
  y: -4,
  boxShadow:
    "inset 0 0 0 1.5px #00C853, 0 12px 28px rgba(0, 0, 0, 0.12)",
  transition: { duration: 0.15, ease: "easeOut" },
};

export const cardHoverTransition: Transition = { duration: 0.15, ease: "easeOut" };
