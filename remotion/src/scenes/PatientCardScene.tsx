import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
} from 'remotion';
import { colors, SPRING_SMOOTH, SPRING_GENTLE } from '../theme';
import { montserrat, openSans } from '../fonts';

const MetricCard: React.FC<{
  label: string;
  value: string;
  status: 'normal' | 'alert' | 'warning';
  delay: number;
  icon: string;
  isVertical: boolean;
}> = ({ label, value, status, delay, icon, isVertical }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const entrance = spring({ frame, fps, delay, config: SPRING_GENTLE });
  const opacity = interpolate(frame, [delay, delay + 0.25 * fps], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  const statusColor = status === 'alert' ? colors.alertRed : status === 'warning' ? colors.amber500 : colors.green600;
  const statusBg = status === 'alert' ? 'rgba(211,47,47,0.07)' : status === 'warning' ? 'rgba(245,158,11,0.07)' : 'rgba(22,163,106,0.07)';

  return (
    <div
      style={{
        opacity,
        transform: `scale(${interpolate(entrance, [0, 1], [0.9, 1])}) translateY(${interpolate(entrance, [0, 1], [16, 0])}px)`,
        backgroundColor: colors.pureWhite,
        borderRadius: 14,
        padding: isVertical ? '14px 16px' : '18px 20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
        border: `1px solid ${colors.strokeSoft}`,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        <span style={{ fontSize: isVertical ? 16 : 18 }}>{icon}</span>
        <span style={{ fontFamily: openSans, fontSize: 12, color: colors.contentMuted }}>{label}</span>
      </div>
      <div style={{ fontFamily: montserrat, fontSize: isVertical ? 22 : 26, fontWeight: 700, color: colors.charcoal }}>{value}</div>
      <div style={{ backgroundColor: statusBg, borderRadius: 20, padding: '3px 10px', alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 5 }}>
        <div style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: statusColor }} />
        <span style={{ fontFamily: openSans, fontSize: 11, fontWeight: 600, color: statusColor }}>
          {status === 'normal' ? 'Normal' : status === 'alert' ? 'Alterado' : 'Atencao'}
        </span>
      </div>
    </div>
  );
};

export const PatientCardScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const isVertical = height > width;

  const titleSpring = spring({ frame, fps, config: SPRING_SMOOTH });
  const titleOpacity = interpolate(frame, [0, 0.4 * fps], [0, 1], { extrapolateRight: 'clamp' });

  const cardSpring = spring({ frame, fps, delay: 0.3 * fps, config: SPRING_SMOOTH });
  const cardOpacity = interpolate(frame, [0.3 * fps, 0.6 * fps], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  const chartProgress = interpolate(frame, [2.2 * fps, 3.8 * fps], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.22, 1, 0.36, 1),
  });

  const chartData = [65, 72, 68, 80, 75, 90, 85, 92, 88, 95, 91, 89];
  const pad = isVertical ? 50 : 120;
  const maxW = isVertical ? width - 100 : 1200;

  return (
    <AbsoluteFill style={{ backgroundColor: colors.surface0 }}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: pad,
          gap: isVertical ? 18 : 24,
        }}
      >
        {/* Title */}
        <div style={{ width: maxW, opacity: titleOpacity, transform: `translateY(${interpolate(titleSpring, [0, 1], [20, 0])}px)` }}>
          <div style={{ fontFamily: montserrat, fontSize: 13, fontWeight: 700, color: colors.mediumGray, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 8 }}>
            Painel do Paciente
          </div>
          <div style={{ fontFamily: montserrat, fontSize: isVertical ? 30 : 38, fontWeight: 700, color: colors.charcoal, letterSpacing: -1 }}>
            Visao Completa
          </div>
        </div>

        {/* Patient card */}
        <div
          style={{
            width: maxW,
            opacity: cardOpacity,
            transform: `translateY(${interpolate(cardSpring, [0, 1], [14, 0])}px)`,
            backgroundColor: colors.pureWhite,
            borderRadius: 16,
            boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
            padding: isVertical ? '18px 20px' : '22px 26px',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <div style={{ width: isVertical ? 48 : 56, height: isVertical ? 48 : 56, borderRadius: isVertical ? 24 : 28, backgroundColor: colors.charcoal, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: montserrat, fontSize: isVertical ? 18 : 22, fontWeight: 700, color: colors.pureWhite, flexShrink: 0 }}>
            MS
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: montserrat, fontSize: isVertical ? 18 : 22, fontWeight: 700, color: colors.charcoal }}>Maria Silva</div>
            <div style={{ fontFamily: openSans, fontSize: isVertical ? 12 : 13, color: colors.contentMuted, marginTop: 2 }}>42 anos • Feminino • Particular</div>
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            {['Hipertensao', 'Diabetes T2', 'Hipotireoidismo'].map((tag, i) => {
              const td = 0.7 * fps + i * 0.12 * fps;
              const ts = spring({ frame, fps, delay: td, config: SPRING_SMOOTH });
              return (
                <div key={tag} style={{
                  opacity: interpolate(frame, [td, td + 0.2 * fps], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
                  transform: `scale(${interpolate(ts, [0, 1], [0.85, 1])})`,
                  backgroundColor: colors.surface2, borderRadius: 20, padding: '4px 12px', fontFamily: openSans, fontSize: 11, fontWeight: 600, color: colors.contentDefault,
                }}>{tag}</div>
              );
            })}
          </div>
        </div>

        {/* Metrics grid */}
        <div style={{ width: maxW, display: 'grid', gridTemplateColumns: isVertical ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)', gap: isVertical ? 10 : 14 }}>
          <MetricCard label="Glicemia" value="142 mg/dL" status="warning" delay={Math.round(1.2 * fps)} icon="🩸" isVertical={isVertical} />
          <MetricCard label="Pressao" value="130/85" status="alert" delay={Math.round(1.35 * fps)} icon="💓" isVertical={isVertical} />
          <MetricCard label="TSH" value="3.2 mUI/L" status="normal" delay={Math.round(1.5 * fps)} icon="🧪" isVertical={isVertical} />
          <MetricCard label="HbA1c" value="7.1%" status="warning" delay={Math.round(1.65 * fps)} icon="📊" isVertical={isVertical} />
          <MetricCard label="Colesterol" value="198 mg/dL" status="normal" delay={Math.round(1.8 * fps)} icon="🫀" isVertical={isVertical} />
          <MetricCard label="Creatinina" value="0.9 mg/dL" status="normal" delay={Math.round(1.95 * fps)} icon="🔬" isVertical={isVertical} />
        </div>

        {/* Chart */}
        <div
          style={{
            width: maxW,
            backgroundColor: colors.pureWhite,
            borderRadius: 16,
            boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
            padding: isVertical ? '16px 18px' : '18px 24px',
            opacity: interpolate(frame, [2 * fps, 2.3 * fps], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
          }}
        >
          <div style={{ fontFamily: montserrat, fontSize: 14, fontWeight: 700, color: colors.charcoal, marginBottom: 12 }}>
            Evolucao da Glicemia (12 meses)
          </div>
          <svg width="100%" height={isVertical ? 100 : 130} viewBox={`0 0 ${isVertical ? 900 : 1150} ${isVertical ? 100 : 130}`} preserveAspectRatio="none">
            {[0, isVertical ? 50 : 65, isVertical ? 100 : 130].map((y) => (
              <line key={y} x1={0} y1={y} x2={isVertical ? 900 : 1150} y2={y} stroke={colors.strokeSoft} strokeWidth={1} />
            ))}
            <polyline
              points={chartData
                .map((val, i) => {
                  const chartW = isVertical ? 860 : 1110;
                  const chartH = isVertical ? 80 : 110;
                  const x = (i / (chartData.length - 1)) * chartW + 20;
                  const y = chartH - ((val - 60) / 40) * chartH + 10;
                  return `${x},${y}`;
                })
                .slice(0, Math.ceil(chartData.length * chartProgress))
                .join(' ')}
              fill="none"
              stroke={colors.charcoal}
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {chartData.slice(0, Math.ceil(chartData.length * chartProgress)).map((val, i) => {
              const chartW = isVertical ? 860 : 1110;
              const chartH = isVertical ? 80 : 110;
              const x = (i / (chartData.length - 1)) * chartW + 20;
              const y = chartH - ((val - 60) / 40) * chartH + 10;
              const dd = 2.2 * fps + i * 0.06 * fps;
              const ds = spring({ frame, fps, delay: dd, config: { damping: 14, stiffness: 140 } });
              return <circle key={i} cx={x} cy={y} r={4 * ds} fill={colors.pureWhite} stroke={colors.charcoal} strokeWidth={2} />;
            })}
          </svg>
        </div>
      </div>
    </AbsoluteFill>
  );
};
