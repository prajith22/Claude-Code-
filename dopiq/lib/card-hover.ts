import type { TargetAndTransition, Transition } from "framer-motion";

// Shared hover effect for interactive cards across Shop and Food pages.
// Soft pastel peach outline + a deeper drop shadow on lift.
export const cardHover: TargetAndTransition = {
  y: -4,
  boxShadow:
    "inset 0 0 0 1.5px #F4A98F, 0 12px 28px rgba(0, 0, 0, 0.10)",
  transition: { duration: 0.15, ease: "easeOut" },
};

export const cardHoverTransition: Transition = { duration: 0.15, ease: "easeOut" };
