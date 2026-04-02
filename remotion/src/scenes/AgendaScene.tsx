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
import { colors, SPRING_SMOOTH, SPRING_GENTLE } from '../theme';
import { montserrat, openSans } from '../fonts';

const TimeSlot: React.FC<{
  time: string;
  delay: number;
  occupied?: boolean;
  patientName?: string;
  type?: string;
  isClicked?: boolean;
  clickFrame?: number;
  isVertical: boolean;
}> = ({ time, delay, occupied, patientName, type, isClicked, clickFrame = 0, isVertical }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const slideIn = spring({ frame, fps, delay, config: SPRING_SMOOTH });
  const opacity = interpolate(slideIn, [0, 1], [0, 1]);
  const y = interpolate(slideIn, [0, 1], [14, 0]);

  const clickProgress = isClicked
    ? spring({ frame, fps, delay: clickFrame, config: SPRING_GENTLE })
    : 0;

  const typeColors: Record<string, string> = {
    consulta: colors.charcoal,
    retorno: colors.blue500,
    exames: colors.amber500,
  };

  return (
    <div
      style={{
        display: 'flex',
        gap: 16,
        opacity,
        transform: `translateY(${y}px) scale(${isClicked ? interpolate(clickProgress, [0, 1], [1, 0.97]) : 1})`,
        alignItems: 'stretch',
        minHeight: isVertical ? 56 : 64,
      }}
    >
      <div style={{ width: isVertical ? 58 : 72, fontFamily: montserrat, fontSize: isVertical ? 17 : 20, fontWeight: 700, color: colors.charcoal, textAlign: 'right', paddingTop: 6 }}>
        {time}
      </div>
      <div
        style={{
          flex: 1,
          borderRadius: 12,
          padding: isVertical ? '10px 16px' : '12px 18px',
          ...(occupied
            ? { backgroundColor: colors.pureWhite, borderLeft: `3px solid ${typeColors[type || 'consulta'] || colors.charcoal}`, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }
            : {
                border: `2px dashed ${clickProgress > 0.5 ? colors.charcoal : colors.lightGray}`,
                backgroundColor: clickProgress > 0.5 ? 'rgba(33,33,33,0.02)' : 'transparent',
              }),
        }}
      >
        {occupied ? (
          <div>
            <div style={{ fontFamily: montserrat, fontSize: isVertical ? 14 : 16, fontWeight: 700, color: colors.charcoal }}>{patientName}</div>
            <div style={{ fontFamily: openSans, fontSize: 12, color: colors.contentMuted, marginTop: 1, textTransform: 'capitalize' }}>{type}</div>
          </div>
        ) : (
          <div style={{ fontFamily: openSans, fontSize: 13, color: colors.mediumGray, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 16 }}>+</span> Disponivel
          </div>
        )}
      </div>
    </div>
  );
};

const AppointmentModal: React.FC<{ isVertical: boolean }> = ({ isVertical }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const modalSpring = spring({ frame, fps, config: SPRING_GENTLE });
  const modalOpacity = interpolate(frame, [0, 0.3 * fps], [0, 1], { extrapolateRight: 'clamp' });

  const f = (delay: number) => {
    const s = spring({ frame, fps, delay, config: SPRING_SMOOTH });
    const o = interpolate(frame, [delay, delay + 0.2 * fps], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
    return { opacity: o, transform: `translateY(${interpolate(s, [0, 1], [12, 0])}px)` };
  };

  const highlightPulse = frame > 1.2 * fps
    ? interpolate(frame - 1.2 * fps, [0, 0.4 * fps, 0.8 * fps], [0, 1, 0.6], { extrapolateRight: 'clamp' })
    : 0;

  const w = isVertical ? 360 : 380;

  return (
    <div
      style={{
        transform: `scale(${interpolate(modalSpring, [0, 1], [0.92, 1])})`,
        opacity: modalOpacity,
        width: w,
        backgroundColor: colors.pureWhite,
        borderRadius: 16,
        boxShadow: '0 20px 50px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.04)',
        overflow: 'hidden',
      }}
    >
      <div style={{ padding: '22px 24px 14px', borderBottom: `1px solid ${colors.strokeSoft}` }}>
        <div style={{ fontFamily: montserrat, fontSize: 20, fontWeight: 700, color: colors.charcoal }}>Novo Agendamento</div>
        <div style={{ fontFamily: openSans, fontSize: 13, color: colors.contentMuted, marginTop: 3 }}>Agende uma consulta ou bloqueie um horario.</div>
      </div>

      <div style={{ padding: '18px 24px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={f(0.2 * fps)}>
          <div style={{ fontFamily: montserrat, fontSize: 12, fontWeight: 700, color: colors.charcoal, marginBottom: 5 }}>Paciente</div>
          <div style={{ border: `1px solid ${colors.strokeDefault}`, borderRadius: 8, padding: '9px 13px', fontFamily: openSans, fontSize: 13, color: colors.mediumGray, display: 'flex', justifyContent: 'space-between' }}>
            Selecione o paciente <span style={{ fontSize: 9, color: colors.lightGray }}>▼</span>
          </div>
        </div>

        <div style={f(0.35 * fps)}>
          <div
            style={{
              border: `1px solid ${highlightPulse > 0.3 ? colors.green500 : colors.strokeDefault}`,
              borderRadius: 8,
              padding: '9px 13px',
              backgroundColor: `rgba(34,197,94,${0.03 + highlightPulse * 0.06})`,
              fontFamily: montserrat,
              fontSize: 13,
              fontWeight: 600,
              color: colors.green600,
              display: 'flex',
              alignItems: 'center',
              gap: 7,
            }}
          >
            <span style={{ fontSize: 16 }}>+</span> Novo Paciente
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, ...f(0.5 * fps) }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: montserrat, fontSize: 12, fontWeight: 700, color: colors.charcoal, marginBottom: 5 }}>Horario</div>
            <div style={{ border: `1px solid ${colors.strokeDefault}`, borderRadius: 8, padding: '9px 13px', fontFamily: openSans, fontSize: 13, color: colors.charcoal, fontWeight: 600 }}>14:00</div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: montserrat, fontSize: 12, fontWeight: 700, color: colors.charcoal, marginBottom: 5 }}>Tipo</div>
            <div style={{ border: `1px solid ${colors.strokeDefault}`, borderRadius: 8, padding: '9px 13px', fontFamily: openSans, fontSize: 13, color: colors.charcoal }}>Consulta</div>
          </div>
        </div>

        <div style={f(0.65 * fps)}>
          <div style={{ backgroundColor: colors.charcoal, borderRadius: 8, padding: '13px 18px', fontFamily: montserrat, fontSize: 14, fontWeight: 700, color: colors.pureWhite, textAlign: 'center' }}>
            Agendar Consulta
          </div>
        </div>
      </div>
    </div>
  );
};

export const AgendaScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const isVertical = height > width;

  const titleSpring = spring({ frame, fps, config: SPRING_SMOOTH });
  const titleOpacity = interpolate(frame, [0, 0.4 * fps], [0, 1], { extrapolateRight: 'clamp' });

  const pad = isVertical ? 50 : 160;
  const slotsWidth = isVertical ? width - 100 : 500;

  return (
    <AbsoluteFill style={{ backgroundColor: colors.surface0 }}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: isVertical ? 'column' : 'row',
          alignItems: 'center',
          justifyContent: 'center',
          padding: pad,
          gap: isVertical ? 24 : 50,
        }}
      >
        {/* Left: title + slots */}
        <div style={{ width: slotsWidth, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ opacity: titleOpacity, transform: `translateY(${interpolate(titleSpring, [0, 1], [20, 0])}px)` }}>
            <div style={{ fontFamily: montserrat, fontSize: 13, fontWeight: 700, color: colors.mediumGray, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 8 }}>
              Agenda Inteligente
            </div>
            <div style={{ fontFamily: montserrat, fontSize: isVertical ? 30 : 38, fontWeight: 700, color: colors.charcoal, letterSpacing: -1, lineHeight: 1.1 }}>
              Clique para Agendar
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <TimeSlot time="08:00" delay={Math.round(0.2 * fps)} occupied patientName="Maria Silva" type="consulta" isVertical={isVertical} />
            <TimeSlot time="09:00" delay={Math.round(0.3 * fps)} occupied patientName="Joao Santos" type="retorno" isVertical={isVertical} />
            <TimeSlot time="10:00" delay={Math.round(0.4 * fps)} occupied patientName="Ana Costa" type="exames" isVertical={isVertical} />
            {!isVertical && <TimeSlot time="11:00" delay={Math.round(0.5 * fps)} isVertical={isVertical} />}
            <TimeSlot time="14:00" delay={Math.round(0.6 * fps)} isClicked clickFrame={Math.round(2 * fps)} isVertical={isVertical} />
          </div>
        </div>

        {/* Right: modal */}
        <Sequence from={Math.round(2.5 * fps)} layout="none" premountFor={Math.round(0.5 * fps)}>
          <AppointmentModal isVertical={isVertical} />
        </Sequence>
      </div>
    </AbsoluteFill>
  );
};
