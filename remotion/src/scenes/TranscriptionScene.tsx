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

const TRANSCRIPTION_LINES = [
  { speaker: 'Medico', text: 'Como voce esta se sentindo desde a ultima consulta?', time: 0 },
  { speaker: 'Paciente', text: 'Melhorei bastante da dor lombar, mas ainda sinto cansaco.', time: 1.2 },
  { speaker: 'Medico', text: 'Vamos solicitar alguns exames complementares.', time: 2.8 },
];

const ANAMNESIS_FIELDS = [
  { label: 'Queixa Principal', value: 'Cansaco persistente apos melhora de dor lombar' },
  { label: 'HDA', value: 'Paciente refere melhora significativa do quadro de lombalgia...' },
  { label: 'Conduta', value: 'Solicitar hemograma, TSH, ferritina. Retorno em 15 dias.' },
];

export const TranscriptionScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOpacity = interpolate(frame, [0, 0.3 * fps], [0, 1], { extrapolateRight: 'clamp' });
  const titleY = interpolate(
    spring({ frame, fps, config: { damping: 200 } }),
    [0, 1],
    [20, 0],
  );

  // Waveform animation
  const waveActive = frame > 0.5 * fps && frame < 4 * fps;

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
        <div style={{ fontFamily: montserrat, fontSize: 14, fontWeight: 700, color: colors.mediumGray, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 8 }}>
          Transcricao com IA
        </div>
        <div style={{ fontFamily: montserrat, fontSize: 42, fontWeight: 700, color: colors.charcoal, letterSpacing: -1 }}>
          Voz para Prontuario
        </div>
      </div>

      {/* Recording card */}
      <div
        style={{
          position: 'absolute',
          left: 60,
          top: 180,
          width: 520,
          backgroundColor: colors.pureWhite,
          borderRadius: 16,
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
          overflow: 'hidden',
        }}
      >
        {/* Recording header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: `1px solid ${colors.strokeSoft}`,
            display: 'flex',
            alignItems: 'center',
            gap: 16,
          }}
        >
          {/* Mic icon / recording indicator */}
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: waveActive ? colors.alertRed : colors.lightGray,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'none',
            }}
          >
            <div
              style={{
                width: 18,
                height: 18,
                borderRadius: waveActive ? 4 : 9,
                backgroundColor: colors.pureWhite,
              }}
            />
          </div>

          <div>
            <div style={{ fontFamily: montserrat, fontSize: 18, fontWeight: 700, color: colors.charcoal }}>
              {waveActive ? 'Gravando...' : 'Gravacao'}
            </div>
            <div style={{ fontFamily: openSans, fontSize: 13, color: colors.contentMuted }}>
              Consulta com Maria Silva
            </div>
          </div>

          {/* Timer */}
          {waveActive && (
            <div
              style={{
                marginLeft: 'auto',
                fontFamily: montserrat,
                fontSize: 20,
                fontWeight: 600,
                color: colors.alertRed,
              }}
            >
              {Math.floor((frame - 0.5 * fps) / fps)}:{String(Math.floor(((frame - 0.5 * fps) % fps) / fps * 60) % 60).padStart(2, '0')}
            </div>
          )}
        </div>

        {/* Waveform */}
        <div
          style={{
            padding: '16px 24px',
            display: 'flex',
            alignItems: 'center',
            gap: 3,
            height: 60,
          }}
        >
          {Array.from({ length: 40 }).map((_, i) => {
            const barHeight = waveActive
              ? 8 + Math.sin(frame * 0.3 + i * 0.7) * 16 + Math.cos(frame * 0.2 + i * 1.1) * 8
              : 4;
            return (
              <div
                key={i}
                style={{
                  width: 4,
                  height: Math.max(4, barHeight),
                  borderRadius: 2,
                  backgroundColor: waveActive ? colors.charcoal : colors.lightGray,
                  opacity: waveActive ? 0.6 + Math.sin(frame * 0.2 + i) * 0.4 : 0.4,
                }}
              />
            );
          })}
        </div>

        {/* Transcription lines */}
        <div style={{ padding: '12px 24px 24px' }}>
          {TRANSCRIPTION_LINES.map((line, i) => {
            const lineDelay = line.time * fps + 0.5 * fps;
            const lineOpacity = interpolate(frame, [lineDelay, lineDelay + 0.3 * fps], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            });
            const lineY = interpolate(frame, [lineDelay, lineDelay + 0.3 * fps], [10, 0], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
              easing: Easing.out(Easing.quad),
            });

            // Typewriter effect
            const charsVisible = frame > lineDelay
              ? Math.min(
                  line.text.length,
                  Math.floor((frame - lineDelay) / (fps * 0.03)),
                )
              : 0;

            return (
              <div
                key={i}
                style={{
                  opacity: lineOpacity,
                  transform: `translateY(${lineY}px)`,
                  marginBottom: 12,
                  display: 'flex',
                  gap: 10,
                }}
              >
                <div
                  style={{
                    fontFamily: montserrat,
                    fontSize: 12,
                    fontWeight: 700,
                    color: line.speaker === 'Medico' ? colors.charcoal : colors.blue500,
                    minWidth: 70,
                    paddingTop: 2,
                  }}
                >
                  {line.speaker}
                </div>
                <div
                  style={{
                    fontFamily: openSans,
                    fontSize: 15,
                    color: colors.contentDefault,
                    lineHeight: 1.5,
                  }}
                >
                  {line.text.slice(0, charsVisible)}
                  {charsVisible < line.text.length && charsVisible > 0 && (
                    <span
                      style={{
                        display: 'inline-block',
                        width: 2,
                        height: 16,
                        backgroundColor: colors.charcoal,
                        marginLeft: 2,
                        verticalAlign: 'middle',
                        opacity: Math.sin(frame * 0.3) > 0 ? 1 : 0,
                      }}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* AI-generated anamnesis card */}
      <div
        style={{
          position: 'absolute',
          right: 60,
          top: 180,
          width: 520,
        }}
      >
        {/* Arrow / connection line */}
        <div
          style={{
            position: 'absolute',
            left: -80,
            top: 60,
            width: 60,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              width: interpolate(frame, [4 * fps, 4.5 * fps], [0, 60], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              }),
              height: 2,
              backgroundColor: colors.charcoal,
            }}
          />
        </div>

        {/* Anamnesis card */}
        {frame > 4 * fps && (() => {
          const cardDelay = 4 * fps;
          const cardSpring = spring({ frame, fps, delay: cardDelay, config: { damping: 200 } });
          const cardOpacity = interpolate(frame, [cardDelay, cardDelay + 0.3 * fps], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });

          return (
            <div
              style={{
                opacity: cardOpacity,
                transform: `translateX(${interpolate(cardSpring, [0, 1], [30, 0])}px)`,
                backgroundColor: colors.pureWhite,
                borderRadius: 16,
                boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                overflow: 'hidden',
              }}
            >
              {/* Header */}
              <div
                style={{
                  padding: '20px 24px 16px',
                  borderBottom: `1px solid ${colors.strokeSoft}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    backgroundColor: colors.charcoal,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: montserrat,
                    fontSize: 14,
                    fontWeight: 700,
                    color: colors.pureWhite,
                  }}
                >
                  IA
                </div>
                <div>
                  <div style={{ fontFamily: montserrat, fontSize: 18, fontWeight: 700, color: colors.charcoal }}>
                    Anamnese Gerada
                  </div>
                  <div style={{ fontFamily: openSans, fontSize: 12, color: colors.contentMuted }}>
                    Processado automaticamente pela IA
                  </div>
                </div>
              </div>

              {/* Fields */}
              <div style={{ padding: '16px 24px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                {ANAMNESIS_FIELDS.map((field, i) => {
                  const fieldDelay = cardDelay + (i + 1) * 0.25 * fps;
                  const fieldSpring = spring({ frame, fps, delay: fieldDelay, config: { damping: 200 } });
                  const fieldOpacity = interpolate(frame, [fieldDelay, fieldDelay + 0.2 * fps], [0, 1], {
                    extrapolateLeft: 'clamp',
                    extrapolateRight: 'clamp',
                  });

                  return (
                    <div
                      key={i}
                      style={{
                        opacity: fieldOpacity,
                        transform: `translateY(${interpolate(fieldSpring, [0, 1], [12, 0])}px)`,
                      }}
                    >
                      <div style={{ fontFamily: montserrat, fontSize: 12, fontWeight: 700, color: colors.contentMuted, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>
                        {field.label}
                      </div>
                      <div style={{ fontFamily: openSans, fontSize: 15, color: colors.contentDefault, lineHeight: 1.5 }}>
                        {field.value}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}
      </div>
    </AbsoluteFill>
  );
};
