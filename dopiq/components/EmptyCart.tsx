"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";

type EmptyCartProps = {
  mascotSrc: string;
  heading: string;
  subhead: string;
  ctaHref: string;
  ctaLabel: string;
};

export function EmptyCart({
  mascotSrc,
  heading,
  subhead,
  ctaHref,
  ctaLabel,
}: EmptyCartProps) {
  const reduce = useReducedMotion();
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
      <motion.div
        initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
        animate={reduce ? { opacity: 1 } : { opacity: 1, scale: 1 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="mx-auto mb-1"
      >
        <motion.div
          animate={reduce ? undefined : { scale: [1, 1.03, 1] }}
          transition={
            reduce
              ? undefined
              : { duration: 3, repeat: Infinity, ease: "easeInOut" }
          }
        >
          <Image
            src={mascotSrc}
            alt="Dopiq mascot"
            width={160}
            height={160}
            className="h-[140px] w-[140px] md:h-[160px] md:w-[160px]"
          />
        </motion.div>
      </motion.div>
      <p className="text-[17px] font-bold">{heading}</p>
      <p className="text-sm text-ink-muted">{subhead}</p>
      <Link href={ctaHref} className="btn-primary mt-2">
        {ctaLabel}
      </Link>
    </div>
  );
}
