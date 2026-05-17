"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";

type LandingMascotProps = {
  src: string;
  alt?: string;
  className?: string; // size + position overrides
};

export function LandingMascot({
  src,
  alt = "Dopiq mascot",
  className = "h-[80px] w-[80px] md:h-[100px] md:w-[100px]",
}: LandingMascotProps) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
      animate={reduce ? { opacity: 1 } : { opacity: 1, scale: 1 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className="shrink-0"
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
          src={src}
          alt={alt}
          width={100}
          height={100}
          className={className}
        />
      </motion.div>
    </motion.div>
  );
}
