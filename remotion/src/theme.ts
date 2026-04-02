// VitaView Design System — Dark Mode Palette for Remotion

export const c = {
  // Backgrounds
  bg: '#0F1115',
  bgCard: '#171A20',
  bgSurface: '#1D2129',
  bgElevated: '#242A34',
  bgSubtle: '#2A3039',

  // Text
  textStrong: '#EEF2F8',
  textDefault: '#D8DDE8',
  textMuted: '#AAB3C3',
  textSubtle: '#8D97A9',

  // Strokes
  strokeSoft: '#262C35',
  strokeDefault: '#353D49',
  strokeStrong: '#4A5564',

  // Accent
  primary: '#F2F4F8',
  primaryMuted: '#B3BCCB',

  // Semantic
  green: '#22c55e',
  greenMuted: 'rgba(34,197,94,0.15)',
  red: '#ef4444',
  redMuted: 'rgba(239,68,68,0.12)',
  amber: '#f59e0b',
  amberMuted: 'rgba(245,158,11,0.12)',
  blue: '#60a5fa',
  blueMuted: 'rgba(96,165,250,0.12)',
};

// Landscape
export const COMP_WIDTH = 1920;
export const COMP_HEIGHT = 1080;

// Vertical (Reels/Stories)
export const VERT_WIDTH = 1080;
export const VERT_HEIGHT = 1920;

export const FPS = 30;

// Smooth spring presets
export const S = {
  smooth: { damping: 200 },
  gentle: { damping: 26, stiffness: 120, mass: 1.2 },
  snappy: { damping: 22, stiffness: 180 },
};

// Shared bezier for natural decel
export const EASE_OUT = [0.22, 1, 0.36, 1] as const;
