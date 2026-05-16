"use client";
import { useEffect } from "react";

// Adds `mode-night` to <body> after 21:00 local. Pure client-side
// effect (no SSR output, no hydration mismatch — renders null and
// only mutates the class in useEffect). Re-checks on mount; that's
// sufficient for a session.
export function NightModeClass() {
  useEffect(() => {
    const night = new Date().getHours() >= 21;
    if (night) document.body.classList.add("mode-night");
    return () => document.body.classList.remove("mode-night");
  }, []);
  return null;
}
