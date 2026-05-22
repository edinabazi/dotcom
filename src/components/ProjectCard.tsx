import { motion, useReducedMotion, useSpring } from "motion/react";

interface ProjectCardProps {
  title: string;
  description: string;
  href: string;
  iconSrc: string;
  coverSrc: string;
  coverAlt: string;
  delay?: number;
}

export default function ProjectCard({
  title,
  description,
  href,
  iconSrc,
  coverSrc,
  coverAlt,
  delay = 0,
}: ProjectCardProps) {
  const arrowX = useSpring(0, { stiffness: 300, damping: 45, mass: 0.7 });
  const arrowY = useSpring(0, { stiffness: 300, damping: 45, mass: 0.7 });
  const arrowOpacity = useSpring(0.7, {
    stiffness: 620,
    damping: 38,
    mass: 0.6,
  });
  const reduceMotion = useReducedMotion();

  function animateArrow() {
    if (reduceMotion) return;

    arrowX.set(10);
    arrowY.set(-10);
    arrowOpacity.set(0);

    window.setTimeout(() => {
      arrowX.jump(-10);
      arrowY.jump(10);
      arrowOpacity.jump(0);

      window.setTimeout(() => {
        arrowX.set(0);
        arrowY.set(0);
        arrowOpacity.set(0.7);
      }, 24);
    }, 140);
  }

  return (
    <motion.a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={`Visit ${title}`}
      onMouseEnter={animateArrow}
      onFocus={animateArrow}
      initial={
        reduceMotion
          ? { opacity: 1 }
          : { opacity: 0, transform: "translate3d(0, 8px, 0)" }
      }
      animate={{ opacity: 1, transform: "translate3d(0, 0, 0)" }}
      transition={{
        duration: 0.55,
        delay,
        ease: [0.23, 1, 0.32, 1],
      }}
      className="squircle group block rounded-4xl sm:rounded-card border border-border bg-surface hover:brightness-120 p-6 sm:p-8 text-white outline-none ring-white/20 focus-visible:ring-2 transition-all duration-300"
    >
      <article className="flex flex-col gap-6 sm:gap-8">
        <div className="flex items-start gap-4 sm:items-center">
          <img
            src={iconSrc}
            alt=""
            className="squircle size-16 shrink-0 rounded-2xl sm:rounded-avatar"
          />

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-5">
              <div>
                <h3 className="text-xl sm:text-2xl tracking-[-0.04em] text-white">
                  {title}
                </h3>
                <p className="text-sm sm:text-base leading-tight tracking-[-0.04em] text-muted">
                  {description}
                </p>
              </div>

              <span
                aria-hidden="true"
                className="relative mt-1 grid size-8 shrink-0 place-items-center overflow-hidden rounded-full border border-white/10 text-lg leading-none text-white/70 opacity-70"
              >
                <motion.span
                  style={{
                    x: arrowX,
                    y: arrowY,
                    opacity: arrowOpacity,
                  }}
                >
                  ↗
                </motion.span>
              </span>
            </div>
          </div>
        </div>

        <div className="squircle overflow-hidden rounded-3xl sm:rounded-cover">
          <img src={coverSrc} alt={coverAlt} className="w-full object-cover" />
        </div>
      </article>
    </motion.a>
  );
}
