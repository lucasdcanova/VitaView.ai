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

const Metric: React.FC<{
  label: string; value: string; status: 'ok' | 'warn' | 'alert'; delay: number; icon: string; v: boolean;
}> = ({ label, value, status, delay, icon, v }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const s = scaleIn(frame, fps, delay);
  const o = interpolate(frame, [delay, delay + 0.3 * fps], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  const col = { ok: c.green, warn: c.amber, alert: c.red };
  const bg = { ok: c.greenMuted, warn: c.amberMuted, alert: c.redMuted };
  const txt = { ok: 'Normal', warn: 'Atenção', alert: 'Alterado' };

  return (
    <div style={{ opacity: o, transform: `scale(${interpolate(s, [0, 1], [0.92, 1])}) translateY(${interpolate(s, [0, 1], [12, 0])}px)`, backgroundColor: c.bgCard, borderRadius: 14, padding: v ? '12px 14px' : '16px 18px', border: `1px solid ${c.strokeSoft}`, display: 'flex', flexDirection: 'column', gap: 7 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: v ? 14 : 16 }}>{icon}</span>
        <span style={{ fontFamily: openSans, fontSize: fs(11, v), color: c.textMuted }}>{label}</span>
      </div>
      <div style={{ fontFamily: montserrat, fontSize: fs(24, v), fontWeight: 700, color: c.textStrong }}>{value}</div>
      <div style={{ backgroundColor: bg[status], borderRadius: 20, padding: '2px 9px', alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 4 }}>
        <div style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: col[status] }} />
        <span style={{ fontFamily: openSans, fontSize: fs(10, v), fontWeight: 600, color: col[status] }}>{txt[status]}</span>
      </div>
    </div>
  );
};

export const PatientCardScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const v = height > width;

  const titleWords = wordReveal('Visão Completa', frame, fps, 0.15 * fps, 0.08);
  const cardR = reveal(frame, fps, 0.3 * fps, { y: 14 });

  const chartProgress = interpolate(frame, [2.2 * fps, 3.8 * fps], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    easing: Easing.bezier(0.22, 1, 0.36, 1),
  });

  const data = [65, 72, 68, 80, 75, 90, 85, 92, 88, 95, 91, 89];
  const pad = v ? 70 : 80;
  const maxW = v ? 520 : 880;

  return (
    <AbsoluteFill style={{ backgroundColor: c.bg }}>
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse 60% 40% at 60% 40%, rgba(34,197,94,0.03), transparent)` }} />

      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: pad, gap: v ? 14 : 20 }}>
        {/* Title */}
        <div style={{ width: maxW }}>
          <div style={{ ...reveal(frame, fps, 0), fontFamily: montserrat, fontSize: fs(12, v), fontWeight: 700, color: c.textSubtle, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 6 }}>
            Painel do Paciente
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap' }}>
            {titleWords.map((w, i) => (
              <span key={i} style={{ ...w.style, fontFamily: montserrat, fontSize: fs(34, v), fontWeight: 700, color: c.textStrong, letterSpacing: -0.5 }}>{w.word}</span>
            ))}
          </div>
        </div>

        {/* Patient card */}
        <div style={{ ...cardR, width: maxW, backgroundColor: c.bgCard, borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.12)', padding: v ? '14px 16px' : '18px 22px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: v ? 42 : 50, height: v ? 42 : 50, borderRadius: v ? 21 : 25, backgroundColor: c.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: montserrat, fontSize: fs(20, v), fontWeight: 700, color: c.bg, flexShrink: 0 }}>MS</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: montserrat, fontSize: fs(20, v), fontWeight: 700, color: c.textStrong }}>Maria Silva</div>
            <div style={{ fontFamily: openSans, fontSize: fs(12, v), color: c.textMuted, marginTop: 1 }}>42 anos • Feminino • Particular</div>
          </div>
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            {['Hipertensão', 'Diabetes T2', 'Hipotireoidismo'].map((tag, i) => {
              const td = 0.65 * fps + i * 0.1 * fps;
              return (
                <div key={tag} style={{
                  ...reveal(frame, fps, td, { y: 6 }),
                  backgroundColor: c.bgSurface, borderRadius: 20, padding: '3px 10px',
                  fontFamily: openSans, fontSize: fs(10, v), fontWeight: 600, color: c.textDefault,
                }}>{tag}</div>
              );
            })}
          </div>
        </div>

        {/* Metrics */}
        <div style={{ width: maxW, display: 'grid', gridTemplateColumns: v ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)', gap: v ? 8 : 12 }}>
          <Metric label="Glicemia" value="142 mg/dL" status="warn" delay={Math.round(1.2 * fps)} icon="🩸" v={v} />
          <Metric label="Pressão" value="130/85" status="alert" delay={Math.round(1.35 * fps)} icon="💓" v={v} />
          <Metric label="TSH" value="3.2 mUI/L" status="ok" delay={Math.round(1.5 * fps)} icon="🧪" v={v} />
          <Metric label="HbA1c" value="7.1%" status="warn" delay={Math.round(1.65 * fps)} icon="📊" v={v} />
          <Metric label="Colesterol" value="198 mg/dL" status="ok" delay={Math.round(1.8 * fps)} icon="🫀" v={v} />
          <Metric label="Creatinina" value="0.9 mg/dL" status="ok" delay={Math.round(1.95 * fps)} icon="🔬" v={v} />
        </div>

        {/* Chart */}
        <div style={{
          width: maxW, backgroundColor: c.bgCard, borderRadius: 16,
          boxShadow: '0 2px 8px rgba(0,0,0,0.12)', padding: v ? '14px 16px' : '16px 22px',
          opacity: interpolate(frame, [2 * fps, 2.3 * fps], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
        }}>
          <div style={{ fontFamily: montserrat, fontSize: fs(13, v), fontWeight: 700, color: c.textStrong, marginBottom: 10 }}>
            Evolução da Glicemia (12 meses)
          </div>
          <svg width="100%" height={v ? 80 : 110} viewBox={`0 0 ${v ? 480 : 840} ${v ? 80 : 110}`} preserveAspectRatio="none">
            {[0, v ? 40 : 55, v ? 80 : 110].map(y => <line key={y} x1={0} y1={y} x2={v ? 850 : 1060} y2={y} stroke={c.strokeSoft} strokeWidth={1} />)}
            <polyline
              points={data.map((val, i) => {
                const cW = v ? 440 : 800; const cH = v ? 64 : 90;
                const x = (i / (data.length - 1)) * cW + 20;
                const y = cH - ((val - 60) / 40) * cH + 10;
                return `${x},${y}`;
              }).slice(0, Math.ceil(data.length * chartProgress)).join(' ')}
              fill="none" stroke={c.textDefault} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"
            />
            {data.slice(0, Math.ceil(data.length * chartProgress)).map((val, i) => {
              const cW = v ? 440 : 800; const cH = v ? 64 : 90;
              const x = (i / (data.length - 1)) * cW + 20;
              const y = cH - ((val - 60) / 40) * cH + 10;
              const ds = spring({ frame, fps, delay: 2.2 * fps + i * 0.05 * fps, config: { damping: 14, stiffness: 140 } });
              return <circle key={i} cx={x} cy={y} r={3.5 * ds} fill={c.bgCard} stroke={c.textDefault} strokeWidth={2} />;
            })}
          </svg>
        </div>
      </div>
    </AbsoluteFill>
  );
};
