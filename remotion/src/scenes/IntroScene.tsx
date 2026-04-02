import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
} from 'remotion';
import { colors, COMP_WIDTH, COMP_HEIGHT } from '../theme';
import { montserrat, openSans } from '../fonts';

export const IntroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Logo animation
  const logoScale = spring({ frame, fps, config: { damping: 12, stiffness: 120 } });
  const logoOpacity = interpolate(frame, [0, 0.3 * fps], [0, 1], {
    extrapolateRight: 'clamp',
  });

  // Title animation
  const titleY = interpolate(
    spring({ frame, fps, delay: 0.4 * fps, config: { damping: 200 } }),
    [0, 1],
    [40, 0],
  );
  const titleOpacity = interpolate(frame, [0.4 * fps, 0.8 * fps], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Subtitle
  const subtitleOpacity = interpolate(frame, [0.8 * fps, 1.2 * fps], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const subtitleY = interpolate(
    spring({ frame, fps, delay: 0.8 * fps, config: { damping: 200 } }),
    [0, 1],
    [30, 0],
  );

  // Decorative line
  const lineWidth = interpolate(frame, [1 * fps, 1.6 * fps], [0, 200], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.quad),
  });

  // Badge
  const badgeScale = spring({ frame, fps, delay: 1.4 * fps, config: { damping: 15, stiffness: 180 } });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.pureWhite,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      {/* Subtle background gradient */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(1200px circle at 8% -10%, rgba(33, 33, 33, 0.04), transparent 45%), radial-gradient(900px circle at 100% 0%, rgba(66, 66, 66, 0.05), transparent 42%)`,
        }}
      />

      {/* Logo */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 24,
          transform: `scale(${logoScale})`,
          opacity: logoOpacity,
        }}
      >
        {/* V Logo mark */}
        <div
          style={{
            width: 120,
            height: 120,
            borderRadius: 28,
            backgroundColor: colors.charcoal,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span
            style={{
              fontFamily: montserrat,
              fontSize: 64,
              fontWeight: 700,
              color: colors.pureWhite,
              lineHeight: 1,
            }}
          >
            V
          </span>
        </div>
      </div>

      {/* Title */}
      <div
        style={{
          marginTop: 40,
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
          textAlign: 'center',
        }}
      >
        <h1
          style={{
            fontFamily: montserrat,
            fontSize: 72,
            fontWeight: 700,
            color: colors.charcoal,
            letterSpacing: -2,
            margin: 0,
          }}
        >
          VitaView
          <span style={{ color: colors.mediumGray, fontWeight: 500 }}>.ai</span>
        </h1>
      </div>

      {/* Decorative line */}
      <div
        style={{
          width: lineWidth,
          height: 3,
          backgroundColor: colors.charcoal,
          borderRadius: 2,
          marginTop: 20,
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
            fontSize: 28,
            color: colors.contentMuted,
            margin: 0,
          }}
        >
          Prontuario Medico Inteligente
        </p>
      </div>

      {/* Badge */}
      <div
        style={{
          marginTop: 32,
          transform: `scale(${badgeScale})`,
          backgroundColor: colors.charcoal,
          borderRadius: 50,
          padding: '12px 32px',
        }}
      >
        <span
          style={{
            fontFamily: montserrat,
            fontSize: 16,
            fontWeight: 700,
            color: colors.pureWhite,
            letterSpacing: 2,
            textTransform: 'uppercase',
          }}
        >
          Interacoes de UI
        </span>
      </div>
    </AbsoluteFill>
  );
};
