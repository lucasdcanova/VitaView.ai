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

const SYSTEMS = ['iClinic', 'Doctoralia', 'MedX', 'Tasy', 'CSV'];

const ImportStep: React.FC<{
  number: string; icon: string; title: string; desc: string; delay: number; v: boolean;
}> = ({ number, icon, title, desc, delay, v }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const s = scaleIn(frame, fps, delay);
  const r = reveal(frame, fps, delay, { y: 16 });

  return (
    <div style={{
      ...r,
      backgroundColor: c.bgCard,
      borderRadius: 16,
      padding: v ? '18px 18px' : '22px 24px',
      border: `1px solid ${c.strokeSoft}`,
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      flex: 1,
      minWidth: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          backgroundColor: c.bgSurface, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: montserrat, fontSize: 14, fontWeight: 700, color: c.textSubtle,
        }}>
          {number}
        </div>
        <span style={{ fontSize: v ? 20 : 24 }}>{icon}</span>
      </div>
      <div style={{ fontFamily: montserrat, fontSize: v ? 14 : 16, fontWeight: 700, color: c.textStrong }}>
        {title}
      </div>
      <div style={{ fontFamily: openSans, fontSize: v ? 11 : 13, color: c.textMuted, lineHeight: 1.4 }}>
        {desc}
      </div>
    </div>
  );
};

const BulletPoint: React.FC<{
  icon: string; bold: string; text: string; delay: number; v: boolean;
}> = ({ icon, bold, text, delay, v }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const r = reveal(frame, fps, delay, { y: 10 });

  return (
    <div style={{
      ...r,
      display: 'flex', alignItems: 'flex-start', gap: 12,
      backgroundColor: c.bgCard, borderRadius: 12, padding: v ? '12px 14px' : '14px 18px',
      border: `1px solid ${c.strokeSoft}`,
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: 8,
        backgroundColor: c.greenMuted, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 16, flexShrink: 0,
      }}>
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <span style={{ fontFamily: montserrat, fontSize: v ? 13 : 15, fontWeight: 700, color: c.textStrong }}>{bold}</span>
        <span style={{ fontFamily: openSans, fontSize: v ? 12 : 14, color: c.textMuted }}> — {text}</span>
      </div>
    </div>
  );
};

// Animated progress bar for migration
const MigrationProgress: React.FC<{ delay: number; v: boolean }> = ({ delay, v }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const r = reveal(frame, fps, delay, { y: 12 });
  const progress = interpolate(frame, [delay + 0.3 * fps, delay + 3 * fps], [0, 100], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    easing: Easing.bezier(0.22, 1, 0.36, 1),
  });

  const patientsCount = Math.floor(interpolate(progress, [0, 100], [0, 1847]));
  const consultasCount = Math.floor(interpolate(progress, [0, 100], [0, 12453]));

  const isDone = progress >= 99;
  const checkScale = isDone ? scaleIn(frame, fps, delay + 3 * fps) : 0;

  return (
    <div style={{
      ...r,
      backgroundColor: c.bgCard, borderRadius: 16, padding: v ? '18px 18px' : '22px 26px',
      border: `1px solid ${isDone ? 'rgba(34,197,94,0.25)' : c.strokeSoft}`,
      display: 'flex', flexDirection: 'column', gap: 14,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            backgroundColor: isDone ? c.greenMuted : c.blueMuted,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
          }}>
            {isDone ? (
              <span style={{ transform: `scale(${checkScale})`, display: 'inline-block', color: c.green, fontWeight: 700, fontSize: 16 }}>✓</span>
            ) : (
              <span style={{ transform: `scale(${0.9 + Math.sin(frame * 0.15) * 0.1})`, display: 'inline-block' }}>📥</span>
            )}
          </div>
          <div>
            <div style={{ fontFamily: montserrat, fontSize: v ? 14 : 16, fontWeight: 700, color: c.textStrong }}>
              {isDone ? 'Importação Concluída' : 'Importando prontuário...'}
            </div>
            <div style={{ fontFamily: openSans, fontSize: 11, color: c.textMuted }}>
              {isDone ? 'Todos os dados foram migrados' : 'Processando dados do sistema anterior'}
            </div>
          </div>
        </div>
        <div style={{ fontFamily: montserrat, fontSize: v ? 18 : 22, fontWeight: 700, color: isDone ? c.green : c.blue }}>
          {Math.floor(progress)}%
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height: 6, borderRadius: 3, backgroundColor: c.bgSurface, overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: 3, width: `${progress}%`,
          backgroundColor: isDone ? c.green : c.blue,
          boxShadow: isDone ? 'none' : `0 0 12px ${c.blueMuted}`,
        }} />
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: v ? 12 : 20 }}>
        <div>
          <div style={{ fontFamily: montserrat, fontSize: v ? 18 : 22, fontWeight: 700, color: c.textStrong }}>
            {patientsCount.toLocaleString('pt-BR')}
          </div>
          <div style={{ fontFamily: openSans, fontSize: 11, color: c.textMuted }}>Pacientes</div>
        </div>
        <div style={{ width: 1, backgroundColor: c.strokeSoft }} />
        <div>
          <div style={{ fontFamily: montserrat, fontSize: v ? 18 : 22, fontWeight: 700, color: c.textStrong }}>
            {consultasCount.toLocaleString('pt-BR')}
          </div>
          <div style={{ fontFamily: openSans, fontSize: 11, color: c.textMuted }}>Consultas</div>
        </div>
      </div>
    </div>
  );
};

export const ImportScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const v = height > width;

  const titleWords = wordReveal('Traga Todo Seu Prontuário.', frame, fps, 0.15 * fps, 0.06);
  const subR = reveal(frame, fps, 0.6 * fps, { y: 12 });

  // System pills stagger
  const pillBase = 0.9 * fps;

  const maxW = v ? width - 100 : 860;

  return (
    <AbsoluteFill style={{ backgroundColor: c.bg }}>
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse 50% 40% at 50% 35%, rgba(34,197,94,0.04), transparent)` }} />

      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: v ? '50px 40px' : '60px 40px', gap: v ? 18 : 22,
      }}>
        {/* Title block */}
        <div style={{ width: maxW, textAlign: 'center' }}>
          <div style={{ ...reveal(frame, fps, 0), fontFamily: montserrat, fontSize: 12, fontWeight: 700, color: c.textSubtle, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 10 }}>
            Importação de Prontuário
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
            {titleWords.map((w, i) => (
              <span key={i} style={{ ...w.style, fontFamily: montserrat, fontSize: v ? 30 : 40, fontWeight: 700, color: c.textStrong, letterSpacing: -0.8, lineHeight: 1.15 }}>{w.word}</span>
            ))}
          </div>
          <p style={{
            ...subR,
            fontFamily: openSans, fontSize: v ? 15 : 18, color: c.textMuted, margin: 0, marginTop: 12, lineHeight: 1.5,
          }}>
            Importe pacientes, consultas e histórico completo do seu sistema atual — sem perder uma vírgula.
          </p>
        </div>

        {/* Compatible systems */}
        <div style={{ width: maxW, display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
          {SYSTEMS.map((sys, i) => {
            const d = pillBase + i * 0.08 * fps;
            const s = scaleIn(frame, fps, d);
            const o = interpolate(frame, [d, d + 0.2 * fps], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
            return (
              <div key={sys} style={{
                opacity: o, transform: `scale(${interpolate(s, [0, 1], [0.88, 1])})`,
                backgroundColor: c.bgSurface, border: `1px solid ${c.strokeSoft}`, borderRadius: 20,
                padding: '5px 14px', fontFamily: openSans, fontSize: 12, fontWeight: 600, color: c.textDefault,
              }}>
                {sys}
              </div>
            );
          })}
        </div>

        {/* Two-column layout: bullets + migration progress */}
        <div style={{
          width: maxW,
          display: 'flex', flexDirection: v ? 'column' : 'row', gap: v ? 14 : 22, alignItems: 'stretch',
        }}>
          {/* Left: bullet points */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <BulletPoint icon="⚡" bold="Migração com um clique" text="Conecte seu sistema e pronto" delay={1.5 * fps} v={v} />
            <BulletPoint icon="🔄" bold="Zero retrabalho" text="Cadastros e evoluções organizados" delay={1.65 * fps} v={v} />
            <BulletPoint icon="🔒" bold="Histórico 100% preservado" text="Cada consulta e exame intactos" delay={1.8 * fps} v={v} />
            <BulletPoint icon="⏱️" bold="Sem tempo de inatividade" text="Continue atendendo normalmente" delay={1.95 * fps} v={v} />
          </div>

          {/* Right: migration animation */}
          <div style={{ flex: 1 }}>
            <MigrationProgress delay={2.2 * fps} v={v} />
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
