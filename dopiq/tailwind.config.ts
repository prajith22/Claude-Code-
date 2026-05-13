import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#00C853",
          dark: "#00a844",
          light: "#e6f9ee",
          vivid: "#00E676",
        },
        navy: {
          DEFAULT: "#0A0F1E",
          light: "#151C33",
          muted: "#1E2740",
        },
        ink: {
          DEFAULT: "#0A0F1E",
          muted: "#6B7280",
          faint: "#9CA3AF",
        },
        surface: {
          DEFAULT: "#FFFFFF",
          alt: "#F7F8FA",
          border: "#E5E7EB",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        heading: ["var(--font-sora)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
        display: ["var(--font-display)", "Georgia", "serif"],
      },
      borderRadius: {
        card: "16px",
        pill: "9999px",
      },
      boxShadow: {
        card: "0 2px 12px rgba(0,0,0,0.08)",
        cardHover: "0 8px 24px rgba(0,0,0,0.12)",
        navy: "0 2px 12px rgba(10,15,30,0.25)",
        navyHover: "0 8px 32px rgba(10,15,30,0.35)",
      },
      fontSize: {
        "2xs": ["11px", "16px"],
      },
    },
  },
  plugins: [],
};

export default config;
