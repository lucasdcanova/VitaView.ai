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
import { c, S } from '../theme';
import { montserrat, openSans } from '../fonts';
import { reveal, wordReveal, scaleIn } from '../anim';

const Tag: React.FC<{ text: string; delay: number; v: boolean }> = ({ text, delay, v }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const s = scaleIn(frame, fps, delay);
  const o = interpolate(frame, [delay, delay + 0.3 * fps], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <div style={{
      opacity: o,
      transform: `scale(${interpolate(s, [0, 1], [0.9, 1])})`,
      backgroundColor: c.bgSurface,
      border: `1px solid ${c.strokeSoft}`,
      borderRadius: 50,
      padding: v ? '7px 16px' : '8px 20px',
      fontFamily: openSans,
      fontSize: v ? 13 : 14,
      fontWeight: 600,
      color: c.textDefault,
    }}>
      {text}
    </div>
  );
};

export const OutroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const v = height > width;

  // Logo
  const logoSpring = spring({ frame, fps, config: S.gentle });
  const logoO = interpolate(frame, [0, 0.5 * fps], [0, 1], { extrapolateRight: 'clamp' });

  // Headline: "Menos burocracia."
  const h1Words = wordReveal('Menos burocracia.', frame, fps, 0.3 * fps, 0.07);
  // Headline: "Mais medicina."
  const h2Words = wordReveal('Mais medicina.', frame, fps, 0.65 * fps, 0.08);

  // Subheadline
  const subR = reveal(frame, fps, 1 * fps, { y: 12 });

  // Tags
  const tagBase = 1.3 * fps;

  // CTA
  const ctaSpring = scaleIn(frame, fps, 2.2 * fps);
  const ctaO = interpolate(frame, [2.2 * fps, 2.5 * fps], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // URL
  const urlO = interpolate(frame, [2.6 * fps, 2.9 * fps], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ backgroundColor: c.bg, justifyContent: 'center', alignItems: 'center' }}>
      {/* Ambient glow */}
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse 60% 45% at 50% 45%, rgba(149,163,188,0.06), transparent)` }} />

      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        maxWidth: v ? 480 : 640, padding: '0 36px',
      }}>
        {/* Logo */}
        <Img
          src={staticFile('logo-icon.png')}
          style={{
            height: v ? 52 : 64,
            objectFit: 'contain',
            filter: 'brightness(0) invert(1)',
            transform: `translateY(${interpolate(logoSpring, [0, 1], [24, 0])}px)`,
            opacity: logoO,
            marginBottom: 30,
          }}
        />

        {/* "Menos burocracia." */}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
          {h1Words.map((w, i) => (
            <span key={i} style={{
              ...w.style,
              fontFamily: montserrat, fontSize: v ? 40 : 56, fontWeight: 700,
              color: c.textStrong, letterSpacing: -1.5, lineHeight: 1.08,
            }}>{w.word}</span>
          ))}
        </div>

        {/* "Mais medicina." */}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', marginTop: 4 }}>
          {h2Words.map((w, i) => (
            <span key={i} style={{
              ...w.style,
              fontFamily: montserrat, fontSize: v ? 40 : 56, fontWeight: 700,
              color: c.textSubtle, letterSpacing: -1.5, lineHeight: 1.08,
            }}>{w.word}</span>
          ))}
        </div>

        {/* Subheadline */}
        <p style={{
          ...subR,
          fontFamily: openSans, fontSize: v ? 16 : 18, color: c.textMuted,
          margin: 0, marginTop: 18, textAlign: 'center', lineHeight: 1.5,
        }}>
          O prontuário que trabalha por você.
        </p>

        {/* Feature tags */}
        <div style={{ display: 'flex', gap: 8, marginTop: 28, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Tag text="Transcrição por Voz" delay={Math.round(tagBase)} v={v} />
          <Tag text="Análise com IA" delay={Math.round(tagBase + 0.1 * fps)} v={v} />
          <Tag text="Importação Total" delay={Math.round(tagBase + 0.2 * fps)} v={v} />
          <Tag text="Visão Completa" delay={Math.round(tagBase + 0.3 * fps)} v={v} />
        </div>

        {/* CTA button */}
        <div style={{
          marginTop: 36,
          opacity: ctaO,
          transform: `scale(${interpolate(ctaSpring, [0, 1], [0.93, 1])})`,
        }}>
          <div style={{
            backgroundColor: c.primary, borderRadius: 14,
            padding: v ? '15px 32px' : '16px 40px',
            fontFamily: montserrat, fontSize: v ? 16 : 18, fontWeight: 700, color: c.bg,
          }}>
            Comece Agora — 30 Dias Grátis
          </div>
        </div>

        {/* URL */}
        <div style={{
          marginTop: 14, opacity: urlO,
          fontFamily: openSans, fontSize: 15, color: c.textSubtle, fontWeight: 600,
        }}>
          vitaview.ai
        </div>
      </div>
    </AbsoluteFill>
  );
};
