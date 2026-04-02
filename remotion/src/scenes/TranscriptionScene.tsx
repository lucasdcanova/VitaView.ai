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

const LINES = [
  { speaker: 'Médico', text: 'Como você está se sentindo desde a última consulta?', time: 0 },
  { speaker: 'Paciente', text: 'Melhorei da dor lombar, mas ainda sinto cansaço.', time: 1.2 },
  { speaker: 'Médico', text: 'Vamos solicitar alguns exames complementares.', time: 2.6 },
];

const FIELDS = [
  { label: 'Queixa Principal', value: 'Cansaço persistente após melhora de lombalgia' },
  { label: 'História da Doença Atual', value: 'Paciente refere melhora significativa do quadro álgico lombar...' },
  { label: 'Conduta', value: 'Solicitar hemograma, TSH, ferritina. Retorno em 15 dias.' },
];

export const TranscriptionScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const v = height > width;

  const titleWords = wordReveal('Voz para Prontuário', frame, fps, 0.15 * fps, 0.07);
  const waveActive = frame > 0.5 * fps && frame < 4 * fps;
  const pad = v ? 70 : 80;
  const cW = v ? 480 : 420;

  const cardDelay = 4.2 * fps;
  const cardR = reveal(frame, fps, cardDelay, { y: 20 });

  return (
    <AbsoluteFill style={{ backgroundColor: c.bg }}>
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse 50% 40% at 30% 50%, rgba(239,68,68,0.03), transparent)` }} />

      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: v ? 'column' : 'row', alignItems: 'center', justifyContent: 'center', padding: pad, gap: v ? 24 : 36, maxWidth: v ? undefined : 960, margin: '0 auto' }}>
        {/* Left: recording */}
        <div style={{ width: cW, display: 'flex', flexDirection: 'column', gap: v ? 14 : 18 }}>
          <div>
            <div style={{ ...reveal(frame, fps, 0), fontFamily: montserrat, fontSize: 12, fontWeight: 700, color: c.textSubtle, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 6 }}>
              Transcrição com IA
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap' }}>
              {titleWords.map((w, i) => (
                <span key={i} style={{ ...w.style, fontFamily: montserrat, fontSize: v ? 26 : 34, fontWeight: 700, color: c.textStrong, letterSpacing: -0.5 }}>{w.word}</span>
              ))}
            </div>
          </div>

          <div style={{ ...reveal(frame, fps, 0.3 * fps, { y: 14 }), backgroundColor: c.bgCard, borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.15)', overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ padding: '14px 18px', borderBottom: `1px solid ${c.strokeSoft}`, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: waveActive ? c.red : c.bgSurface, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: 12, height: 12, borderRadius: waveActive ? 3 : 6, backgroundColor: waveActive ? '#fff' : c.textSubtle }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: montserrat, fontSize: 14, fontWeight: 700, color: c.textStrong }}>{waveActive ? 'Gravando...' : 'Gravação'}</div>
                <div style={{ fontFamily: openSans, fontSize: 11, color: c.textMuted }}>Consulta — Maria Silva</div>
              </div>
              {waveActive && (
                <div style={{ fontFamily: montserrat, fontSize: 16, fontWeight: 600, color: c.red }}>
                  {Math.floor((frame - 0.5 * fps) / fps)}:{String(Math.floor(((frame - 0.5 * fps) % fps) / fps * 60) % 60).padStart(2, '0')}
                </div>
              )}
            </div>

            {/* Waveform */}
            <div style={{ padding: '10px 18px', display: 'flex', alignItems: 'center', gap: 2, height: 40 }}>
              {Array.from({ length: 32 }).map((_, i) => {
                const h = waveActive ? 5 + Math.sin(frame * 0.26 + i * 0.62) * 12 + Math.cos(frame * 0.16 + i * 1) * 5 : 3;
                return <div key={i} style={{ width: 3, height: Math.max(3, h), borderRadius: 1.5, backgroundColor: waveActive ? c.textDefault : c.strokeDefault, opacity: waveActive ? 0.45 + Math.sin(frame * 0.13 + i) * 0.55 : 0.3 }} />;
              })}
            </div>

            {/* Lines */}
            <div style={{ padding: '8px 18px 18px' }}>
              {LINES.map((line, i) => {
                const ld = line.time * fps + 0.5 * fps;
                const lo = interpolate(frame, [ld, ld + 0.4 * fps], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
                const ly = interpolate(frame, [ld, ld + 0.4 * fps], [8, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.quad) });
                const chars = frame > ld ? Math.min(line.text.length, Math.floor((frame - ld) / (fps * 0.026))) : 0;

                return (
                  <div key={i} style={{ opacity: lo, transform: `translateY(${ly}px)`, marginBottom: 8, display: 'flex', gap: 7 }}>
                    <div style={{ fontFamily: montserrat, fontSize: 10, fontWeight: 700, color: line.speaker === 'Médico' ? c.textDefault : c.blue, minWidth: 55, paddingTop: 2 }}>{line.speaker}</div>
                    <div style={{ fontFamily: openSans, fontSize: 13, color: c.textDefault, lineHeight: 1.4 }}>
                      {line.text.slice(0, chars)}
                      {chars < line.text.length && chars > 0 && (
                        <span style={{ display: 'inline-block', width: 1.5, height: 13, backgroundColor: c.textStrong, marginLeft: 1, verticalAlign: 'middle', opacity: Math.sin(frame * 0.3) > 0 ? 1 : 0 }} />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: AI anamnesis */}
        <div style={{ width: cW }}>
          {frame > cardDelay - 0.5 * fps && (
            <div style={{ ...cardR, backgroundColor: c.bgCard, borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.15)', overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px 12px', borderBottom: `1px solid ${c.strokeSoft}`, display: 'flex', alignItems: 'center', gap: 9 }}>
                <div style={{ width: 28, height: 28, borderRadius: 7, backgroundColor: c.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: montserrat, fontSize: 11, fontWeight: 700, color: c.bg }}>IA</div>
                <div>
                  <div style={{ fontFamily: montserrat, fontSize: 15, fontWeight: 700, color: c.textStrong }}>Anamnese Gerada</div>
                  <div style={{ fontFamily: openSans, fontSize: 10, color: c.textMuted }}>Processado automaticamente</div>
                </div>
              </div>
              <div style={{ padding: '12px 20px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {FIELDS.map((field, i) => {
                  const fd = cardDelay + (i + 1) * 0.3 * fps;
                  const fr = reveal(frame, fps, fd, { y: 8 });
                  return (
                    <div key={i} style={fr}>
                      <div style={{ fontFamily: montserrat, fontSize: 10, fontWeight: 700, color: c.textSubtle, marginBottom: 3, textTransform: 'uppercase', letterSpacing: 0.8 }}>{field.label}</div>
                      <div style={{ fontFamily: openSans, fontSize: 13, color: c.textDefault, lineHeight: 1.4 }}>{field.value}</div>
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
