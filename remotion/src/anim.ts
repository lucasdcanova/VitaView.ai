import { interpolate, spring, Easing } from 'remotion';
import { S, EASE_OUT } from './theme';

type SpringCfg = { damping?: number; stiffness?: number; mass?: number };

/** Fade + translateY reveal. Returns { opacity, transform }. */
export const reveal = (
  frame: number,
  fps: number,
  delay: number,
  opts?: { y?: number; config?: SpringCfg },
) => {
  const y = opts?.y ?? 18;
  const config = opts?.config ?? S.smooth;
  const s = spring({ frame, fps, delay, config });
  const opacity = interpolate(frame, [delay, delay + 0.35 * fps], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return {
    opacity,
    transform: `translateY(${interpolate(s, [0, 1], [y, 0])}px)`,
  };
};

/** Per-word stagger reveal for a string. Returns array of { word, style }. */
export const wordReveal = (
  text: string,
  frame: number,
  fps: number,
  startDelay: number,
  wordGap = 0.06,
) => {
  const words = text.split(' ');
  return words.map((word, i) => {
    const d = startDelay + i * wordGap * fps;
    const s = spring({ frame, fps, delay: d, config: S.smooth });
    const o = interpolate(frame, [d, d + 0.25 * fps], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
    return {
      word,
      style: {
        display: 'inline-block' as const,
        opacity: o,
        transform: `translateY(${interpolate(s, [0, 1], [10, 0])}px)`,
        marginRight: 8,
      },
    };
  });
};

/** Smooth scale entrance. Returns number 0→1. */
export const scaleIn = (
  frame: number,
  fps: number,
  delay: number,
  config?: SpringCfg,
) => {
  return spring({ frame, fps, delay, config: config ?? S.gentle });
};
