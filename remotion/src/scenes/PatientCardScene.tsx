import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
} from 'remotion';
import { colors } from '../theme';
import { montserrat, openSans } from '../fonts';

const MetricCard: React.FC<{
  label: string;
  value: string;
  status: 'normal' | 'alert' | 'warning';
  delay: number;
  icon: string;
}> = ({ label, value, status, delay, icon }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const entrance = spring({ frame, fps, delay, config: { damping: 15, stiffness: 140 } });
  const opacity = interpolate(frame, [delay, delay + 0.2 * fps], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const statusColor = status === 'alert' ? colors.alertRed
    : status === 'warning' ? colors.amber500
    : colors.green600;
  const statusBg = status === 'alert' ? 'rgba(211,47,47,0.08)'
    : status === 'warning' ? 'rgba(245,158,11,0.08)'
    : 'rgba(22,163,106,0.08)';

  return (
    <div
      style={{
        opacity,
        transform: `scale(${interpolate(entrance, [0, 1], [0.85, 1])}) translateY(${interpolate(entrance, [0, 1], [20, 0])}px)`,
        backgroundColor: colors.pureWhite,
        borderRadius: 14,
        padding: '20px 22px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
        border: `1px solid ${colors.strokeSoft}`,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        minWidth: 180,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 20 }}>{icon}</span>
        <span style={{ fontFamily: openSans, fontSize: 13, color: colors.contentMuted }}>
          {label}
        </span>
      </div>
      <div style={{ fontFamily: montserrat, fontSize: 28, fontWeight: 700, color: colors.charcoal }}>
        {value}
      </div>
      <div
        style={{
          backgroundColor: statusBg,
          borderRadius: 20,
          padding: '4px 12px',
          alignSelf: 'flex-start',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <div style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: statusColor }} />
        <span style={{ fontFamily: openSans, fontSize: 12, fontWeight: 600, color: statusColor, textTransform: 'capitalize' }}>
          {status === 'normal' ? 'Normal' : status === 'alert' ? 'Alterado' : 'Atencao'}
        </span>
      </div>
    </div>
  );
};

export const PatientCardScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOpacity = interpolate(frame, [0, 0.3 * fps], [0, 1], { extrapolateRight: 'clamp' });
  const titleY = interpolate(
    spring({ frame, fps, config: { damping: 200 } }),
    [0, 1],
    [20, 0],
  );

  // Patient card entrance
  const cardSpring = spring({ frame, fps, delay: 0.3 * fps, config: { damping: 200 } });
  const cardOpacity = interpolate(frame, [0.3 * fps, 0.6 * fps], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Chart animation
  const chartProgress = interpolate(frame, [2 * fps, 3.5 * fps], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.quad),
  });

  // Chart data points
  const chartData = [65, 72, 68, 80, 75, 90, 85, 92, 88, 95, 91, 89];

  return (
    <AbsoluteFill style={{ backgroundColor: colors.surface0 }}>
      {/* Title */}
      <div
        style={{
          position: 'absolute',
          top: 40,
          left: 60,
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
        }}
      >
        <div style={{ fontFamily: montserrat, fontSize: 14, fontWeight: 700, color: colors.mediumGray, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 8 }}>
          Painel do Paciente
        </div>
        <div style={{ fontFamily: montserrat, fontSize: 42, fontWeight: 700, color: colors.charcoal, letterSpacing: -1 }}>
          Visao Completa
        </div>
      </div>

      {/* Patient info card */}
      <div
        style={{
          position: 'absolute',
          left: 60,
          top: 180,
          width: 460,
          opacity: cardOpacity,
          transform: `translateX(${interpolate(cardSpring, [0, 1], [30, 0])}px)`,
          backgroundColor: colors.pureWhite,
          borderRadius: 16,
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
          padding: 28,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 24 }}>
          {/* Avatar */}
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: colors.charcoal,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: montserrat,
              fontSize: 24,
              fontWeight: 700,
              color: colors.pureWhite,
            }}
          >
            MS
          </div>
          <div>
            <div style={{ fontFamily: montserrat, fontSize: 24, fontWeight: 700, color: colors.charcoal }}>
              Maria Silva
            </div>
            <div style={{ fontFamily: openSans, fontSize: 14, color: colors.contentMuted, marginTop: 2 }}>
              42 anos • Feminino • Particular
            </div>
          </div>
        </div>

        {/* Quick info badges */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {['Hipertensao', 'Diabetes tipo 2', 'Hipotireoidismo'].map((tag, i) => {
            const tagDelay = 0.8 * fps + i * 0.12 * fps;
            const tagSpring = spring({ frame, fps, delay: tagDelay, config: { damping: 200 } });
            return (
              <div
                key={tag}
                style={{
                  opacity: interpolate(frame, [tagDelay, tagDelay + 0.15 * fps], [0, 1], {
                    extrapolateLeft: 'clamp',
                    extrapolateRight: 'clamp',
                  }),
                  transform: `scale(${interpolate(tagSpring, [0, 1], [0.8, 1])})`,
                  backgroundColor: colors.surface2,
                  borderRadius: 20,
                  padding: '6px 14px',
                  fontFamily: openSans,
                  fontSize: 13,
                  fontWeight: 600,
                  color: colors.contentDefault,
                }}
              >
                {tag}
              </div>
            );
          })}
        </div>
      </div>

      {/* Metrics grid */}
      <div
        style={{
          position: 'absolute',
          left: 560,
          top: 180,
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 16,
          width: 620,
        }}
      >
        <MetricCard label="Glicemia" value="142 mg/dL" status="warning" delay={1.2 * fps} icon="🩸" />
        <MetricCard label="Pressao" value="130/85" status="alert" delay={1.4 * fps} icon="💓" />
        <MetricCard label="TSH" value="3.2 mUI/L" status="normal" delay={1.6 * fps} icon="🧪" />
        <MetricCard label="HbA1c" value="7.1%" status="warning" delay={1.8 * fps} icon="📊" />
        <MetricCard label="Colesterol" value="198 mg/dL" status="normal" delay={2.0 * fps} icon="🫀" />
        <MetricCard label="Creatinina" value="0.9 mg/dL" status="normal" delay={2.2 * fps} icon="🔬" />
      </div>

      {/* Evolution chart */}
      <div
        style={{
          position: 'absolute',
          left: 60,
          bottom: 40,
          width: 1120,
          height: 240,
          backgroundColor: colors.pureWhite,
          borderRadius: 16,
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
          padding: '20px 28px',
        }}
      >
        <div style={{ fontFamily: montserrat, fontSize: 16, fontWeight: 700, color: colors.charcoal, marginBottom: 16 }}>
          Evolucao da Glicemia (12 meses)
        </div>

        {/* Simple line chart */}
        <svg width="1060" height="160" viewBox="0 0 1060 160">
          {/* Grid lines */}
          {[0, 40, 80, 120, 160].map((y) => (
            <line
              key={y}
              x1={0}
              y1={y}
              x2={1060}
              y2={y}
              stroke={colors.strokeSoft}
              strokeWidth={1}
            />
          ))}

          {/* Data line */}
          <polyline
            points={chartData
              .map((val, i) => {
                const x = (i / (chartData.length - 1)) * 1020 + 20;
                const y = 160 - ((val - 60) / 40) * 140;
                return `${x},${y}`;
              })
              .slice(0, Math.ceil(chartData.length * chartProgress))
              .join(' ')}
            fill="none"
            stroke={colors.charcoal}
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data dots */}
          {chartData.slice(0, Math.ceil(chartData.length * chartProgress)).map((val, i) => {
            const x = (i / (chartData.length - 1)) * 1020 + 20;
            const y = 160 - ((val - 60) / 40) * 140;
            const dotDelay = 2 * fps + i * 0.08 * fps;
            const dotScale = spring({ frame, fps, delay: dotDelay, config: { damping: 15 } });
            return (
              <circle
                key={i}
                cx={x}
                cy={y}
                r={5 * dotScale}
                fill={colors.pureWhite}
                stroke={colors.charcoal}
                strokeWidth={2.5}
              />
            );
          })}
        </svg>
      </div>
    </AbsoluteFill>
  );
};
