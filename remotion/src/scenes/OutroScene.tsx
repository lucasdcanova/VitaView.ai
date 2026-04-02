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
import { c, S } from '../theme';
import { montserrat, openSans } from '../fonts';
import { reveal, wordReveal, scaleIn } from '../anim';

const Pill: React.FC<{ text: string; delay: number }> = ({ text, delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const s = scaleIn(frame, fps, delay);
  const o = interpolate(frame, [delay, delay + 0.3 * fps], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <div style={{ opacity: o, transform: `scale(${interpolate(s, [0, 1], [0.88, 1])})`, backgroundColor: c.bgSurface, border: `1px solid ${c.strokeSoft}`, borderRadius: 50, padding: '8px 20px', fontFamily: openSans, fontSize: 14, fontWeight: 600, color: c.textDefault }}>
      {text}
    </div>
  );
};

export const OutroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const v = height > width;

  const logoSpring = spring({ frame, fps, config: S.gentle });
  const logoOpacity = interpolate(frame, [0, 0.5 * fps], [0, 1], { extrapolateRight: 'clamp' });

  const line1Words = wordReveal('Prontuário do Futuro.', frame, fps, 0.35 * fps, 0.06);
  const line2Words = wordReveal('Disponível Hoje.', frame, fps, 0.7 * fps, 0.07);

  const subR = reveal(frame, fps, 0.9 * fps, { y: 14 });

  const ctaScale = scaleIn(frame, fps, 2.1 * fps);
  const ctaO = interpolate(frame, [2.1 * fps, 2.4 * fps], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ backgroundColor: c.bg, justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse 70% 50% at 50% 45%, rgba(149,163,188,0.06), transparent)` }} />

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: v ? 480 : 680, padding: '0 36px' }}>
        {/* Logo — inverted for dark */}
        <Img
          src={staticFile('logo-icon.png')}
          style={{
            height: v ? 56 : 68,
            objectFit: 'contain',
            filter: 'brightness(0) invert(1)',
            transform: `translateY(${interpolate(logoSpring, [0, 1], [28, 0])}px)`,
            opacity: logoOpacity,
            marginBottom: 28,
          }}
        />

        {/* Title line 1 */}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
          {line1Words.map((w, i) => (
            <span key={i} style={{ ...w.style, fontFamily: montserrat, fontSize: v ? 38 : 54, fontWeight: 700, color: c.textStrong, letterSpacing: -1.5, lineHeight: 1.1 }}>{w.word}</span>
          ))}
        </div>
        {/* Title line 2 */}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', marginTop: 4 }}>
          {line2Words.map((w, i) => (
            <span key={i} style={{ ...w.style, fontFamily: montserrat, fontSize: v ? 38 : 54, fontWeight: 700, color: c.textSubtle, letterSpacing: -1.5, lineHeight: 1.1 }}>{w.word}</span>
          ))}
        </div>

        {/* Subtitle */}
        <p style={{ ...subR, fontFamily: openSans, fontSize: v ? 16 : 19, color: c.textMuted, margin: 0, marginTop: 18, textAlign: 'center' }}>
          IA, transcrição, agenda e gestão — tudo em um lugar.
        </p>

        {/* Pills */}
        <div style={{ display: 'flex', gap: 8, marginTop: 28, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Pill text="Transcrição com IA" delay={Math.round(1.1 * fps)} />
          <Pill text="Agenda Inteligente" delay={Math.round(1.2 * fps)} />
          <Pill text="Prescrição Digital" delay={Math.round(1.3 * fps)} />
          <Pill text="Análise de Exames" delay={Math.round(1.4 * fps)} />
          <Pill text="Gráficos de Evolução" delay={Math.round(1.5 * fps)} />
        </div>

        {/* CTA */}
        <div style={{ marginTop: 38, opacity: ctaO, transform: `scale(${interpolate(ctaScale, [0, 1], [0.93, 1])})` }}>
          <div style={{ backgroundColor: c.primary, borderRadius: 14, padding: v ? '15px 34px' : '16px 42px', fontFamily: montserrat, fontSize: v ? 16 : 18, fontWeight: 700, color: c.bg }}>
            Teste Grátis por 30 Dias →
          </div>
        </div>

        <div style={{ marginTop: 14, opacity: ctaO, fontFamily: openSans, fontSize: 15, color: c.textSubtle, fontWeight: 600 }}>
          vitaview.ai
        </div>
      </div>
    </AbsoluteFill>
  );
};
