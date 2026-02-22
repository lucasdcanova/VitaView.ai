export const landingEase = [0.22, 1, 0.36, 1] as const;

export const landingTransition = {
  fast: { duration: 0.22, ease: landingEase },
  base: { duration: 0.42, ease: landingEase },
  slow: { duration: 0.58, ease: landingEase },
};

export const landingSpring = {
  type: "spring" as const,
  stiffness: 260,
  damping: 24,
  mass: 0.85,
};

export const landingViewport = {
  once: true,
  amount: 0.24,
} as const;

export const landingMicro = {
  hoverLift: { y: -2.5, scale: 1.008 },
  hoverLiftStrong: { y: -4, scale: 1.012 },
  tapPress: { scale: 0.97 },
};
