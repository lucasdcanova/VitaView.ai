// Shared layout constants for vertical vs landscape

export const getLayout = (width: number, height: number) => {
  const v = height > width;
  return {
    v,
    // Max content width
    maxW: v ? 520 : 880,
    // Outer padding
    pad: v ? '80px 50px' : '60px 40px',
    // Gap between sections
    gap: v ? 28 : 22,
    // Title font size
    titleSize: v ? 34 : 38,
    // Subtitle font size
    subSize: v ? 16 : 17,
    // Card padding
    cardPad: v ? '20px 22px' : '20px 22px',
    // Small text
    smallText: v ? 13 : 14,
    // Label size
    labelSize: v ? 13 : 12,
  };
};
