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
import { fs } from '../scale';

export const IntroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const v = height > width;

  const logoSpring = spring({ frame, fps, config: S.gentle });
  const logoOpacity = interpolate(frame, [0, 0.7 * fps], [0, 1], { extrapolateRight: 'clamp' });

  const lineW = interpolate(frame, [0.9 * fps, 1.8 * fps], [0, v ? 160 : 220], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.22, 1, 0.36, 1),
  });

  const subWords = wordReveal('Prontuário Médico Inteligente', frame, fps, 1.1 * fps, 0.07);

  return (
    <AbsoluteFill style={{ backgroundColor: c.bg, justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse 70% 50% at 50% 45%, rgba(149,163,188,0.06), transparent)` }} />

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: v ? '0 40px' : 0 }}>
        <Img
          src={staticFile('logo-full.png')}
          style={{
            height: v ? 160 : 200,
            objectFit: 'contain',
            filter: 'brightness(0) invert(1)',
            transform: `translateY(${interpolate(logoSpring, [0, 1], [40, 0])}px)`,
            opacity: logoOpacity,
          }}
        />

        <div style={{ width: lineW, height: 2.5, backgroundColor: c.primaryMuted, borderRadius: 1, marginTop: 28, opacity: lineW > 1 ? 0.5 : 0 }} />

        <div style={{ marginTop: 22, display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
          {subWords.map((w, i) => (
            <span key={i} style={{ ...w.style, fontFamily: openSans, fontSize: fs(28, v), color: c.textMuted, fontWeight: 500 }}>
              {w.word}
            </span>
          ))}
        </div>

        <div style={{ height: 12 }} />
      </div>
    </AbsoluteFill>
  );
};
