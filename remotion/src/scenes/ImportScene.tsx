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

// Animated floating data particles migrating from left to right
const DataParticle: React.FC<{
  y: number; delay: number; size: number; duration: number; startX: number; endX: number;
}> = ({ y, delay, size, duration, startX, endX }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const t = interpolate(frame, [delay, delay + duration * fps], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    easing: Easing.bezier(0.4, 0, 0.2, 1),
  });

  const x = interpolate(t, [0, 1], [startX, endX]);
  const opacity = interpolate(t, [0, 0.1, 0.85, 1], [0, 0.7, 0.7, 0]);
  const glow = interpolate(t, [0, 0.5, 1], [0, 1, 0]);

  return (
    <div style={{
      position: 'absolute',
      left: x,
      top: y,
      width: size,
      height: size,
      borderRadius: size / 2,
      backgroundColor: c.green,
      opacity,
      boxShadow: `0 0 ${8 * glow}px ${c.greenMuted}`,
    }} />
  );
};

// The "old system" card on left
const OldSystemCard: React.FC<{ delay: number; v: boolean }> = ({ delay, v }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const r = reveal(frame, fps, delay, { y: 16 });

  // Items fading out one by one
  const items = ['Maria Silva, 42a', 'João Santos, 67a', 'Ana Costa, 35a', 'Pedro Lima, 51a', 'Clara Nunes, 28a'];

  return (
    <div style={{
      ...r,
      backgroundColor: c.bgCard,
      borderRadius: 16,
      border: `1px solid ${c.strokeSoft}`,
      padding: v ? '16px 16px' : '20px 22px',
      width: '100%',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <div style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: c.textSubtle }} />
        <div style={{ fontFamily: montserrat, fontSize: fs(14, v), fontWeight: 700, color: c.textMuted }}>
          Seu prontuário atual
        </div>
      </div>

      {items.map((item, i) => {
        // Each item fades out as it "migrates"
        const migrateStart = delay + 1.2 * fps + i * 0.35 * fps;
        const itemOpacity = interpolate(frame, [migrateStart, migrateStart + 0.4 * fps], [1, 0.15], {
          extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
        });
        const itemX = interpolate(frame, [migrateStart, migrateStart + 0.4 * fps], [0, 8], {
          extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
          easing: Easing.out(Easing.quad),
        });

        return (
          <div key={i} style={{
            opacity: itemOpacity,
            transform: `translateX(${itemX}px)`,
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '7px 0', borderBottom: i < items.length - 1 ? `1px solid ${c.strokeSoft}` : 'none',
          }}>
            <div style={{
              width: v ? 28 : 32, height: v ? 28 : 32, borderRadius: v ? 14 : 16,
              backgroundColor: c.bgSurface, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: montserrat, fontSize: fs(10, v), fontWeight: 700, color: c.textSubtle,
            }}>
              {item.split(' ')[0][0]}{item.split(' ')[1]?.[0] || ''}
            </div>
            <div style={{ fontFamily: openSans, fontSize: fs(13, v), color: c.textDefault }}>{item}</div>
          </div>
        );
      })}
    </div>
  );
};

// The "VitaView" card on right, filling up
const VitaViewCard: React.FC<{ delay: number; v: boolean }> = ({ delay, v }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const r = reveal(frame, fps, delay, { y: 16 });

  const items = ['Maria Silva, 42a', 'João Santos, 67a', 'Ana Costa, 35a', 'Pedro Lima, 51a', 'Clara Nunes, 28a'];

  return (
    <div style={{
      ...r,
      backgroundColor: c.bgCard,
      borderRadius: 16,
      border: `1px solid rgba(34,197,94,0.2)`,
      padding: v ? '16px 16px' : '20px 22px',
      width: '100%',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <div style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: c.green }} />
        <div style={{ fontFamily: montserrat, fontSize: fs(14, v), fontWeight: 700, color: c.green }}>
          VitaView
        </div>
      </div>

      {items.map((item, i) => {
        // Each item appears as it "arrives"
        const arriveStart = delay + 1.5 * fps + i * 0.35 * fps;
        const itemSpring = spring({ frame, fps, delay: arriveStart, config: S.smooth });
        const itemOpacity = interpolate(frame, [arriveStart, arriveStart + 0.3 * fps], [0, 1], {
          extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
        });

        return (
          <div key={i} style={{
            opacity: itemOpacity,
            transform: `translateX(${interpolate(itemSpring, [0, 1], [-10, 0])}px)`,
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '7px 0', borderBottom: i < items.length - 1 ? `1px solid ${c.strokeSoft}` : 'none',
          }}>
            <div style={{
              width: v ? 28 : 32, height: v ? 28 : 32, borderRadius: v ? 14 : 16,
              backgroundColor: c.greenMuted, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: montserrat, fontSize: fs(10, v), fontWeight: 700, color: c.green,
            }}>
              {item.split(' ')[0][0]}{item.split(' ')[1]?.[0] || ''}
            </div>
            <div style={{ flex: 1, fontFamily: openSans, fontSize: fs(13, v), color: c.textDefault }}>{item}</div>
            {itemOpacity > 0.5 && (
              <span style={{
                fontFamily: montserrat, fontSize: 10, fontWeight: 700, color: c.green,
                opacity: interpolate(frame, [arriveStart + 0.2 * fps, arriveStart + 0.4 * fps], [0, 1], {
                  extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
                }),
              }}>✓</span>
            )}
          </div>
        );
      })}
    </div>
  );
};

// Counter stat
const StatCounter: React.FC<{
  label: string; target: number; delay: number; v: boolean;
}> = ({ label, target, delay, v }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const r = reveal(frame, fps, delay, { y: 10 });
  const count = Math.floor(interpolate(frame, [delay + 0.2 * fps, delay + 2.5 * fps], [0, target], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    easing: Easing.bezier(0.22, 1, 0.36, 1),
  }));

  return (
    <div style={{ ...r, textAlign: 'center' }}>
      <div style={{ fontFamily: montserrat, fontSize: fs(36, v), fontWeight: 700, color: c.textStrong }}>
        {count.toLocaleString('pt-BR')}
      </div>
      <div style={{ fontFamily: openSans, fontSize: fs(13, v), color: c.textMuted, marginTop: 2 }}>{label}</div>
    </div>
  );
};

export const ImportScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const v = height > width;

  const titleWords = wordReveal('Traga Todo Seu Prontuário.', frame, fps, 0.15 * fps, 0.06);
  const subR = reveal(frame, fps, 0.6 * fps, { y: 12 });

  const maxW = v ? 680 : 1200;

  // Arrow animation between cards
  const arrowDelay = 1 * fps;
  const arrowProgress = interpolate(frame, [arrowDelay, arrowDelay + 0.6 * fps], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    easing: Easing.bezier(0.22, 1, 0.36, 1),
  });

  return (
    <AbsoluteFill style={{ backgroundColor: c.bg }}>
      {/* Soft green ambient glow */}
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse 40% 35% at 65% 50%, rgba(34,197,94,0.04), transparent)` }} />

      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: v ? '60px 24px' : '50px 60px', gap: v ? 24 : 20,
      }}>
        {/* Title */}
        <div style={{ maxWidth: maxW, textAlign: 'center' }}>
          <div style={{ ...reveal(frame, fps, 0), fontFamily: montserrat, fontSize: fs(12, v), fontWeight: 700, color: c.textSubtle, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 10 }}>
            Importação de Prontuário
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
            {titleWords.map((w, i) => (
              <span key={i} style={{ ...w.style, fontFamily: montserrat, fontSize: fs(38, v), fontWeight: 700, color: c.textStrong, letterSpacing: -0.8, lineHeight: 1.15 }}>{w.word}</span>
            ))}
          </div>
          <p style={{ ...subR, fontFamily: openSans, fontSize: fs(17, v), color: c.textMuted, margin: 0, marginTop: 10, lineHeight: 1.5 }}>
            Importe pacientes, consultas e histórico completo — sem perder uma vírgula.
          </p>
        </div>

        {/* Migration visual: Old system → arrow → VitaView */}
        <div style={{
          maxWidth: maxW, width: '100%',
          display: 'flex', flexDirection: v ? 'column' : 'row',
          alignItems: 'center', gap: v ? 12 : 0,
        }}>
          {/* Old system card */}
          <div style={{ flex: 1, width: v ? '100%' : undefined }}>
            <OldSystemCard delay={0.8 * fps} v={v} />
          </div>

          {/* Arrow / connection */}
          <div style={{
            width: v ? 40 : 80, height: v ? 40 : 'auto',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
            transform: v ? 'rotate(90deg)' : 'none',
          }}>
            <svg width="60" height="24" viewBox="0 0 60 24" style={{ opacity: arrowProgress }}>
              <line x1="0" y1="12" x2={44 * arrowProgress} y2="12" stroke={c.green} strokeWidth="2" strokeDasharray="5 3" />
              {arrowProgress > 0.8 && <polygon points="44,7 56,12 44,17" fill={c.green} opacity={interpolate(arrowProgress, [0.8, 1], [0, 1])} />}
            </svg>
          </div>

          {/* VitaView card */}
          <div style={{ flex: 1, width: v ? '100%' : undefined }}>
            <VitaViewCard delay={0.8 * fps} v={v} />
          </div>
        </div>

        {/* Counters row */}
        <div style={{
          maxWidth: maxW, width: '100%',
          display: 'flex', justifyContent: 'center', gap: v ? 30 : 50,
          marginTop: v ? 8 : 12,
        }}>
          <StatCounter label="Pacientes migrados" target={1847} delay={3.5 * fps} v={v} />
          <div style={{ width: 1, backgroundColor: c.strokeSoft, alignSelf: 'stretch', opacity: interpolate(frame, [3.5 * fps, 3.8 * fps], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) }} />
          <StatCounter label="Consultas preservadas" target={12453} delay={3.7 * fps} v={v} />
          <div style={{ width: 1, backgroundColor: c.strokeSoft, alignSelf: 'stretch', opacity: interpolate(frame, [3.7 * fps, 4 * fps], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) }} />
          <StatCounter label="Zero dados perdidos" target={0} delay={3.9 * fps} v={v} />
        </div>
      </div>

      {/* Floating particles (landscape only) */}
      {!v && Array.from({ length: 8 }).map((_, i) => (
        <DataParticle
          key={i}
          y={300 + i * 55}
          delay={1.5 * fps + i * 0.25 * fps}
          size={4 + (i % 3) * 2}
          duration={1.2}
          startX={width * 0.32}
          endX={width * 0.62}
        />
      ))}
    </AbsoluteFill>
  );
};
