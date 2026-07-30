import { motion, useAnimationControls, useReducedMotion } from "motion/react";
import { trackEvent } from "../lib/analytics";
import { fadeInAnimate, fadeInInitial, fadeInTransition } from "./motionConfig";

interface ProjectCardProps {
  title: string;
  description: string;
  href: string;
  iconSrc: string;
  coverSrc: string;
  coverAlt: string;
  projectType: "studio" | "open_source";
  delay?: number;
}

export default function ProjectCard({
  title,
  description,
  href,
  iconSrc,
  coverSrc,
  coverAlt,
  projectType,
  delay = 0,
}: ProjectCardProps) {
  const arrowControls = useAnimationControls();
  const reduceMotion = useReducedMotion();
  const initialState = reduceMotion
    ? { opacity: 1 }
    : {
        ...fadeInInitial,
        filter: "blur(4px) brightness(var(--project-card-brightness, 1))",
      };
  const animateState = {
    ...fadeInAnimate,
    filter: "blur(0px) brightness(var(--project-card-brightness, 1))",
  };

  async function animateArrow() {
    if (
      reduceMotion ||
      !window.matchMedia("(hover: hover) and (pointer: fine)").matches
    ) {
      return;
    }

    arrowControls.stop();
    arrowControls.set({ x: 0, y: 0, opacity: 0.7 });
    await arrowControls.start({
      x: 9,
      y: -9,
      opacity: 0,
      transition: {
        duration: 0.18,
        ease: [0.4, 0, 1, 1],
      },
    });
    arrowControls.set({ x: -9, y: 9, opacity: 0 });
    await arrowControls.start({
      x: 0,
      y: 0,
      opacity: 0.7,
      transition: {
        duration: 0.34,
        ease: [0.16, 1, 0.3, 1],
      },
    });
  }

  function trackProjectClick() {
    trackEvent("project_clicked", {
      project_name: title,
      project_type: projectType,
      url: href,
    });
  }

  return (
    <motion.a
      href={href}
      target="_blank"
      aria-label={`Visit ${title}`}
      onClick={trackProjectClick}
      onMouseEnter={animateArrow}
      initial={initialState}
      animate={animateState}
      transition={{
        ...fadeInTransition,
        delay,
      }}
      className="project-card group block rounded-3xl border border-border bg-surface p-6 sm:p-8 text-white outline-none ring-white/20 focus-visible:ring-2 transition-all duration-300 [@media(prefers-color-scheme:light)_and_(hover:hover)_and_(pointer:fine)]:hover:border-[#b0b0b0]"
    >
      <article className="flex flex-col gap-6 sm:gap-8">
        <div className="flex items-start gap-4 sm:items-center">
          <img
            src={iconSrc}
            alt=""
            loading="lazy"
            className="size-16 shrink-0 rounded-xl"
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
                className="relative mt-1 grid size-8 shrink-0 place-items-center rounded-full border border-white/10 text-white/70 transition-[border-color,color] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:text-white [@media(prefers-color-scheme:light)_and_(hover:hover)_and_(pointer:fine)]:group-hover:border-[#b0b0b0]"
              >
                <motion.svg
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  animate={arrowControls}
                  initial={{ x: 0, y: 0, opacity: 0.7 }}
                  className="size-4"
                >
                  <path
                    d="M4.75 11.25 11.25 4.75M6 4.75h5.25V10"
                    stroke="currentColor"
                    strokeWidth="1.25"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </motion.svg>
              </span>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl">
          <img
            src={coverSrc}
            alt={coverAlt}
            loading="lazy"
            className="w-full object-cover"
          />
        </div>
      </article>
    </motion.a>
  );
}
