import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
  Sequence,
} from 'remotion';
import { c, S } from '../theme';
import { montserrat, openSans } from '../fonts';
import { reveal, wordReveal, scaleIn } from '../anim';
import { fs } from '../scale';

// A single document that floats up, enters the "AI zone", and transforms
const FloatingDoc: React.FC<{
  name: string; icon: string; delay: number;
  startY: number; startX: number;
  v: boolean;
}> = ({ name, icon, delay, startY, startX, v }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Phase 1: float up (0→0.6s)
  // Phase 2: absorbed into AI (0.6→1.2s)
  // Phase 3: result appears (1.2→1.8s)
  const t = interpolate(frame, [delay, delay + 1.8 * fps], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });

  // Document floating
  const docOpacity = interpolate(t, [0, 0.05, 0.3, 0.42], [0, 1, 1, 0]);
  const docY = interpolate(t, [0, 0.35], [startY, startY - 60], {
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.22, 1, 0.36, 1),
  });
  const docScale = interpolate(t, [0, 0.1, 0.3, 0.42], [0.7, 1, 1, 0.6]);
  const docX = interpolate(t, [0.25, 0.42], [0, v ? 0 : 30], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    easing: Easing.bezier(0.4, 0, 0.2, 1),
  });

  // Glow when entering AI zone
  const glowIntensity = interpolate(t, [0.28, 0.4, 0.5], [0, 1, 0], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });

  // Result card emerging
  const resultSpring = t > 0.55 ? spring({ frame: frame - (delay + 0.55 * 1.8 * fps), fps, config: S.smooth }) : 0;
  const resultOpacity = interpolate(t, [0.55, 0.65], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });

  return (
    <div style={{ position: 'relative', height: v ? 90 : 100, marginBottom: v ? 6 : 8 }}>
      {/* Original document */}
      <div style={{
        position: 'absolute',
        left: startX,
        top: docY,
        opacity: docOpacity,
        transform: `scale(${docScale}) translateX(${docX}px)`,
        display: 'flex', alignItems: 'center', gap: 10,
        backgroundColor: c.bgCard, borderRadius: 12, padding: '10px 14px',
        border: `1px solid ${c.strokeSoft}`,
        boxShadow: glowIntensity > 0 ? `0 0 ${20 * glowIntensity}px rgba(96,165,250,${0.3 * glowIntensity})` : 'none',
        whiteSpace: 'nowrap',
      }}>
        <span style={{ fontSize: 18 }}>{icon}</span>
        <span style={{ fontFamily: openSans, fontSize: fs(13, v), fontWeight: 600, color: c.textDefault }}>{name}</span>
      </div>

      {/* Result card */}
      <div style={{
        position: 'absolute',
        right: 0,
        top: 0,
        opacity: resultOpacity,
        transform: `translateX(${interpolate(resultSpring, [0, 1], [16, 0])}px)`,
        display: 'flex', alignItems: 'center', gap: 10,
        backgroundColor: c.bgCard, borderRadius: 12, padding: '10px 14px',
        border: `1px solid rgba(34,197,94,0.2)`,
        whiteSpace: 'nowrap',
      }}>
        <div style={{
          width: 28, height: 28, borderRadius: 7,
          backgroundColor: c.greenMuted, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, color: c.green, fontWeight: 700,
          transform: `scale(${resultSpring})`,
        }}>✓</div>
        <div>
          <div style={{ fontFamily: montserrat, fontSize: fs(12, v), fontWeight: 700, color: c.textStrong }}>{name}</div>
          <div style={{ fontFamily: openSans, fontSize: fs(9, v), color: c.green }}>Analisado pela IA</div>
        </div>
      </div>
    </div>
  );
};

// Central AI processing orb
const AIOrb: React.FC<{ delay: number; v: boolean }> = ({ delay, v }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const entrance = scaleIn(frame, fps, delay);
  const o = interpolate(frame, [delay, delay + 0.4 * fps], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  const breathe = 0.95 + Math.sin(frame * 0.1) * 0.05;
  const ringRotation = frame * 0.8;

  const orbSize = v ? 80 : 100;

  return (
    <div style={{
      opacity: o,
      transform: `scale(${interpolate(entrance, [0, 1], [0.8, 1])})`,
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
      margin: v ? '16px 0' : '0 32px',
    }}>
      {/* Orb */}
      <div style={{
        width: orbSize, height: orbSize, borderRadius: orbSize / 2,
        background: `radial-gradient(circle at 40% 35%, ${c.bgElevated}, ${c.bgCard})`,
        border: `1px solid ${c.strokeDefault}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transform: `scale(${breathe})`,
        position: 'relative',
        boxShadow: `0 0 ${30 + Math.sin(frame * 0.12) * 10}px rgba(96,165,250,0.08)`,
      }}>
        {/* Rotating ring */}
        <div style={{
          position: 'absolute', inset: -4,
          borderRadius: '50%',
          border: `2px solid transparent`,
          borderTopColor: c.blue,
          borderRightColor: 'rgba(96,165,250,0.3)',
          transform: `rotate(${ringRotation}deg)`,
        }} />

        <span style={{ fontFamily: montserrat, fontSize: fs(16, v), fontWeight: 700, color: c.textStrong }}>IA</span>
      </div>
      <div style={{ fontFamily: openSans, fontSize: fs(11, v), color: c.textMuted, textAlign: 'center' }}>
        Processando
      </div>
    </div>
  );
};

export const ExamUploadScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const v = height > width;

  const titleWords = wordReveal('Envie e a IA Analisa', frame, fps, 0.15 * fps, 0.07);

  const maxW = v ? 520 : 900;

  const docs = [
    { name: 'Hemograma', icon: '🩸', delay: 1 * fps },
    { name: 'TSH e T4', icon: '🧪', delay: 1.6 * fps },
    { name: 'Perfil Lipídico', icon: '💉', delay: 2.2 * fps },
  ];

  // Summary stats that appear at the end
  const summaryDelay = 4.5 * fps;
  const summaryR = reveal(frame, fps, summaryDelay, { y: 14 });

  return (
    <AbsoluteFill style={{ backgroundColor: c.bg }}>
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse 50% 40% at 50% 50%, rgba(96,165,250,0.04), transparent)` }} />

      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: v ? '70px 40px' : '60px 40px', gap: v ? 20 : 24,
      }}>
        {/* Title */}
        <div style={{ maxWidth: maxW, textAlign: 'center' }}>
          <div style={{ ...reveal(frame, fps, 0), fontFamily: montserrat, fontSize: fs(12, v), fontWeight: 700, color: c.textSubtle, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 8 }}>
            Análise de Exames
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
            {titleWords.map((w, i) => (
              <span key={i} style={{ ...w.style, fontFamily: montserrat, fontSize: fs(38, v), fontWeight: 700, color: c.textStrong, letterSpacing: -0.8 }}>{w.word}</span>
            ))}
          </div>
          <p style={{
            ...reveal(frame, fps, 0.5 * fps, { y: 10 }),
            fontFamily: openSans, fontSize: fs(16, v), color: c.textMuted,
            margin: 0, marginTop: 8,
          }}>
            Envie o exame em PDF ou foto — o resultado aparece em segundos.
          </p>
        </div>

        {/* Main flow: Documents → AI Orb → Results */}
        <div style={{
          maxWidth: maxW, width: '100%',
          display: 'flex', flexDirection: v ? 'column' : 'row',
          alignItems: 'center', justifyContent: 'center',
        }}>
          {/* Documents column */}
          <div style={{ flex: v ? undefined : 1, width: v ? '100%' : undefined }}>
            {docs.map((doc, i) => (
              <FloatingDoc
                key={i}
                name={doc.name}
                icon={doc.icon}
                delay={doc.delay}
                startY={10}
                startX={v ? 10 : 20}
                v={v}
              />
            ))}
          </div>

          {/* AI Orb */}
          <Sequence from={Math.round(0.8 * fps)} layout="none" premountFor={Math.round(0.3 * fps)}>
            <AIOrb delay={0} v={v} />
          </Sequence>

          {/* Empty right space — results appear inside FloatingDoc */}
          {!v && <div style={{ flex: 1 }} />}
        </div>

        {/* Summary */}
        <div style={{
          ...summaryR,
          maxWidth: maxW,
          backgroundColor: c.bgCard, borderRadius: 14, padding: v ? '16px 20px' : '18px 26px',
          border: `1px solid ${c.strokeSoft}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: v ? 20 : 36,
        }}>
          {[
            { n: '3', label: 'Exames enviados' },
            { n: '3', label: 'Analisados pela IA' },
            { n: '12', label: 'Métricas extraídas' },
          ].map((item, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: montserrat, fontSize: fs(28, v), fontWeight: 700, color: c.green }}>{item.n}</div>
              <div style={{ fontFamily: openSans, fontSize: fs(12, v), color: c.textMuted }}>{item.label}</div>
            </div>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};
