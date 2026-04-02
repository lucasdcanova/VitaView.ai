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

const LINES = [
  { speaker: 'Medico', text: 'Como voce esta se sentindo desde a ultima consulta?', time: 0 },
  { speaker: 'Paciente', text: 'Melhorei da dor lombar, mas ainda sinto cansaco.', time: 1.2 },
  { speaker: 'Medico', text: 'Vamos solicitar alguns exames complementares.', time: 2.6 },
];

const FIELDS = [
  { label: 'Queixa Principal', value: 'Cansaco persistente apos melhora de lombalgia' },
  { label: 'Historia da Doenca Atual', value: 'Paciente refere melhora significativa do quadro algico lombar...' },
  { label: 'Conduta', value: 'Solicitar hemograma, TSH, ferritina. Retorno em 15 dias.' },
];

export const TranscriptionScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const isVertical = height > width;

  const titleSpring = spring({ frame, fps, config: SPRING_SMOOTH });
  const titleOpacity = interpolate(frame, [0, 0.4 * fps], [0, 1], { extrapolateRight: 'clamp' });

  const waveActive = frame > 0.5 * fps && frame < 4 * fps;
  const pad = isVertical ? 50 : 160;
  const cardW = isVertical ? width - 100 : 520;

  // Anamnesis card
  const cardDelay = 4.2 * fps;
  const cardSpring = spring({ frame, fps, delay: cardDelay, config: SPRING_SMOOTH });
  const cardOpacity = interpolate(frame, [cardDelay, cardDelay + 0.4 * fps], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

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
        {/* Left: recording card */}
        <div style={{ width: cardW, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ opacity: titleOpacity, transform: `translateY(${interpolate(titleSpring, [0, 1], [20, 0])}px)` }}>
            <div style={{ fontFamily: montserrat, fontSize: 13, fontWeight: 700, color: colors.mediumGray, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 8 }}>
              Transcricao com IA
            </div>
            <div style={{ fontFamily: montserrat, fontSize: isVertical ? 30 : 38, fontWeight: 700, color: colors.charcoal, letterSpacing: -1, lineHeight: 1.1 }}>
              Voz para Prontuario
            </div>
          </div>

          {/* Recording card */}
          <div
            style={{
              backgroundColor: colors.pureWhite,
              borderRadius: 16,
              boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
              overflow: 'hidden',
              opacity: interpolate(spring({ frame, fps, delay: 0.3 * fps, config: SPRING_SMOOTH }), [0, 1], [0, 1]),
              transform: `translateY(${interpolate(spring({ frame, fps, delay: 0.3 * fps, config: SPRING_SMOOTH }), [0, 1], [12, 0])}px)`,
            }}
          >
            {/* Header */}
            <div style={{ padding: '16px 20px', borderBottom: `1px solid ${colors.strokeSoft}`, display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: waveActive ? colors.alertRed : colors.lightGray, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: 14, height: 14, borderRadius: waveActive ? 3 : 7, backgroundColor: colors.pureWhite }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: montserrat, fontSize: 16, fontWeight: 700, color: colors.charcoal }}>{waveActive ? 'Gravando...' : 'Gravacao'}</div>
                <div style={{ fontFamily: openSans, fontSize: 12, color: colors.contentMuted }}>Consulta — Maria Silva</div>
              </div>
              {waveActive && (
                <div style={{ fontFamily: montserrat, fontSize: 18, fontWeight: 600, color: colors.alertRed }}>
                  {Math.floor((frame - 0.5 * fps) / fps)}:{String(Math.floor(((frame - 0.5 * fps) % fps) / fps * 60) % 60).padStart(2, '0')}
                </div>
              )}
            </div>

            {/* Waveform */}
            <div style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 2.5, height: 48 }}>
              {Array.from({ length: 36 }).map((_, i) => {
                const h = waveActive ? 6 + Math.sin(frame * 0.28 + i * 0.65) * 14 + Math.cos(frame * 0.18 + i * 1.05) * 6 : 3;
                return <div key={i} style={{ width: 3.5, height: Math.max(3, h), borderRadius: 2, backgroundColor: waveActive ? colors.charcoal : colors.lightGray, opacity: waveActive ? 0.5 + Math.sin(frame * 0.15 + i) * 0.5 : 0.35 }} />;
              })}
            </div>

            {/* Transcription lines */}
            <div style={{ padding: '10px 20px 20px' }}>
              {LINES.map((line, i) => {
                const ld = line.time * fps + 0.5 * fps;
                const lo = interpolate(frame, [ld, ld + 0.35 * fps], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
                const ly = interpolate(frame, [ld, ld + 0.35 * fps], [8, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.quad) });
                const chars = frame > ld ? Math.min(line.text.length, Math.floor((frame - ld) / (fps * 0.028))) : 0;

                return (
                  <div key={i} style={{ opacity: lo, transform: `translateY(${ly}px)`, marginBottom: 10, display: 'flex', gap: 8 }}>
                    <div style={{ fontFamily: montserrat, fontSize: 11, fontWeight: 700, color: line.speaker === 'Medico' ? colors.charcoal : colors.blue500, minWidth: 60, paddingTop: 2 }}>
                      {line.speaker}
                    </div>
                    <div style={{ fontFamily: openSans, fontSize: 14, color: colors.contentDefault, lineHeight: 1.45 }}>
                      {line.text.slice(0, chars)}
                      {chars < line.text.length && chars > 0 && (
                        <span style={{ display: 'inline-block', width: 2, height: 14, backgroundColor: colors.charcoal, marginLeft: 1, verticalAlign: 'middle', opacity: Math.sin(frame * 0.3) > 0 ? 1 : 0 }} />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: AI anamnesis */}
        <div style={{ width: cardW }}>
          {frame > cardDelay - 0.3 * fps && (
            <div
              style={{
                opacity: cardOpacity,
                transform: `translateX(${interpolate(cardSpring, [0, 1], [25, 0])}px)`,
                backgroundColor: colors.pureWhite,
                borderRadius: 16,
                boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                overflow: 'hidden',
              }}
            >
              <div style={{ padding: '18px 22px 14px', borderBottom: `1px solid ${colors.strokeSoft}`, display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, backgroundColor: colors.charcoal, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: montserrat, fontSize: 12, fontWeight: 700, color: colors.pureWhite }}>
                  IA
                </div>
                <div>
                  <div style={{ fontFamily: montserrat, fontSize: 16, fontWeight: 700, color: colors.charcoal }}>Anamnese Gerada</div>
                  <div style={{ fontFamily: openSans, fontSize: 11, color: colors.contentMuted }}>Processado automaticamente</div>
                </div>
              </div>

              <div style={{ padding: '14px 22px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                {FIELDS.map((field, i) => {
                  const fd = cardDelay + (i + 1) * 0.28 * fps;
                  const fs = spring({ frame, fps, delay: fd, config: SPRING_SMOOTH });
                  const fo = interpolate(frame, [fd, fd + 0.25 * fps], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
                  return (
                    <div key={i} style={{ opacity: fo, transform: `translateY(${interpolate(fs, [0, 1], [10, 0])}px)` }}>
                      <div style={{ fontFamily: montserrat, fontSize: 11, fontWeight: 700, color: colors.contentMuted, marginBottom: 3, textTransform: 'uppercase', letterSpacing: 0.8 }}>{field.label}</div>
                      <div style={{ fontFamily: openSans, fontSize: 14, color: colors.contentDefault, lineHeight: 1.45 }}>{field.value}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </AbsoluteFill>
  );
};
