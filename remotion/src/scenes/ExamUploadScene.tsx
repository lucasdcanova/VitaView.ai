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

const UploadFileItem: React.FC<{
  name: string;
  size: string;
  delay: number;
  statusDelay: number;
  isVertical: boolean;
}> = ({ name, size, delay, statusDelay, isVertical }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const entrance = spring({ frame, fps, delay, config: SPRING_SMOOTH });
  const opacity = interpolate(frame, [delay, delay + 0.3 * fps], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const progressStart = statusDelay;
  const progress = interpolate(frame, [progressStart, progressStart + 2 * fps], [0, 100], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.22, 1, 0.36, 1),
  });

  const isUploading = frame >= progressStart && frame < progressStart + 0.6 * fps;
  const isProcessing = frame >= progressStart + 0.6 * fps && frame < progressStart + 1.5 * fps;
  const isAnalyzed = frame >= progressStart + 1.5 * fps;

  const statusConfig = {
    uploading: { label: 'Enviando...', color: colors.blue500, bg: 'rgba(59,130,246,0.08)' },
    processing: { label: 'IA analisando...', color: colors.amber500, bg: 'rgba(245,158,11,0.08)' },
    analyzed: { label: 'Analisado', color: colors.green600, bg: 'rgba(22,163,106,0.08)' },
    queued: { label: 'Na fila', color: colors.mediumGray, bg: colors.surface2 },
  };
  const currentStatus = isAnalyzed ? 'analyzed' : isProcessing ? 'processing' : isUploading ? 'uploading' : 'queued';
  const s = statusConfig[currentStatus];

  const checkScale = isAnalyzed
    ? spring({ frame, fps, delay: progressStart + 1.5 * fps, config: SPRING_GENTLE })
    : 0;

  return (
    <div
      style={{
        opacity,
        transform: `translateY(${interpolate(entrance, [0, 1], [18, 0])}px)`,
        backgroundColor: colors.pureWhite,
        borderRadius: 14,
        padding: isVertical ? '16px 18px' : '18px 22px',
        border: `1px solid ${isAnalyzed ? 'rgba(22,163,106,0.2)' : colors.strokeSoft}`,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              backgroundColor: isAnalyzed ? 'rgba(22,163,106,0.1)' : colors.surface2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
            }}
          >
            {isAnalyzed ? (
              <div
                style={{
                  transform: `scale(${checkScale})`,
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  backgroundColor: colors.green600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: colors.pureWhite,
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                ✓
              </div>
            ) : '📄'}
          </div>
          <div>
            <div style={{ fontFamily: montserrat, fontSize: isVertical ? 13 : 15, fontWeight: 700, color: colors.charcoal }}>{name}</div>
            <div style={{ fontFamily: openSans, fontSize: 11, color: colors.contentMuted, marginTop: 1 }}>{size}</div>
          </div>
        </div>
        <div style={{ backgroundColor: s.bg, borderRadius: 20, padding: '4px 12px', display: 'flex', alignItems: 'center', gap: 5 }}>
          {currentStatus === 'processing' && (
            <div style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: s.color, opacity: 0.4 + (Math.sin(frame * 0.25) + 1) * 0.3 }} />
          )}
          <span style={{ fontFamily: openSans, fontSize: 11, fontWeight: 600, color: s.color }}>{s.label}</span>
        </div>
      </div>

      {(isUploading || isProcessing) && (
        <div style={{ height: 3, borderRadius: 2, backgroundColor: colors.surface2, overflow: 'hidden' }}>
          <div style={{ height: '100%', borderRadius: 2, width: `${Math.min(progress, 100)}%`, backgroundColor: isProcessing ? colors.amber500 : colors.blue500 }} />
        </div>
      )}

      {isAnalyzed && (
        <div
          style={{
            opacity: interpolate(frame, [progressStart + 1.6 * fps, progressStart + 1.9 * fps], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            }),
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <div style={{ backgroundColor: colors.charcoal, borderRadius: 8, padding: '7px 16px', fontFamily: montserrat, fontSize: 12, fontWeight: 700, color: colors.pureWhite }}>
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
  const isVertical = height > width;

  const titleSpring = spring({ frame, fps, config: SPRING_SMOOTH });
  const titleOpacity = interpolate(frame, [0, 0.4 * fps], [0, 1], { extrapolateRight: 'clamp' });

  // Drag file animation (1s-2.2s)
  const dragActive = frame > 0.8 * fps && frame < 2.2 * fps;
  const dragT = dragActive ? interpolate(frame - 0.8 * fps, [0, 1.4 * fps], [0, 1], { extrapolateRight: 'clamp', easing: Easing.bezier(0.22, 1, 0.36, 1) }) : 0;
  const isDragOver = dragT > 0.25 && dragT < 0.9;
  const fileOpacity = interpolate(dragT, [0, 0.08, 0.85, 1], [0, 1, 1, 0], { extrapolateRight: 'clamp' });
  const fileY = interpolate(dragT, [0, 0.5, 1], [-70, 10, 40]);
  const fileScale = interpolate(dragT, [0, 0.4, 0.85, 1], [0.5, 1, 1, 0.7]);

  // Processing banner
  const bannerSpring = spring({ frame, fps, delay: 2.5 * fps, config: SPRING_SMOOTH });
  const bannerOpacity = interpolate(frame, [2.5 * fps, 2.8 * fps], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  const pad = isVertical ? 50 : 160;
  const contentWidth = isVertical ? width - 100 : 580;

  return (
    <AbsoluteFill style={{ backgroundColor: colors.surface0 }}>
      {/* Centered container */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: isVertical ? 'column' : 'row',
          alignItems: 'center',
          justifyContent: 'center',
          padding: pad,
          gap: isVertical ? 30 : 60,
        }}
      >
        {/* Left column: title + dropzone */}
        <div style={{ width: contentWidth, display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Title */}
          <div style={{ opacity: titleOpacity, transform: `translateY(${interpolate(titleSpring, [0, 1], [20, 0])}px)` }}>
            <div style={{ fontFamily: montserrat, fontSize: 13, fontWeight: 700, color: colors.mediumGray, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 8 }}>
              Envio de Exames
            </div>
            <div style={{ fontFamily: montserrat, fontSize: isVertical ? 32 : 40, fontWeight: 700, color: colors.charcoal, letterSpacing: -1, lineHeight: 1.1 }}>
              Upload → IA → Resultado
            </div>
          </div>

          {/* Drop zone */}
          <div
            style={{
              opacity: interpolate(spring({ frame, fps, delay: 0.3 * fps, config: SPRING_SMOOTH }), [0, 1], [0, 1]),
              transform: `translateY(${interpolate(spring({ frame, fps, delay: 0.3 * fps, config: SPRING_SMOOTH }), [0, 1], [15, 0])}px)`,
              position: 'relative',
            }}
          >
            <div
              style={{
                border: `2px dashed ${isDragOver ? colors.charcoal : colors.lightGray}`,
                borderRadius: 16,
                padding: isVertical ? '36px 24px' : '44px 32px',
                textAlign: 'center',
                backgroundColor: isDragOver ? 'rgba(33,33,33,0.025)' : 'transparent',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <div style={{ width: 56, height: 56, borderRadius: 14, backgroundColor: colors.surface2, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', fontSize: 26 }}>
                ☁️
              </div>
              <div style={{ fontFamily: montserrat, fontSize: 17, fontWeight: 700, color: colors.charcoal, marginBottom: 6 }}>
                Arraste seus exames aqui
              </div>
              <div style={{ fontFamily: openSans, fontSize: 13, color: colors.contentMuted, marginBottom: 18 }}>
                ou clique para selecionar
              </div>
              <div style={{ display: 'inline-block', backgroundColor: colors.charcoal, borderRadius: 10, padding: '11px 26px', fontFamily: montserrat, fontSize: 13, fontWeight: 700, color: colors.pureWhite }}>
                Selecionar Arquivos
              </div>
              <div style={{ fontFamily: openSans, fontSize: 11, color: colors.contentSubtle, marginTop: 14 }}>
                PDF, JPEG, PNG • Max 50MB
              </div>
            </div>

            {/* Floating file */}
            {dragActive && (
              <div
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: '35%',
                  transform: `translate(-50%, ${fileY}px) scale(${fileScale})`,
                  opacity: fileOpacity,
                  pointerEvents: 'none',
                }}
              >
                <div style={{ width: 110, backgroundColor: colors.pureWhite, borderRadius: 12, padding: '10px 14px', boxShadow: '0 14px 44px rgba(0,0,0,0.16)', border: `1px solid ${colors.strokeDefault}`, textAlign: 'center' }}>
                  <div style={{ fontSize: 28, marginBottom: 3 }}>📋</div>
                  <div style={{ fontFamily: openSans, fontSize: 10, color: colors.charcoal, fontWeight: 600 }}>hemograma.pdf</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right column: progress */}
        <div style={{ width: contentWidth, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* AI banner */}
          {frame > 2.5 * fps && (
            <div
              style={{
                opacity: bannerOpacity,
                transform: `translateY(${interpolate(bannerSpring, [0, 1], [-15, 0])}px)`,
                background: 'linear-gradient(135deg, rgba(59,130,246,0.06), rgba(59,130,246,0.1))',
                border: '1px solid rgba(59,130,246,0.15)',
                borderRadius: 14,
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: 14,
              }}
            >
              <div style={{ width: 44, height: 44, borderRadius: 11, backgroundColor: 'rgba(59,130,246,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, transform: `scale(${0.92 + Math.sin(frame * 0.15) * 0.08})` }}>
                🧠
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: montserrat, fontSize: 15, fontWeight: 700, color: '#1e40af' }}>Processando exames...</div>
                <div style={{ fontFamily: openSans, fontSize: 12, color: '#3b82f6', marginTop: 2 }}>IA analisando documentos</div>
              </div>
              <div style={{ display: 'flex', gap: 5 }}>
                {[0, 1, 2].map((i) => (
                  <div key={i} style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#3b82f6', opacity: 0.25 + (Math.sin(frame * 0.18 + i * 1.3) + 1) * 0.37 }} />
                ))}
              </div>
            </div>
          )}

          {/* File items */}
          <Sequence from={Math.round(2.3 * fps)} layout="none" premountFor={Math.round(0.5 * fps)}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <UploadFileItem name="Hemograma_Completo.pdf" size="2.4 MB" delay={0} statusDelay={Math.round(0.3 * fps)} isVertical={isVertical} />
              <UploadFileItem name="TSH_T4_Livre.pdf" size="1.8 MB" delay={Math.round(0.15 * fps)} statusDelay={Math.round(0.6 * fps)} isVertical={isVertical} />
              <UploadFileItem name="Perfil_Lipidico.jpg" size="3.1 MB" delay={Math.round(0.3 * fps)} statusDelay={Math.round(1.0 * fps)} isVertical={isVertical} />
            </div>
          </Sequence>
        </div>
      </div>
    </AbsoluteFill>
  );
};
