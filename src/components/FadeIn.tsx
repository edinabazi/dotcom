import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

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
          : {
              opacity: 0,
              transform: "translate3d(0, 8px, 0)",
              filter: "blur(4px)",
            }
      }
      animate={{
        opacity: 1,
        transform: "translate3d(0, 0, 0)",
        filter: "blur(0px)",
      }}
      transition={{
        duration: 1.5,
        delay,
        ease: [0.23, 1, 0.32, 1],
      }}
    >
      {children}
    </motion.div>
  );
}
