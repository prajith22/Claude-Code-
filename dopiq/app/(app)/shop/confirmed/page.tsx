"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import { playDing } from "@/lib/sounds";
import { AnimatedAmount } from "@/components/AnimatedAmount";

type LastOrder = { orderNumber: string; total: number; count: number };

export default function ShopConfirmedPage() {
  const [order, setOrder] = useState<LastOrder | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("dopiq-last-shop-order");
    if (raw) {
      try {
        setOrder(JSON.parse(raw));
      } catch {}
    }

    playDing();

    const duration = 1600;
    const end = Date.now() + duration;
    const colors = ["#00A650", "#1A1A1A", "#ffffff"];
    const frame = () => {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 70,
        origin: { x: 0, y: 0.7 },
        colors,
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 70,
        origin: { x: 1, y: 0.7 },
        colors,
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }, []);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center pb-10 text-center">
      <motion.div
        initial={{ scale: 0.4, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 180, damping: 14 }}
        className="flex h-20 w-20 items-center justify-center rounded-full bg-brand text-white shadow-lg"
      >
        <motion.svg
          viewBox="0 0 24 24"
          className="h-10 w-10"
          aria-hidden="true"
        >
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

      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.4 }}
        className="mt-6 text-[28px] font-semibold tracking-tight"
      >
        Order confirmed
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.4 }}
        className="mt-2 max-w-xs text-[15px] text-ink-muted"
      >
        You got the hit. No real money was charged.
      </motion.p>

      {order && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.4 }}
          className="surface-shop mt-8 w-full max-w-sm p-5 text-left"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wide text-ink-muted">
              Order
            </span>
            <span className="text-sm font-semibold">{order.orderNumber}</span>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-ink-muted">Items</span>
            <span className="font-medium">{order.count}</span>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-ink-muted">Total</span>
            <AnimatedAmount amount={order.total} className="font-semibold" />
          </div>
          <div className="mt-4 rounded-xl bg-brand-light px-3 py-2 text-center text-xs font-medium text-brand">
            Simulated order · no charge
          </div>
        </motion.div>
      )}

      <div className="mt-8 flex w-full max-w-sm flex-col gap-2">
        <Link href="/shop" className="btn-primary w-full">
          Keep shopping
        </Link>
        <Link href="/home" className="btn-secondary w-full">
          Back to home
        </Link>
      </div>
    </div>
  );
}
