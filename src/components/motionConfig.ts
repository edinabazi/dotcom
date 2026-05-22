export const fadeInInitial = {
	opacity: 0,
	transform: "translate3d(0, 8px, 0)",
	filter: "blur(4px)",
};

export const fadeInAnimate = {
	opacity: 1,
	transform: "translate3d(0, 0, 0)",
	filter: "blur(0px)",
};

export const fadeInTransition = {
	duration: 1.5,
	ease: [0.23, 1, 0.32, 1] as const,
};
