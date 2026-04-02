import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Sequence,
} from 'remotion';
import { c, S } from '../theme';
import { montserrat, openSans } from '../fonts';
import { reveal, wordReveal, scaleIn } from '../anim';

const Slot: React.FC<{
  time: string; delay: number; occupied?: boolean; name?: string; type?: string;
  clicked?: boolean; clickAt?: number; v: boolean;
}> = ({ time, delay, occupied, name, type, clicked, clickAt = 0, v }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const r = reveal(frame, fps, delay, { y: 12 });
  const clickP = clicked ? spring({ frame, fps, delay: clickAt, config: S.gentle }) : 0;
  const typeCol: Record<string, string> = { consulta: c.primary, retorno: c.blue, exames: c.amber };

  return (
    <div style={{ ...r, display: 'flex', gap: 14, alignItems: 'stretch', minHeight: v ? 50 : 58, transform: `${r.transform} scale(${clicked ? interpolate(clickP, [0, 1], [1, 0.97]) : 1})` }}>
      <div style={{ width: v ? 52 : 66, fontFamily: montserrat, fontSize: v ? 15 : 18, fontWeight: 700, color: c.textStrong, textAlign: 'right', paddingTop: 5 }}>{time}</div>
      <div style={{
        flex: 1, borderRadius: 12, padding: v ? '9px 14px' : '11px 16px',
        ...(occupied
          ? { backgroundColor: c.bgCard, borderLeft: `3px solid ${typeCol[type!] || c.primary}`, boxShadow: '0 1px 2px rgba(0,0,0,0.15)' }
          : { border: `2px dashed ${clickP > 0.5 ? c.blue : c.strokeDefault}`, backgroundColor: clickP > 0.5 ? 'rgba(96,165,250,0.04)' : 'transparent' }),
      }}>
        {occupied ? (
          <div>
            <div style={{ fontFamily: montserrat, fontSize: v ? 13 : 15, fontWeight: 700, color: c.textStrong }}>{name}</div>
            <div style={{ fontFamily: openSans, fontSize: 11, color: c.textMuted, marginTop: 1, textTransform: 'capitalize' }}>{type}</div>
          </div>
        ) : (
          <div style={{ fontFamily: openSans, fontSize: 12, color: c.textSubtle, display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ fontSize: 14 }}>+</span> Disponível
          </div>
        )}
      </div>
    </div>
  );
};

const Modal: React.FC<{ v: boolean }> = ({ v }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const s = scaleIn(frame, fps, 0);
  const o = interpolate(frame, [0, 0.35 * fps], [0, 1], { extrapolateRight: 'clamp' });

  const field = (d: number) => reveal(frame, fps, d, { y: 10 });

  const hlPulse = frame > 1.2 * fps ? interpolate(frame - 1.2 * fps, [0, 0.5 * fps, 1 * fps], [0, 1, 0.5], { extrapolateRight: 'clamp' }) : 0;

  return (
    <div style={{ transform: `scale(${interpolate(s, [0, 1], [0.93, 1])})`, opacity: o, width: v ? '100%' : 370, maxWidth: 400, backgroundColor: c.bgCard, borderRadius: 16, boxShadow: '0 20px 50px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.04)', overflow: 'hidden' }}>
      <div style={{ padding: '20px 22px 12px', borderBottom: `1px solid ${c.strokeSoft}` }}>
        <div style={{ fontFamily: montserrat, fontSize: 18, fontWeight: 700, color: c.textStrong }}>Novo Agendamento</div>
        <div style={{ fontFamily: openSans, fontSize: 12, color: c.textMuted, marginTop: 2 }}>Agende uma consulta ou bloqueie um horário.</div>
      </div>
      <div style={{ padding: '16px 22px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={field(0.2 * fps)}>
          <div style={{ fontFamily: montserrat, fontSize: 11, fontWeight: 700, color: c.textDefault, marginBottom: 4 }}>Paciente</div>
          <div style={{ border: `1px solid ${c.strokeDefault}`, borderRadius: 8, padding: '8px 12px', fontFamily: openSans, fontSize: 12, color: c.textSubtle, display: 'flex', justifyContent: 'space-between' }}>
            Selecione o paciente <span style={{ fontSize: 8, color: c.strokeStrong }}>▼</span>
          </div>
        </div>
        <div style={field(0.35 * fps)}>
          <div style={{
            border: `1px solid ${hlPulse > 0.3 ? c.green : c.strokeDefault}`, borderRadius: 8, padding: '8px 12px',
            backgroundColor: `rgba(34,197,94,${0.03 + hlPulse * 0.06})`,
            fontFamily: montserrat, fontSize: 12, fontWeight: 600, color: c.green, display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <span style={{ fontSize: 14 }}>+</span> Novo Paciente
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, ...field(0.5 * fps) }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: montserrat, fontSize: 11, fontWeight: 700, color: c.textDefault, marginBottom: 4 }}>Horário</div>
            <div style={{ border: `1px solid ${c.strokeDefault}`, borderRadius: 8, padding: '8px 12px', fontFamily: openSans, fontSize: 12, color: c.textStrong, fontWeight: 600 }}>14:00</div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: montserrat, fontSize: 11, fontWeight: 700, color: c.textDefault, marginBottom: 4 }}>Tipo</div>
            <div style={{ border: `1px solid ${c.strokeDefault}`, borderRadius: 8, padding: '8px 12px', fontFamily: openSans, fontSize: 12, color: c.textStrong }}>Consulta</div>
          </div>
        </div>
        <div style={field(0.65 * fps)}>
          <div style={{ backgroundColor: c.primary, borderRadius: 8, padding: '12px 16px', fontFamily: montserrat, fontSize: 13, fontWeight: 700, color: c.bg, textAlign: 'center' }}>
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
  const v = height > width;

  const titleWords = wordReveal('Clique para Agendar', frame, fps, 0.15 * fps, 0.07);
  const pad = v ? 60 : 140;
  const slotW = v ? 480 : 480;

  return (
    <AbsoluteFill style={{ backgroundColor: c.bg }}>
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse 50% 40% at 70% 50%, rgba(96,165,250,0.03), transparent)` }} />

      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: v ? 'column' : 'row', alignItems: 'center', justifyContent: 'center', padding: pad, gap: v ? 24 : 46 }}>
        <div style={{ width: slotW, display: 'flex', flexDirection: 'column', gap: v ? 14 : 18 }}>
          <div>
            <div style={{ ...reveal(frame, fps, 0), fontFamily: montserrat, fontSize: 12, fontWeight: 700, color: c.textSubtle, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 6 }}>
              Agenda Inteligente
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap' }}>
              {titleWords.map((w, i) => (
                <span key={i} style={{ ...w.style, fontFamily: montserrat, fontSize: v ? 26 : 34, fontWeight: 700, color: c.textStrong, letterSpacing: -0.5 }}>{w.word}</span>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            <Slot time="08:00" delay={Math.round(0.25 * fps)} occupied name="Maria Silva" type="consulta" v={v} />
            <Slot time="09:00" delay={Math.round(0.35 * fps)} occupied name="João Santos" type="retorno" v={v} />
            <Slot time="10:00" delay={Math.round(0.45 * fps)} occupied name="Ana Costa" type="exames" v={v} />
            {!v && <Slot time="11:00" delay={Math.round(0.55 * fps)} v={v} />}
            <Slot time="14:00" delay={Math.round(v ? 0.55 : 0.65) * fps} clicked clickAt={Math.round(2 * fps)} v={v} />
          </div>
        </div>

        <Sequence from={Math.round(2.5 * fps)} layout="none" premountFor={Math.round(0.5 * fps)}>
          <Modal v={v} />
        </Sequence>
      </div>
    </AbsoluteFill>
  );
};
