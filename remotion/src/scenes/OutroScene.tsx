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
import { fs } from '../scale';

const Tag: React.FC<{ text: string; delay: number; v: boolean }> = ({ text, delay, v }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = scaleIn(frame, fps, delay);
  const o = interpolate(frame, [delay, delay + 0.3 * fps], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <div style={{
      opacity: o, transform: `scale(${interpolate(s, [0, 1], [0.9, 1])})`,
      backgroundColor: c.bgSurface, border: `1px solid ${c.strokeSoft}`, borderRadius: 50,
      padding: v ? '9px 20px' : '9px 22px',
      fontFamily: openSans, fontSize: fs(14, v), fontWeight: 600, color: c.textDefault,
    }}>
      {text}
    </div>
  );
};

export const OutroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const v = height > width;

  const logoSpring = spring({ frame, fps, config: S.gentle });
  const logoO = interpolate(frame, [0, 0.5 * fps], [0, 1], { extrapolateRight: 'clamp' });

  const h1Words = wordReveal('Menos burocracia.', frame, fps, 0.3 * fps, 0.07);
  const h2Words = wordReveal('Mais medicina.', frame, fps, 0.65 * fps, 0.08);
  const subR = reveal(frame, fps, 1 * fps, { y: 12 });
  const tagBase = 1.3 * fps;
  const ctaSpring = scaleIn(frame, fps, 2.2 * fps);
  const ctaO = interpolate(frame, [2.2 * fps, 2.5 * fps], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const urlO = interpolate(frame, [2.6 * fps, 2.9 * fps], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ backgroundColor: c.bg, justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse 60% 45% at 50% 45%, rgba(149,163,188,0.06), transparent)` }} />

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: v ? 950 : 1200, padding: '0 36px' }}>
        <Img
          src={staticFile('logo-icon.png')}
          style={{
            height: v ? 64 : 72, objectFit: 'contain', filter: 'brightness(0) invert(1)',
            transform: `translateY(${interpolate(logoSpring, [0, 1], [24, 0])}px)`,
            opacity: logoO, marginBottom: 30,
          }}
        />

        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
          {h1Words.map((w, i) => (
            <span key={i} style={{ ...w.style, fontFamily: montserrat, fontSize: fs(56, v), fontWeight: 700, color: c.textStrong, letterSpacing: -1.5, lineHeight: 1.08 }}>{w.word}</span>
          ))}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', marginTop: 4 }}>
          {h2Words.map((w, i) => (
            <span key={i} style={{ ...w.style, fontFamily: montserrat, fontSize: fs(56, v), fontWeight: 700, color: c.textSubtle, letterSpacing: -1.5, lineHeight: 1.08 }}>{w.word}</span>
          ))}
        </div>

        <p style={{ ...subR, fontFamily: openSans, fontSize: fs(18, v), color: c.textMuted, margin: 0, marginTop: 18, textAlign: 'center', lineHeight: 1.5 }}>
          O prontuário que trabalha por você.
        </p>

        <div style={{ display: 'flex', gap: 8, marginTop: 28, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Tag text="Transcrição por Voz" delay={Math.round(tagBase)} v={v} />
          <Tag text="Análise com IA" delay={Math.round(tagBase + 0.1 * fps)} v={v} />
          <Tag text="Importação Total" delay={Math.round(tagBase + 0.2 * fps)} v={v} />
          <Tag text="Visão Completa" delay={Math.round(tagBase + 0.3 * fps)} v={v} />
        </div>

        <div style={{ marginTop: 36, opacity: urlO, fontFamily: openSans, fontSize: fs(18, v), color: c.textSubtle, fontWeight: 600 }}>
          vitaview.ai
        </div>

        {/* Platform icons */}
        <div style={{
          marginTop: 24, opacity: urlO,
          display: 'flex', alignItems: 'center', gap: v ? 20 : 24,
        }}>
          {/* Apple */}
          <svg width={v ? 18 : 20} height={v ? 18 : 20} viewBox="0 0 24 24" fill={c.textSubtle}>
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
          </svg>
          {/* Android */}
          <svg width={v ? 18 : 20} height={v ? 18 : 20} viewBox="0 0 24 24" fill={c.textSubtle}>
            <path d="M6 18c0 .55.45 1 1 1h1v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h2v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h1c.55 0 1-.45 1-1V8H6v10zM3.5 8C2.67 8 2 8.67 2 9.5v7c0 .83.67 1.5 1.5 1.5S5 17.33 5 16.5v-7C5 8.67 4.33 8 3.5 8zm17 0c-.83 0-1.5.67-1.5 1.5v7c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5v-7c0-.83-.67-1.5-1.5-1.5zm-4.97-5.84l1.3-1.3c.2-.2.2-.51 0-.71-.2-.2-.51-.2-.71 0l-1.48 1.48C13.85 1.23 12.95 1 12 1c-.96 0-1.86.23-2.66.63L7.85.15c-.2-.2-.51-.2-.71 0-.2.2-.2.51 0 .71l1.31 1.31C6.97 3.26 6 5.01 6 7h12c0-1.99-.97-3.75-2.47-4.84zM10 5H9V4h1v1zm5 0h-1V4h1v1z"/>
          </svg>
          {/* Windows */}
          <svg width={v ? 16 : 18} height={v ? 16 : 18} viewBox="0 0 24 24" fill={c.textSubtle}>
            <path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.9-1.801"/>
          </svg>
          {/* Web/Globe */}
          <svg width={v ? 18 : 20} height={v ? 18 : 20} viewBox="0 0 24 24" fill="none" stroke={c.textSubtle} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="2" y1="12" x2="22" y2="12"/>
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
          </svg>
        </div>

        <div style={{
          marginTop: 8, opacity: urlO,
          fontFamily: openSans, fontSize: fs(10, v), color: c.strokeStrong, fontWeight: 500,
          letterSpacing: 1,
        }}>
          iOS • Android • Windows • Web
        </div>
      </div>
    </AbsoluteFill>
  );
};
