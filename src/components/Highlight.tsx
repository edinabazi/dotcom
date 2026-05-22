import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

interface HighlightProps {
    children: ReactNode;
    delay?: number;
}

export default function Highlight({ children, delay = 0 }: HighlightProps) {
    const reduceMotion = useReducedMotion();

    return (
        <span className="font-thicc highlight">
            {children}
            <motion.span
                aria-hidden="true"
                className="highlight-mark"
                initial={
                    reduceMotion
                        ? { clipPath: "inset(0 0 0 0)" }
                        : { clipPath: "inset(0 100% 0 0)" }
                }
                animate={{ clipPath: "inset(0 0 0 0)" }}
                transition={{
                    duration: 0.72,
                    delay,
                    ease: [0.77, 0, 0.175, 1],
                }}
            />
        </span>
    );
}
