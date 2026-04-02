import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Img,
  staticFile,
} from 'remotion';
import { colors, SPRING_SMOOTH, SPRING_GENTLE } from '../theme';
import { montserrat, openSans } from '../fonts';

const FeaturePill: React.FC<{ text: string; delay: number }> = ({ text, delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const entrance = spring({ frame, fps, delay, config: SPRING_GENTLE });
  const opacity = interpolate(frame, [delay, delay + 0.25 * fps], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <div
      style={{
        opacity,
        transform: `scale(${interpolate(entrance, [0, 1], [0.85, 1])})`,
        backgroundColor: 'rgba(33,33,33,0.05)',
        borderRadius: 50,
        padding: '9px 22px',
        fontFamily: openSans,
        fontSize: 15,
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
  const { fps, width, height } = useVideoConfig();
  const isVertical = height > width;

  const logoSpring = spring({ frame, fps, config: SPRING_GENTLE });
  const logoOpacity = interpolate(frame, [0, 0.4 * fps], [0, 1], { extrapolateRight: 'clamp' });

  const titleSpring = spring({ frame, fps, delay: 0.3 * fps, config: SPRING_SMOOTH });
  const titleOpacity = interpolate(frame, [0.3 * fps, 0.7 * fps], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  const subtitleOpacity = interpolate(frame, [0.7 * fps, 1 * fps], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  const ctaSpring = spring({ frame, fps, delay: 2 * fps, config: SPRING_GENTLE });
  const ctaOpacity = interpolate(frame, [2 * fps, 2.3 * fps], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ backgroundColor: colors.pureWhite, justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse 80% 60% at 50% 40%, rgba(33,33,33,0.035), transparent)` }} />

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: isVertical ? 500 : 700, padding: '0 40px' }}>
        <Img
          src={staticFile('logo-icon.png')}
          style={{
            height: isVertical ? 60 : 72,
            objectFit: 'contain',
            transform: `translateY(${interpolate(logoSpring, [0, 1], [30, 0])}px)`,
            opacity: logoOpacity,
            marginBottom: 28,
          }}
        />

        <div style={{ opacity: titleOpacity, transform: `translateY(${interpolate(titleSpring, [0, 1], [25, 0])}px)`, textAlign: 'center' }}>
          <h1 style={{ fontFamily: montserrat, fontSize: isVertical ? 42 : 58, fontWeight: 700, color: colors.charcoal, letterSpacing: -2, margin: 0, lineHeight: 1.1 }}>
            Prontuario do Futuro.
            <br />
            <span style={{ color: colors.mediumGray }}>Disponivel Hoje.</span>
          </h1>
        </div>

        <div style={{ opacity: subtitleOpacity, marginTop: 18, textAlign: 'center' }}>
          <p style={{ fontFamily: openSans, fontSize: isVertical ? 18 : 20, color: colors.contentMuted, margin: 0 }}>
            IA, transcricao, agenda e gestao — tudo em um lugar.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 30, flexWrap: 'wrap', justifyContent: 'center' }}>
          <FeaturePill text="Transcricao com IA" delay={Math.round(1 * fps)} />
          <FeaturePill text="Agenda Inteligente" delay={Math.round(1.12 * fps)} />
          <FeaturePill text="Prescricao Digital" delay={Math.round(1.24 * fps)} />
          <FeaturePill text="Analise de Exames" delay={Math.round(1.36 * fps)} />
          <FeaturePill text="Graficos de Evolucao" delay={Math.round(1.48 * fps)} />
        </div>

        <div style={{ marginTop: 40, opacity: ctaOpacity, transform: `scale(${interpolate(ctaSpring, [0, 1], [0.92, 1])})` }}>
          <div style={{ backgroundColor: colors.charcoal, borderRadius: 14, padding: isVertical ? '16px 36px' : '17px 44px', fontFamily: montserrat, fontSize: isVertical ? 17 : 19, fontWeight: 700, color: colors.pureWhite }}>
            Teste Gratis por 30 Dias →
          </div>
        </div>

        <div style={{ marginTop: 16, opacity: ctaOpacity, fontFamily: openSans, fontSize: 16, color: colors.mediumGray, fontWeight: 600 }}>
          vitaview.ai
        </div>
      </div>
    </AbsoluteFill>
  );
};
