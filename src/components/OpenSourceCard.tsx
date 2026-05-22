import { motion, useReducedMotion, useSpring } from "motion/react";

interface OpenSourceCardProps {
  title: string;
  description: string;
  href: string;
  iconSrc: string;
  coverSrc: string;
  coverAlt: string;
}

export default function OpenSourceCard({
  title,
  description,
  href,
  iconSrc,
  coverSrc,
  coverAlt,
}: OpenSourceCardProps) {
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
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={`Visit ${title}`}
      onMouseEnter={animateArrow}
      onFocus={animateArrow}
      className="squircle group block rounded-card border border-border bg-surface hover:brightness-120 p-8 text-white outline-none ring-white/20 focus-visible:ring-2 transition-all duration-300"
    >
      <article className="flex flex-col gap-8">
        <div className="flex items-start gap-4 sm:items-center">
          <img
            src={iconSrc}
            alt=""
            className="squircle size-16 shrink-0 rounded-avatar"
          />

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-5">
              <div>
                <h3 className="text-2xl tracking-[-0.04em] text-white">
                  {title}
                </h3>
                <p className="text-base leading-tight tracking-[-0.04em] text-muted">
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

        <div className="squircle overflow-hidden rounded-cover">
          <img
            src={coverSrc}
            alt={coverAlt}
            className="aspect-[1257/600] w-full object-cover"
          />
        </div>
      </article>
    </a>
  );
}
