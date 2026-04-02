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
import { c, S } from '../theme';
import { montserrat, openSans } from '../fonts';
import { reveal, wordReveal, scaleIn } from '../anim';

const FileItem: React.FC<{
  name: string; size: string; delay: number; statusDelay: number; v: boolean;
}> = ({ name, size, delay, statusDelay, v }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const r = reveal(frame, fps, delay, { y: 14 });

  const progress = interpolate(frame, [statusDelay, statusDelay + 2.2 * fps], [0, 100], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    easing: Easing.bezier(0.22, 1, 0.36, 1),
  });

  const isUploading = frame >= statusDelay && frame < statusDelay + 0.7 * fps;
  const isProcessing = frame >= statusDelay + 0.7 * fps && frame < statusDelay + 1.7 * fps;
  const isAnalyzed = frame >= statusDelay + 1.7 * fps;
  const status = isAnalyzed ? 'done' : isProcessing ? 'ai' : isUploading ? 'up' : 'q';

  const label = { q: 'Na fila', up: 'Enviando...', ai: 'IA analisando...', done: 'Analisado ✓' };
  const col = { q: c.textSubtle, up: c.blue, ai: c.amber, done: c.green };
  const bg = { q: c.bgSurface, up: c.blueMuted, ai: c.amberMuted, done: c.greenMuted };

  const checkScale = isAnalyzed ? scaleIn(frame, fps, statusDelay + 1.7 * fps) : 0;

  return (
    <div style={{ ...r, backgroundColor: c.bgCard, borderRadius: 14, padding: v ? '14px 16px' : '16px 20px', border: `1px solid ${isAnalyzed ? 'rgba(34,197,94,0.2)' : c.strokeSoft}`, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: isAnalyzed ? c.greenMuted : c.bgSurface, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
            {isAnalyzed ? <span style={{ transform: `scale(${checkScale})`, display: 'inline-block', color: c.green, fontWeight: 700 }}>✓</span> : '📄'}
          </div>
          <div>
            <div style={{ fontFamily: montserrat, fontSize: v ? 12 : 14, fontWeight: 700, color: c.textStrong }}>{name}</div>
            <div style={{ fontFamily: openSans, fontSize: 10, color: c.textSubtle, marginTop: 1 }}>{size}</div>
          </div>
        </div>
        <div style={{ backgroundColor: bg[status], borderRadius: 20, padding: '3px 11px', display: 'flex', alignItems: 'center', gap: 5 }}>
          {status === 'ai' && <div style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: col[status], opacity: 0.4 + (Math.sin(frame * 0.22) + 1) * 0.3 }} />}
          <span style={{ fontFamily: openSans, fontSize: 10, fontWeight: 600, color: col[status] }}>{label[status]}</span>
        </div>
      </div>
      {(isUploading || isProcessing) && (
        <div style={{ height: 3, borderRadius: 2, backgroundColor: c.bgSurface, overflow: 'hidden' }}>
          <div style={{ height: '100%', borderRadius: 2, width: `${Math.min(progress, 100)}%`, backgroundColor: isProcessing ? c.amber : c.blue }} />
        </div>
      )}
      {isAnalyzed && (
        <div style={{
          opacity: interpolate(frame, [statusDelay + 1.8 * fps, statusDelay + 2.1 * fps], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
          display: 'flex', justifyContent: 'flex-end',
        }}>
          <div style={{ backgroundColor: c.primary, borderRadius: 8, padding: '6px 14px', fontFamily: montserrat, fontSize: 11, fontWeight: 700, color: c.bg }}>
            Ver Resultado →
          </div>
        </div>
      )}
    </div>
  );
};

export const ExamUploadScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const v = height > width;

  const titleWords = wordReveal('Upload → IA → Resultado', frame, fps, 0.2 * fps, 0.08);

  const dropReveal = reveal(frame, fps, 0.5 * fps, { y: 20 });

  // Drag animation
  const dragActive = frame > 1 * fps && frame < 2.4 * fps;
  const dragT = dragActive ? interpolate(frame - 1 * fps, [0, 1.4 * fps], [0, 1], { extrapolateRight: 'clamp', easing: Easing.bezier(0.22, 1, 0.36, 1) }) : 0;
  const isDragOver = dragT > 0.2 && dragT < 0.85;

  const bannerReveal = reveal(frame, fps, 2.8 * fps, { y: -12 });

  const pad = v ? 60 : 140;
  const cW = v ? width - 120 : 520;

  return (
    <AbsoluteFill style={{ backgroundColor: c.bg }}>
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse 60% 40% at 30% 50%, rgba(96,165,250,0.04), transparent)` }} />

      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: v ? 'column' : 'row', alignItems: 'center', justifyContent: 'center', padding: pad, gap: v ? 28 : 50 }}>
        {/* Left: title + dropzone */}
        <div style={{ width: cW, display: 'flex', flexDirection: 'column', gap: v ? 18 : 22 }}>
          <div>
            <div style={{ ...reveal(frame, fps, 0), fontFamily: montserrat, fontSize: 12, fontWeight: 700, color: c.textSubtle, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 8 }}>
              Envio de Exames
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap' }}>
              {titleWords.map((w, i) => (
                <span key={i} style={{ ...w.style, fontFamily: montserrat, fontSize: v ? 28 : 36, fontWeight: 700, color: c.textStrong, letterSpacing: -0.5 }}>
                  {w.word}
                </span>
              ))}
            </div>
          </div>

          {/* Dropzone */}
          <div style={{ ...dropReveal, position: 'relative' }}>
            <div style={{
              border: `2px dashed ${isDragOver ? c.blue : c.strokeDefault}`,
              borderRadius: 16, padding: v ? '32px 20px' : '40px 28px', textAlign: 'center',
              backgroundColor: isDragOver ? 'rgba(96,165,250,0.04)' : 'transparent',
            }}>
              <div style={{ width: 52, height: 52, borderRadius: 14, backgroundColor: c.bgSurface, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', fontSize: 24 }}>☁️</div>
              <div style={{ fontFamily: montserrat, fontSize: 16, fontWeight: 700, color: c.textStrong, marginBottom: 5 }}>Arraste seus exames aqui</div>
              <div style={{ fontFamily: openSans, fontSize: 12, color: c.textMuted, marginBottom: 16 }}>ou clique para selecionar</div>
              <div style={{ display: 'inline-block', backgroundColor: c.primary, borderRadius: 10, padding: '10px 24px', fontFamily: montserrat, fontSize: 12, fontWeight: 700, color: c.bg }}>Selecionar Arquivos</div>
              <div style={{ fontFamily: openSans, fontSize: 10, color: c.textSubtle, marginTop: 12 }}>PDF, JPEG, PNG • Máx 50MB</div>
            </div>

            {/* Floating file */}
            {dragActive && (
              <div style={{
                position: 'absolute', left: '50%', top: '32%',
                transform: `translate(-50%, ${interpolate(dragT, [0, 0.5, 1], [-60, 8, 30])}px) scale(${interpolate(dragT, [0, 0.35, 0.85, 1], [0.5, 1, 1, 0.7])})`,
                opacity: interpolate(dragT, [0, 0.1, 0.82, 1], [0, 1, 1, 0], { extrapolateRight: 'clamp' }),
                pointerEvents: 'none',
              }}>
                <div style={{ width: 100, backgroundColor: c.bgCard, borderRadius: 12, padding: '9px 12px', boxShadow: '0 12px 36px rgba(0,0,0,0.4)', border: `1px solid ${c.strokeDefault}`, textAlign: 'center' }}>
                  <div style={{ fontSize: 26, marginBottom: 2 }}>📋</div>
                  <div style={{ fontFamily: openSans, fontSize: 9, color: c.textDefault, fontWeight: 600 }}>hemograma.pdf</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: progress */}
        <div style={{ width: cW, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {frame > 2.8 * fps && (
            <div style={{
              ...bannerReveal,
              background: `linear-gradient(135deg, ${c.blueMuted}, rgba(96,165,250,0.08))`,
              border: `1px solid rgba(96,165,250,0.15)`, borderRadius: 14,
              padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: c.blueMuted, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, transform: `scale(${0.93 + Math.sin(frame * 0.14) * 0.07})` }}>🧠</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: montserrat, fontSize: 14, fontWeight: 700, color: c.blue }}>Processando exames...</div>
                <div style={{ fontFamily: openSans, fontSize: 11, color: c.textMuted, marginTop: 1 }}>IA analisando documentos</div>
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                {[0, 1, 2].map(i => <div key={i} style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: c.blue, opacity: 0.2 + (Math.sin(frame * 0.16 + i * 1.3) + 1) * 0.4 }} />)}
              </div>
            </div>
          )}

          <Sequence from={Math.round(2.6 * fps)} layout="none" premountFor={Math.round(0.5 * fps)}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <FileItem name="Hemograma_Completo.pdf" size="2.4 MB" delay={0} statusDelay={Math.round(0.3 * fps)} v={v} />
              <FileItem name="TSH_T4_Livre.pdf" size="1.8 MB" delay={Math.round(0.12 * fps)} statusDelay={Math.round(0.6 * fps)} v={v} />
              <FileItem name="Perfil_Lipídico.jpg" size="3.1 MB" delay={Math.round(0.24 * fps)} statusDelay={Math.round(1.0 * fps)} v={v} />
            </div>
          </Sequence>
        </div>
      </div>
    </AbsoluteFill>
  );
};
