"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import { cn, formatOdds, formatUSD } from "@/lib/utils";
import type { SlipSelection } from "@/lib/bet-slip-store";

type PlacedBet = {
  selections: SlipSelection[];
  stake: number;
  combinedOdds: number;
  potentialReturn: number;
  placedAt: string;
};

export default function BetConfirmedPage() {
  const [placed, setPlaced] = useState<PlacedBet | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const raw = sessionStorage.getItem("dopiq-last-placed-bet");
      if (raw) {
        setPlaced(JSON.parse(raw) as PlacedBet);
      }
    } catch {
      // ignore — placed stays null, we show the fallback
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const colors = ["#00C853", "#00E676", "#e6f9ee", "#ffffff"];
    const duration = 1500;
    const end = Date.now() + duration;
    confetti({
      particleCount: 80,
      spread: 90,
      startVelocity: 45,
      origin: { x: 0.5, y: 0.35 },
      colors,
    });
    const frame = () => {
      confetti({
        particleCount: 6,
        angle: 60,
        spread: 80,
        origin: { x: 0, y: 0.6 },
        colors,
      });
      confetti({
        particleCount: 6,
        angle: 120,
        spread: 80,
        origin: { x: 1, y: 0.6 },
        colors,
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }, [mounted]);

  const isParlay = (placed?.selections.length ?? 0) >= 2;

  return (
    <div className="pb-4 pt-4">
      <div className="card-navy p-8 text-center">
        <motion.div
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 180, damping: 14 }}
          className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-brand text-navy shadow-lg"
        >
          <motion.svg viewBox="0 0 24 24" className="h-10 w-10" aria-hidden>
            <motion.path
              d="M5 12.5 10 17.5 19 7.5"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.6}
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: 0.2, duration: 0.5, ease: "easeOut" }}
            />
          </motion.svg>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.4 }}
          className="mt-6 text-[40px] font-extrabold leading-none tracking-tight text-white md:text-[48px]"
        >
          Bet Placed!
        </motion.h2>

        {placed && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.4 }}
            className="mx-auto mt-6 max-w-md space-y-4 border-t border-white/10 pt-5 text-left"
          >
            <div className="flex items-center justify-between gap-3">
              <span
                className={cn(
                  "rounded-pill px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-widest",
                  isParlay ? "bg-brand text-navy" : "bg-white/10 text-white/80",
                )}
              >
                {isParlay ? `Parlay · ${placed.selections.length} legs` : "Single bet"}
              </span>
              <span className="font-mono text-[22px] font-extrabold text-brand">
                {formatOdds(placed.combinedOdds)}
              </span>
            </div>

            <ul className="space-y-2">
              {placed.selections.map((s) => (
                <li
                  key={s.key}
                  className="flex items-start justify-between gap-3 rounded-xl bg-white/5 px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-bold text-white">
                      {s.label}
                    </p>
                    <p className="mt-0.5 text-[11px] text-white/60">
                      {s.sport} · {s.matchup}
                    </p>
                  </div>
                  <span className="shrink-0 font-mono text-[13px] font-bold text-brand">
                    {formatOdds(s.odds)}
                  </span>
                </li>
              ))}
            </ul>

            <div className="space-y-1 border-t border-white/10 pt-3 text-[13px]">
              <div className="flex justify-between">
                <span className="text-white/60">Stake</span>
                <span className="font-mono font-bold text-white">
                  {formatUSD(placed.stake)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Potential return</span>
                <span className="font-mono font-bold text-brand">
                  {formatUSD(placed.potentialReturn)}
                </span>
              </div>
            </div>
          </motion.div>
        )}

        <p className="mt-5 text-[11px] text-white/40">
          Simulated · No real money at risk
        </p>

        <Link href="/bet" className="btn-primary mt-6 inline-flex w-full">
          Place another bet
        </Link>
      </div>
    </div>
  );
}
