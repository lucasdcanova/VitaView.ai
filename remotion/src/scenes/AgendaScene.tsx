import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Sequence,
  Easing,
} from 'remotion';
import { colors } from '../theme';
import { montserrat, openSans } from '../fonts';

const TimeSlot: React.FC<{
  time: string;
  delay: number;
  occupied?: boolean;
  patientName?: string;
  type?: string;
  isClicked?: boolean;
  clickFrame?: number;
}> = ({ time, delay, occupied, patientName, type, isClicked, clickFrame = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const slideIn = spring({ frame, fps, delay, config: { damping: 200 } });
  const x = interpolate(slideIn, [0, 1], [60, 0]);
  const opacity = interpolate(slideIn, [0, 1], [0, 1]);

  // Click animation
  const clickProgress = isClicked
    ? spring({ frame, fps, delay: clickFrame, config: { damping: 15, stiffness: 180 } })
    : 0;
  const clickScale = isClicked ? interpolate(clickProgress, [0, 1], [1, 0.97]) : 1;
  const borderColor = isClicked
    ? interpolate(clickProgress, [0, 1], [0, 1])
    : 0;

  const typeColor = type === 'consulta' ? colors.charcoal
    : type === 'retorno' ? colors.blue500
    : type === 'exames' ? colors.amber500
    : colors.charcoal;

  return (
    <div
      style={{
        display: 'flex',
        gap: 20,
        opacity,
        transform: `translateX(${x}px) scale(${clickScale})`,
        alignItems: 'stretch',
        minHeight: 72,
      }}
    >
      {/* Time column */}
      <div
        style={{
          width: 80,
          fontFamily: montserrat,
          fontSize: 22,
          fontWeight: 700,
          color: colors.charcoal,
          textAlign: 'right',
          paddingTop: 8,
        }}
      >
        {time}
      </div>

      {/* Content column */}
      <div
        style={{
          flex: 1,
          borderRadius: 12,
          padding: '14px 20px',
          ...(occupied
            ? {
                backgroundColor: colors.pureWhite,
                borderLeft: `4px solid ${typeColor}`,
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
              }
            : {
                border: `2px dashed ${borderColor > 0.5 ? colors.charcoal : colors.lightGray}`,
                backgroundColor: borderColor > 0.5 ? 'rgba(33,33,33,0.03)' : 'transparent',
              }),
        }}
      >
        {occupied ? (
          <div>
            <div
              style={{
                fontFamily: montserrat,
                fontSize: 18,
                fontWeight: 700,
                color: colors.charcoal,
              }}
            >
              {patientName}
            </div>
            <div
              style={{
                fontFamily: openSans,
                fontSize: 14,
                color: colors.contentMuted,
                marginTop: 2,
                textTransform: 'capitalize',
              }}
            >
              {type}
            </div>
          </div>
        ) : (
          <div
            style={{
              fontFamily: openSans,
              fontSize: 15,
              color: colors.mediumGray,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span style={{ fontSize: 20 }}>+</span> Disponivel
          </div>
        )}
      </div>
    </div>
  );
};

// Floating modal that appears when clicking empty slot
const AppointmentModal: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const modalScale = spring({ frame, fps, config: { damping: 15, stiffness: 140 } });
  const modalOpacity = interpolate(frame, [0, 0.2 * fps], [0, 1], { extrapolateRight: 'clamp' });

  // Staggered form fields
  const field1 = spring({ frame, fps, delay: 0.2 * fps, config: { damping: 200 } });
  const field2 = spring({ frame, fps, delay: 0.35 * fps, config: { damping: 200 } });
  const field3 = spring({ frame, fps, delay: 0.5 * fps, config: { damping: 200 } });
  const btnSpring = spring({ frame, fps, delay: 0.65 * fps, config: { damping: 200 } });

  // "Novo Paciente" highlight
  const highlightPulse = frame > 1.2 * fps
    ? interpolate(frame - 1.2 * fps, [0, 0.3 * fps, 0.6 * fps], [0, 1, 0], {
        extrapolateRight: 'clamp',
      })
    : 0;

  return (
    <div
      style={{
        position: 'absolute',
        right: 120,
        top: '50%',
        transform: `translateY(-50%) scale(${interpolate(modalScale, [0, 1], [0.9, 1])})`,
        opacity: modalOpacity,
        width: 400,
        backgroundColor: colors.pureWhite,
        borderRadius: 16,
        boxShadow: '0 25px 60px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div style={{ padding: '24px 28px 16px', borderBottom: `1px solid ${colors.strokeSoft}` }}>
        <div style={{ fontFamily: montserrat, fontSize: 22, fontWeight: 700, color: colors.charcoal }}>
          Novo Agendamento
        </div>
        <div style={{ fontFamily: openSans, fontSize: 14, color: colors.contentMuted, marginTop: 4 }}>
          Agende uma consulta ou bloqueie um horario.
        </div>
      </div>

      {/* Form */}
      <div style={{ padding: '20px 28px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Patient selector */}
        <div style={{ opacity: field1, transform: `translateY(${interpolate(field1, [0, 1], [15, 0])}px)` }}>
          <div style={{ fontFamily: montserrat, fontSize: 13, fontWeight: 700, color: colors.charcoal, marginBottom: 6 }}>
            Paciente
          </div>
          <div
            style={{
              border: `1px solid ${colors.strokeDefault}`,
              borderRadius: 8,
              padding: '10px 14px',
              fontFamily: openSans,
              fontSize: 14,
              color: colors.mediumGray,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            Selecione o paciente
            <span style={{ fontSize: 10, color: colors.lightGray }}>▼</span>
          </div>
        </div>

        {/* Novo Paciente highlight button */}
        <div
          style={{
            opacity: field1,
            transform: `translateY(${interpolate(field1, [0, 1], [15, 0])}px)`,
          }}
        >
          <div
            style={{
              border: `1px solid ${interpolate(highlightPulse, [0, 1], [0, 1]) > 0.5 ? colors.charcoal : colors.green500}`,
              borderRadius: 8,
              padding: '10px 14px',
              backgroundColor: `rgba(34, 197, 94, ${0.05 + highlightPulse * 0.08})`,
              fontFamily: montserrat,
              fontSize: 14,
              fontWeight: 600,
              color: colors.green600,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span style={{ fontSize: 18 }}>+</span> Novo Paciente
          </div>
        </div>

        {/* Time field */}
        <div style={{ opacity: field2, transform: `translateY(${interpolate(field2, [0, 1], [15, 0])}px)` }}>
          <div style={{ fontFamily: montserrat, fontSize: 13, fontWeight: 700, color: colors.charcoal, marginBottom: 6 }}>
            Horario
          </div>
          <div
            style={{
              border: `1px solid ${colors.strokeDefault}`,
              borderRadius: 8,
              padding: '10px 14px',
              fontFamily: openSans,
              fontSize: 14,
              color: colors.charcoal,
              fontWeight: 600,
            }}
          >
            14:00
          </div>
        </div>

        {/* Type selector */}
        <div style={{ opacity: field3, transform: `translateY(${interpolate(field3, [0, 1], [15, 0])}px)` }}>
          <div style={{ fontFamily: montserrat, fontSize: 13, fontWeight: 700, color: colors.charcoal, marginBottom: 6 }}>
            Tipo
          </div>
          <div
            style={{
              border: `1px solid ${colors.strokeDefault}`,
              borderRadius: 8,
              padding: '10px 14px',
              fontFamily: openSans,
              fontSize: 14,
              color: colors.charcoal,
            }}
          >
            Consulta
          </div>
        </div>

        {/* Submit button */}
        <div style={{ opacity: btnSpring, transform: `translateY(${interpolate(btnSpring, [0, 1], [15, 0])}px)` }}>
          <div
            style={{
              backgroundColor: colors.charcoal,
              borderRadius: 8,
              padding: '14px 20px',
              fontFamily: montserrat,
              fontSize: 15,
              fontWeight: 700,
              color: colors.pureWhite,
              textAlign: 'center',
            }}
          >
            Agendar Consulta
          </div>
        </div>
      </div>
    </div>
  );
};

export const AgendaScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Scene title
  const titleOpacity = interpolate(frame, [0, 0.3 * fps], [0, 1], { extrapolateRight: 'clamp' });
  const titleY = interpolate(
    spring({ frame, fps, config: { damping: 200 } }),
    [0, 1],
    [20, 0],
  );

  return (
    <AbsoluteFill style={{ backgroundColor: colors.surface0 }}>
      {/* Scene label */}
      <div
        style={{
          position: 'absolute',
          top: 40,
          left: 60,
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
        }}
      >
        <div
          style={{
            fontFamily: montserrat,
            fontSize: 14,
            fontWeight: 700,
            color: colors.mediumGray,
            letterSpacing: 3,
            textTransform: 'uppercase',
            marginBottom: 8,
          }}
        >
          Agenda Inteligente
        </div>
        <div
          style={{
            fontFamily: montserrat,
            fontSize: 42,
            fontWeight: 700,
            color: colors.charcoal,
            letterSpacing: -1,
          }}
        >
          Clique para Agendar
        </div>
      </div>

      {/* Calendar slots area */}
      <div
        style={{
          position: 'absolute',
          left: 60,
          top: 180,
          width: 560,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <TimeSlot time="08:00" delay={0.2 * fps} occupied patientName="Maria Silva" type="consulta" />
        <TimeSlot time="09:00" delay={0.3 * fps} occupied patientName="Joao Santos" type="retorno" />
        <TimeSlot time="10:00" delay={0.4 * fps} occupied patientName="Ana Costa" type="exames" />
        <TimeSlot time="11:00" delay={0.5 * fps} />
        <TimeSlot time="12:00" delay={0.6 * fps} />
        <TimeSlot time="13:00" delay={0.7 * fps} />
        <TimeSlot
          time="14:00"
          delay={0.8 * fps}
          isClicked
          clickFrame={2 * fps}
        />
      </div>

      {/* Cursor animation toward 14:00 slot */}
      {frame > 1.5 * fps && frame < 2.5 * fps && (
        <div
          style={{
            position: 'absolute',
            left: interpolate(frame - 1.5 * fps, [0, 0.5 * fps], [400, 360], {
              extrapolateRight: 'clamp',
              easing: Easing.out(Easing.quad),
            }),
            top: interpolate(frame - 1.5 * fps, [0, 0.5 * fps], [500, 640], {
              extrapolateRight: 'clamp',
              easing: Easing.out(Easing.quad),
            }),
            width: 24,
            height: 24,
            borderRadius: 12,
            backgroundColor: colors.charcoal,
            opacity: interpolate(frame - 1.5 * fps, [0, 0.15 * fps, 0.4 * fps, 0.5 * fps], [0, 0.8, 0.8, 0], {
              extrapolateRight: 'clamp',
            }),
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          }}
        />
      )}

      {/* Appointment Modal appears */}
      <Sequence from={2.5 * fps} layout="none" premountFor={0.5 * fps}>
        <AppointmentModal />
      </Sequence>
    </AbsoluteFill>
  );
};
