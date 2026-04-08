import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
} from 'remotion';
import { c, S } from '../theme';
import { montserrat, openSans } from '../fonts';
import { reveal, wordReveal, scaleIn } from '../anim';
import { fs } from '../scale';

// A single exam flowing through the pipeline: LEFT → CENTER (AI) → RIGHT
const ExamFlow: React.FC<{
  name: string; icon: string; delay: number; row: number; v: boolean;
  pipeW: number;
}> = ({ name, icon, delay, row, v, pipeW }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const dur = 2.8 * fps;
  const t = interpolate(frame, [delay, delay + dur], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    easing: Easing.bezier(0.22, 1, 0.36, 1),
  });

  // Horizontal travel across the pipeline
  const leftEdge = 0;
  const center = pipeW * 0.5;
  const rightEdge = pipeW;

  // Card X position: left → center (pause) → right
  const cardX = interpolate(t, [0, 0.3, 0.55, 1], [leftEdge - 40, center - 80, center - 80, rightEdge - 200], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });

  // Opacity: fade in, hold, then doc fades as result appears
  const docOpacity = interpolate(t, [0, 0.06, 0.5, 0.6], [0, 1, 1, 0]);
  const resultOpacity = interpolate(t, [0.55, 0.65, 0.92, 1], [0, 1, 1, 0.9]);

  // Scale pulse when reaching the AI center
  const atCenter = t > 0.28 && t < 0.58;
  const pulseScale = atCenter
    ? 1 + Math.sin((t - 0.28) * 20) * 0.03
    : 1;

  // Glow intensity at center
  const glow = interpolate(t, [0.25, 0.4, 0.55], [0, 1, 0], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });

  // Result spring
  const resultScale = t > 0.55
    ? spring({ frame: frame - (delay + 0.55 * dur), fps, config: S.smooth })
    : 0;

  const rowY = v ? row * 100 : row * 90;
  const cardH = v ? 52 : 60;

  return (
    <>
      {/* Original document card traveling */}
      <div style={{
        position: 'absolute',
        left: cardX,
        top: rowY,
        height: cardH,
        opacity: docOpacity,
        transform: `scale(${pulseScale})`,
        display: 'flex', alignItems: 'center', gap: 10,
        backgroundColor: c.bgCard,
        borderRadius: 14,
        padding: v ? '10px 16px' : '12px 20px',
        border: `1px solid ${glow > 0.3 ? `rgba(96,165,250,${0.3 + glow * 0.3})` : c.strokeSoft}`,
        boxShadow: glow > 0
          ? `0 0 ${24 * glow}px rgba(96,165,250,${0.15 * glow}), 0 4px 12px rgba(0,0,0,0.1)`
          : '0 2px 6px rgba(0,0,0,0.08)',
        whiteSpace: 'nowrap',
        zIndex: 10,
      }}>
        <span style={{ fontSize: v ? 20 : 24 }}>{icon}</span>
        <span style={{ fontFamily: montserrat, fontSize: fs(14, v), fontWeight: 700, color: c.textStrong }}>{name}</span>
      </div>

      {/* Trailing particle trail from doc to center */}
      {t > 0.05 && t < 0.55 && Array.from({ length: 5 }).map((_, i) => {
        const trailT = Math.max(0, t - i * 0.03);
        const trailX = interpolate(trailT, [0, 0.3, 0.55], [leftEdge - 20, center - 60, center - 40], {
          extrapolateRight: 'clamp',
        });
        return (
          <div key={`trail-${i}`} style={{
            position: 'absolute',
            left: trailX + 60,
            top: rowY + cardH / 2 - 2,
            width: 4 - i * 0.5,
            height: 4 - i * 0.5,
            borderRadius: 2,
            backgroundColor: c.blue,
            opacity: (0.5 - i * 0.1) * interpolate(t, [0.05, 0.15, 0.5, 0.55], [0, 1, 1, 0]),
          }} />
        );
      })}

      {/* Result card emerging on the right */}
      <div style={{
        position: 'absolute',
        left: interpolate(resultScale, [0, 1], [center + 20, rightEdge - (v ? 220 : 280)]),
        top: rowY,
        height: cardH,
        opacity: resultOpacity,
        transform: `scale(${interpolate(resultScale, [0, 1], [0.9, 1])})`,
        display: 'flex', alignItems: 'center', gap: 10,
        backgroundColor: c.bgCard,
        borderRadius: 14,
        padding: v ? '10px 16px' : '12px 20px',
        border: `1px solid rgba(34,197,94,0.25)`,
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        whiteSpace: 'nowrap',
        zIndex: 10,
      }}>
        <div style={{
          width: v ? 28 : 32, height: v ? 28 : 32, borderRadius: v ? 8 : 9,
          backgroundColor: c.greenMuted, display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: c.green, fontWeight: 700, fontSize: v ? 14 : 16,
          transform: `scale(${resultScale})`,
        }}>✓</div>
        <div>
          <div style={{ fontFamily: montserrat, fontSize: fs(13, v), fontWeight: 700, color: c.textStrong }}>{name}</div>
          <div style={{ fontFamily: openSans, fontSize: fs(9, v), color: c.green }}>Analisado</div>
        </div>
      </div>
    </>
  );
};

export const ExamUploadScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const v = height > width;

  const titleWords = wordReveal('Envie e a IA Analisa', frame, fps, 0.15 * fps, 0.07);
  const maxW = v ? 950 : 1700;
  const pipeW = v ? 900 : 1500;

  // AI center zone
  const aiDelay = 0.7 * fps;
  const aiEntrance = scaleIn(frame, fps, aiDelay);
  const aiO = interpolate(frame, [aiDelay, aiDelay + 0.5 * fps], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const breathe = 0.96 + Math.sin(frame * 0.1) * 0.04;
  const ringRot = frame * 0.7;

  // Pipeline labels
  const labelsDelay = 0.5 * fps;
  const labelsR = reveal(frame, fps, labelsDelay, { y: 8 });

  // Summary
  const summaryDelay = 5 * fps;
  const summaryR = reveal(frame, fps, summaryDelay, { y: 12 });

  const aiCenterX = pipeW * 0.5;
  const pipeH = v ? 340 : 310;
  const orbSize = v ? 70 : 90;

  return (
    <AbsoluteFill style={{ backgroundColor: c.bg }}>
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse 40% 35% at 50% 50%, rgba(96,165,250,0.05), transparent)` }} />

      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: v ? '30px 16px' : '30px 30px', gap: v ? 16 : 20,
      }}>
        {/* Title */}
        <div style={{ maxWidth: maxW, textAlign: 'center' }}>
          <div style={{ ...reveal(frame, fps, 0), fontFamily: montserrat, fontSize: fs(12, v), fontWeight: 700, color: c.textSubtle, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 6 }}>
            Análise de Exames
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
            {titleWords.map((w, i) => (
              <span
                key={i}
                style={{
                  ...w.style,
                  fontFamily: montserrat,
                  fontSize: fs(38, v),
                  fontWeight: 700,
                  color: c.textStrong,
                  letterSpacing: -0.8,
                  marginRight: v ? 16 : 12,
                }}
              >
                {w.word}
              </span>
            ))}
          </div>
          <p style={{
            ...reveal(frame, fps, 0.4 * fps, { y: 8 }),
            fontFamily: openSans, fontSize: fs(16, v), color: c.textMuted, margin: 0, marginTop: 6,
          }}>
            Envie o exame em PDF ou foto — o resultado aparece em segundos.
          </p>
        </div>

        {/* Pipeline container */}
        <div style={{
          width: pipeW, maxWidth: '100%', height: pipeH,
          position: 'relative',
        }}>
          {/* Horizontal flow line */}
          <div style={{
            ...labelsR,
            position: 'absolute',
            left: 0, right: 0,
            top: -16,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '0 20px',
          }}>
            <span style={{ fontFamily: montserrat, fontSize: fs(10, v), fontWeight: 700, color: c.textSubtle, letterSpacing: 1.5, textTransform: 'uppercase' }}>Documento</span>
            <span style={{ fontFamily: montserrat, fontSize: fs(10, v), fontWeight: 700, color: c.blue, letterSpacing: 1.5, textTransform: 'uppercase' }}>Processamento IA</span>
            <span style={{ fontFamily: montserrat, fontSize: fs(10, v), fontWeight: 700, color: c.green, letterSpacing: 1.5, textTransform: 'uppercase' }}>Resultado</span>
          </div>

          {/* Dashed flow line behind everything */}
          <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1 }}>
            {[0, 1, 2].map(i => {
              const rowY = i * (v ? 100 : 90) + (v ? 26 : 30);
              return (
                <line key={i} x1={20} y1={rowY} x2={pipeW - 20} y2={rowY}
                  stroke={c.strokeSoft} strokeWidth={1} strokeDasharray="8 6"
                  opacity={interpolate(frame, [labelsDelay, labelsDelay + 0.4 * fps], [0, 0.5], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })}
                />
              );
            })}
          </svg>

          {/* AI center orb */}
          <div style={{
            position: 'absolute',
            left: aiCenterX - orbSize / 2,
            top: pipeH / 2 - orbSize / 2 - 10,
            width: orbSize, height: orbSize,
            opacity: aiO,
            transform: `scale(${interpolate(aiEntrance, [0, 1], [0.7, 1]) * breathe})`,
            zIndex: 5,
          }}>
            <div style={{
              width: '100%', height: '100%', borderRadius: '50%',
              background: `radial-gradient(circle at 40% 35%, rgba(96,165,250,0.15), ${c.bgCard})`,
              border: `2px solid rgba(96,165,250,0.3)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              position: 'relative',
              boxShadow: `0 0 ${28 + Math.sin(frame * 0.1) * 8}px rgba(96,165,250,0.12)`,
            }}>
              {/* Outer ring */}
              <div style={{
                position: 'absolute', inset: -6, borderRadius: '50%',
                border: '2px solid transparent',
                borderTopColor: c.blue,
                borderRightColor: 'rgba(96,165,250,0.2)',
                transform: `rotate(${ringRot}deg)`,
              }} />
              {/* Inner ring */}
              <div style={{
                position: 'absolute', inset: -12, borderRadius: '50%',
                border: '1.5px solid transparent',
                borderBottomColor: 'rgba(96,165,250,0.15)',
                borderLeftColor: 'rgba(96,165,250,0.08)',
                transform: `rotate(${-ringRot * 0.6}deg)`,
              }} />
              <span style={{ fontFamily: montserrat, fontSize: fs(16, v), fontWeight: 700, color: c.blue }}>IA</span>
            </div>
          </div>

          {/* Exam flow rows */}
          <ExamFlow name="Hemograma Completo" icon="🩸" delay={Math.round(1 * fps)} row={0} v={v} pipeW={pipeW} />
          <ExamFlow name="TSH e T4 Livre" icon="🧪" delay={Math.round(1.8 * fps)} row={1} v={v} pipeW={pipeW} />
          <ExamFlow name="Perfil Lipídico" icon="💉" delay={Math.round(2.6 * fps)} row={2} v={v} pipeW={pipeW} />
        </div>

        {/* Summary stats */}
        <div style={{
          ...summaryR, maxWidth: maxW, width: '100%',
          backgroundColor: c.bgCard, borderRadius: 16, padding: v ? '18px 24px' : '20px 32px',
          border: `1px solid ${c.strokeSoft}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: v ? 28 : 48,
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
