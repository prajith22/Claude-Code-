"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function SimCard({
  href,
  label,
  desc,
  bg,
  title,
  sub,
  icon,
  delay,
}: {
  href: string;
  label: string;
  desc: string;
  bg: string;
  title: string;
  sub: string;
  icon: React.ReactNode;
  delay: number; // seconds
}) {
  const [entered, setEntered] = useState(false);

  return (
    <motion.div
      className={cn("relative min-h-[160px] rounded-card", bg)}
      initial={{ opacity: 0, y: 24 }}
      animate={
        entered
          ? { opacity: 1, y: 0, scale: [1, 1.02, 1] }
          : { opacity: 1, y: 0 }
      }
      transition={
        entered
          ? {
              scale: {
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              },
            }
          : { duration: 0.5, delay, ease: "easeOut" }
      }
      onAnimationComplete={() => {
        if (!entered) setEntered(true);
      }}
      whileHover={{
        scale: 1.04,
        boxShadow:
          "0 0 0 2px rgba(0, 200, 83, 0.45), 0 12px 28px rgba(0, 200, 83, 0.18)",
        transition: { duration: 0.2 },
      }}
      whileTap={{ scale: 0.97, transition: { duration: 0.08 } }}
    >
      <Link
        href={href}
        className="flex h-full min-h-[160px] flex-col justify-between p-4 md:p-5"
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy text-white">
          {icon}
        </span>
        <div>
          <p
            className={cn(
              "text-[20px] font-bold leading-tight md:text-[22px]",
              title,
            )}
          >
            {label}
          </p>
          <p className={cn("mt-1 text-[12px] leading-snug md:text-[13px]", sub)}>
            {desc}
          </p>
        </div>
      </Link>
    </motion.div>
  );
}
