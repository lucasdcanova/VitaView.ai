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
import { colors, SPRING_SMOOTH, SPRING_GENTLE } from '../theme';
import { montserrat, openSans } from '../fonts';

export const IntroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const isVertical = height > width;

  const logoSpring = spring({ frame, fps, config: SPRING_GENTLE });
  const logoOpacity = interpolate(frame, [0, 0.6 * fps], [0, 1], { extrapolateRight: 'clamp' });
  const logoY = interpolate(logoSpring, [0, 1], [50, 0]);

  const lineWidth = interpolate(frame, [0.8 * fps, 1.6 * fps], [0, isVertical ? 160 : 220], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.22, 1, 0.36, 1),
  });

  const subtitleSpring = spring({ frame, fps, delay: 1 * fps, config: SPRING_SMOOTH });
  const subtitleOpacity = interpolate(frame, [1 * fps, 1.4 * fps], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const badgeSpring = spring({ frame, fps, delay: 1.5 * fps, config: SPRING_GENTLE });
  const badgeOpacity = interpolate(frame, [1.5 * fps, 1.8 * fps], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.pureWhite,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(ellipse 80% 60% at 50% 40%, rgba(33,33,33,0.035), transparent)`,
        }}
      />

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 0,
        }}
      >
        <Img
          src={staticFile('logo-full.png')}
          style={{
            height: isVertical ? 100 : 130,
            objectFit: 'contain',
            transform: `translateY(${logoY}px)`,
            opacity: logoOpacity,
          }}
        />

        <div style={{ width: lineWidth, height: 2.5, backgroundColor: colors.charcoal, borderRadius: 2, marginTop: 28, opacity: lineWidth > 0 ? 1 : 0 }} />

        <p
          style={{
            fontFamily: openSans,
            fontSize: isVertical ? 24 : 28,
            color: colors.contentMuted,
            margin: 0,
            marginTop: 22,
            fontWeight: 500,
            opacity: subtitleOpacity,
            transform: `translateY(${interpolate(subtitleSpring, [0, 1], [25, 0])}px)`,
          }}
        >
          Prontuario Medico Inteligente
        </p>

        <div
          style={{
            marginTop: 32,
            transform: `scale(${interpolate(badgeSpring, [0, 1], [0.88, 1])})`,
            opacity: badgeOpacity,
            backgroundColor: colors.charcoal,
            borderRadius: 50,
            padding: isVertical ? '12px 28px' : '13px 34px',
          }}
        >
          <span
            style={{
              fontFamily: montserrat,
              fontSize: isVertical ? 13 : 15,
              fontWeight: 700,
              color: colors.pureWhite,
              letterSpacing: 3,
              textTransform: 'uppercase',
            }}
          >
            Interacoes de UI
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
