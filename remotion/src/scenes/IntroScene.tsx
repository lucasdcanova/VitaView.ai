import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
  Img,
  staticFile,
} from 'remotion';
import { colors } from '../theme';
import { montserrat, openSans } from '../fonts';

export const IntroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Logo animation
  const logoScale = spring({ frame, fps, config: { damping: 12, stiffness: 120 } });
  const logoOpacity = interpolate(frame, [0, 0.4 * fps], [0, 1], {
    extrapolateRight: 'clamp',
  });

  // Title animation
  const titleSpring = spring({ frame, fps, delay: 0.5 * fps, config: { damping: 200 } });
  const titleY = interpolate(titleSpring, [0, 1], [40, 0]);
  const titleOpacity = interpolate(frame, [0.5 * fps, 0.9 * fps], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Subtitle
  const subtitleSpring = spring({ frame, fps, delay: 0.9 * fps, config: { damping: 200 } });
  const subtitleY = interpolate(subtitleSpring, [0, 1], [30, 0]);
  const subtitleOpacity = interpolate(frame, [0.9 * fps, 1.3 * fps], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Decorative line
  const lineWidth = interpolate(frame, [1.1 * fps, 1.7 * fps], [0, 240], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.quad),
  });

  // Badge
  const badgeScale = spring({ frame, fps, delay: 1.5 * fps, config: { damping: 15, stiffness: 180 } });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.pureWhite,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      {/* Background gradient */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(1200px circle at 8% -10%, rgba(33, 33, 33, 0.04), transparent 45%), radial-gradient(900px circle at 100% 0%, rgba(66, 66, 66, 0.05), transparent 42%)`,
        }}
      />

      {/* Real PNG logo */}
      <Img
        src={staticFile('logo-full.png')}
        style={{
          height: 140,
          objectFit: 'contain',
          transform: `scale(${interpolate(logoScale, [0, 1], [0.7, 1])})`,
          opacity: logoOpacity,
        }}
      />

      {/* Decorative line */}
      <div
        style={{
          width: lineWidth,
          height: 3,
          backgroundColor: colors.charcoal,
          borderRadius: 2,
          marginTop: 28,
        }}
      />

      {/* Subtitle */}
      <div
        style={{
          marginTop: 24,
          opacity: subtitleOpacity,
          transform: `translateY(${subtitleY}px)`,
          textAlign: 'center',
        }}
      >
        <p
          style={{
            fontFamily: openSans,
            fontSize: 30,
            color: colors.contentMuted,
            margin: 0,
            fontWeight: 500,
          }}
        >
          Prontuario Medico Inteligente
        </p>
      </div>

      {/* Badge */}
      <div
        style={{
          marginTop: 36,
          transform: `scale(${interpolate(badgeScale, [0, 1], [0.85, 1])})`,
          opacity: interpolate(frame, [1.5 * fps, 1.7 * fps], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          }),
          backgroundColor: colors.charcoal,
          borderRadius: 50,
          padding: '14px 36px',
        }}
      >
        <span
          style={{
            fontFamily: montserrat,
            fontSize: 16,
            fontWeight: 700,
            color: colors.pureWhite,
            letterSpacing: 3,
            textTransform: 'uppercase',
          }}
        >
          Interacoes de UI
        </span>
      </div>
    </AbsoluteFill>
  );
};
