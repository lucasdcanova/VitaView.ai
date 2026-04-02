import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
} from 'remotion';
import { colors } from '../theme';
import { montserrat, openSans } from '../fonts';

const FeaturePill: React.FC<{ text: string; delay: number }> = ({ text, delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const entrance = spring({ frame, fps, delay, config: { damping: 15, stiffness: 140 } });
  const opacity = interpolate(frame, [delay, delay + 0.2 * fps], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        opacity,
        transform: `scale(${interpolate(entrance, [0, 1], [0.8, 1])})`,
        backgroundColor: 'rgba(33,33,33,0.06)',
        borderRadius: 50,
        padding: '10px 24px',
        fontFamily: openSans,
        fontSize: 16,
        fontWeight: 600,
        color: colors.contentDefault,
      }}
    >
      {text}
    </div>
  );
};

export const OutroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoScale = spring({ frame, fps, config: { damping: 12, stiffness: 120 } });
  const logoOpacity = interpolate(frame, [0, 0.3 * fps], [0, 1], { extrapolateRight: 'clamp' });

  const titleOpacity = interpolate(frame, [0.3 * fps, 0.6 * fps], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const titleY = interpolate(
    spring({ frame, fps, delay: 0.3 * fps, config: { damping: 200 } }),
    [0, 1],
    [30, 0],
  );

  const subtitleOpacity = interpolate(frame, [0.6 * fps, 0.9 * fps], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const ctaScale = spring({ frame, fps, delay: 2 * fps, config: { damping: 12, stiffness: 100 } });
  const ctaOpacity = interpolate(frame, [2 * fps, 2.3 * fps], [0, 1], {
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
          background: `radial-gradient(1200px circle at 8% -10%, rgba(33, 33, 33, 0.04), transparent 45%), radial-gradient(900px circle at 100% 0%, rgba(66, 66, 66, 0.05), transparent 42%)`,
        }}
      />

      {/* Logo */}
      <div
        style={{
          transform: `scale(${logoScale})`,
          opacity: logoOpacity,
          width: 80,
          height: 80,
          borderRadius: 20,
          backgroundColor: colors.charcoal,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 32,
        }}
      >
        <span style={{ fontFamily: montserrat, fontSize: 42, fontWeight: 700, color: colors.pureWhite }}>V</span>
      </div>

      {/* Title */}
      <div
        style={{
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
          textAlign: 'center',
        }}
      >
        <h1
          style={{
            fontFamily: montserrat,
            fontSize: 64,
            fontWeight: 700,
            color: colors.charcoal,
            letterSpacing: -2,
            margin: 0,
            lineHeight: 1.1,
          }}
        >
          Prontuario do Futuro.
          <br />
          <span style={{ color: colors.mediumGray }}>Disponivel Hoje.</span>
        </h1>
      </div>

      {/* Subtitle */}
      <div style={{ opacity: subtitleOpacity, marginTop: 20, textAlign: 'center' }}>
        <p style={{ fontFamily: openSans, fontSize: 22, color: colors.contentMuted, margin: 0 }}>
          IA, transcricao, agenda e gestao — tudo em um so lugar.
        </p>
      </div>

      {/* Feature pills */}
      <div style={{ display: 'flex', gap: 12, marginTop: 36, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 800 }}>
        <FeaturePill text="Transcricao com IA" delay={1 * fps} />
        <FeaturePill text="Agenda Inteligente" delay={1.15 * fps} />
        <FeaturePill text="Prescricao Digital" delay={1.3 * fps} />
        <FeaturePill text="Analise de Exames" delay={1.45 * fps} />
        <FeaturePill text="Graficos de Evolucao" delay={1.6 * fps} />
      </div>

      {/* CTA */}
      <div
        style={{
          marginTop: 48,
          opacity: ctaOpacity,
          transform: `scale(${interpolate(ctaScale, [0, 1], [0.9, 1])})`,
        }}
      >
        <div
          style={{
            backgroundColor: colors.charcoal,
            borderRadius: 14,
            padding: '18px 48px',
            fontFamily: montserrat,
            fontSize: 20,
            fontWeight: 700,
            color: colors.pureWhite,
          }}
        >
          Teste Gratis por 30 Dias →
        </div>
      </div>

      {/* URL */}
      <div
        style={{
          marginTop: 20,
          opacity: ctaOpacity,
          fontFamily: openSans,
          fontSize: 18,
          color: colors.mediumGray,
          fontWeight: 600,
        }}
      >
        vitaview.ai
      </div>
    </AbsoluteFill>
  );
};
