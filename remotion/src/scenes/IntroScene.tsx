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

export const IntroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const v = height > width;

  const logoSpring = spring({ frame, fps, config: S.gentle });
  const logoOpacity = interpolate(frame, [0, 0.7 * fps], [0, 1], { extrapolateRight: 'clamp' });

  const lineW = interpolate(frame, [0.9 * fps, 1.8 * fps], [0, v ? 140 : 200], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.22, 1, 0.36, 1),
  });

  const subWords = wordReveal('Prontuário Médico Inteligente', frame, fps, 1.1 * fps, 0.07);

  const badgeScale = scaleIn(frame, fps, 1.7 * fps);
  const badgeOpacity = interpolate(frame, [1.7 * fps, 2 * fps], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ backgroundColor: c.bg, justifyContent: 'center', alignItems: 'center' }}>
      {/* Subtle radial glow */}
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse 70% 50% at 50% 45%, rgba(149,163,188,0.06), transparent)` }} />

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: v ? '0 40px' : 0 }}>
        {/* Logo — inverted for dark mode */}
        <Img
          src={staticFile('logo-full.png')}
          style={{
            height: v ? 90 : 120,
            objectFit: 'contain',
            filter: 'brightness(0) invert(1)',
            transform: `translateY(${interpolate(logoSpring, [0, 1], [40, 0])}px)`,
            opacity: logoOpacity,
          }}
        />

        {/* Line */}
        <div style={{ width: lineW, height: 2, backgroundColor: c.primaryMuted, borderRadius: 1, marginTop: 26, opacity: lineW > 1 ? 0.5 : 0 }} />

        {/* Subtitle — per-word reveal */}
        <div style={{ marginTop: 22, display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
          {subWords.map((w, i) => (
            <span key={i} style={{ ...w.style, fontFamily: openSans, fontSize: v ? 22 : 27, color: c.textMuted, fontWeight: 500 }}>
              {w.word}
            </span>
          ))}
        </div>

        {/* Badge */}
        <div
          style={{
            marginTop: 34,
            transform: `scale(${interpolate(badgeScale, [0, 1], [0.88, 1])})`,
            opacity: badgeOpacity,
            backgroundColor: c.bgElevated,
            border: `1px solid ${c.strokeDefault}`,
            borderRadius: 50,
            padding: v ? '11px 26px' : '12px 32px',
          }}
        >
          <span style={{ fontFamily: montserrat, fontSize: v ? 12 : 14, fontWeight: 700, color: c.textDefault, letterSpacing: 3, textTransform: 'uppercase' }}>
            Interações de UI
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
