import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";
import { fadeInAnimate, fadeInInitial, fadeInTransition } from "./motionConfig";

interface FadeInProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export default function FadeIn({
  children,
  className,
  delay = 0,
}: FadeInProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={
        reduceMotion
          ? { opacity: 1 }
          : fadeInInitial
      }
      animate={fadeInAnimate}
      transition={{
        ...fadeInTransition,
        delay,
      }}
    >
      {children}
    </motion.div>
  );
}
