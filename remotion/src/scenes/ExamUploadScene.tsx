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
import { colors } from '../theme';
import { montserrat, openSans } from '../fonts';

// File item in the upload list
const UploadFileItem: React.FC<{
  name: string;
  size: string;
  delay: number;
  status: 'queued' | 'uploading' | 'processing' | 'analyzed';
  statusDelay: number;
}> = ({ name, size, delay, status, statusDelay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const entrance = spring({ frame, fps, delay, config: { damping: 200 } });
  const opacity = interpolate(frame, [delay, delay + 0.2 * fps], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Progress bar animation
  const progressStart = statusDelay;
  const progress = interpolate(frame, [progressStart, progressStart + 1.5 * fps], [0, 100], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.quad),
  });

  // Status transitions
  const isUploading = frame >= progressStart && frame < progressStart + 0.5 * fps;
  const isProcessing = frame >= progressStart + 0.5 * fps && frame < progressStart + 1.2 * fps;
  const isAnalyzed = frame >= progressStart + 1.2 * fps;

  const currentStatus = isAnalyzed ? 'analyzed' : isProcessing ? 'processing' : isUploading ? 'uploading' : 'queued';

  const statusConfig = {
    queued: { label: 'Na fila', color: colors.mediumGray, bg: colors.surface2 },
    uploading: { label: 'Enviando...', color: colors.blue500, bg: 'rgba(59,130,246,0.08)' },
    processing: { label: 'IA analisando...', color: colors.amber500, bg: 'rgba(245,158,11,0.08)' },
    analyzed: { label: 'Analisado', color: colors.green600, bg: 'rgba(22,163,106,0.08)' },
  };

  const s = statusConfig[currentStatus];

  // Checkmark animation
  const checkScale = isAnalyzed
    ? spring({ frame, fps, delay: progressStart + 1.2 * fps, config: { damping: 12, stiffness: 160 } })
    : 0;

  return (
    <div
      style={{
        opacity,
        transform: `translateY(${interpolate(entrance, [0, 1], [20, 0])}px)`,
        backgroundColor: colors.pureWhite,
        borderRadius: 14,
        padding: '18px 22px',
        border: `1px solid ${isAnalyzed ? 'rgba(22,163,106,0.25)' : colors.strokeSoft}`,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      {/* File info row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {/* File icon */}
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              backgroundColor: isAnalyzed ? 'rgba(22,163,106,0.1)' : colors.surface2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20,
            }}
          >
            {isAnalyzed ? (
              <div
                style={{
                  transform: `scale(${checkScale})`,
                  width: 22,
                  height: 22,
                  borderRadius: 11,
                  backgroundColor: colors.green600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: colors.pureWhite,
                  fontSize: 13,
                  fontWeight: 700,
                }}
              >
                ✓
              </div>
            ) : (
              <span style={{ color: colors.contentMuted }}>📄</span>
            )}
          </div>
          <div>
            <div style={{ fontFamily: montserrat, fontSize: 15, fontWeight: 700, color: colors.charcoal }}>
              {name}
            </div>
            <div style={{ fontFamily: openSans, fontSize: 12, color: colors.contentMuted, marginTop: 2 }}>
              {size}
            </div>
          </div>
        </div>

        {/* Status badge */}
        <div
          style={{
            backgroundColor: s.bg,
            borderRadius: 20,
            padding: '5px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          {currentStatus === 'processing' && (
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: s.color,
                opacity: 0.5 + Math.sin(frame * 0.25) * 0.5,
              }}
            />
          )}
          <span style={{ fontFamily: openSans, fontSize: 12, fontWeight: 600, color: s.color }}>
            {s.label}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      {(isUploading || isProcessing) && (
        <div
          style={{
            height: 4,
            borderRadius: 2,
            backgroundColor: colors.surface2,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              borderRadius: 2,
              width: `${Math.min(progress, 100)}%`,
              backgroundColor: isProcessing ? colors.amber500 : colors.blue500,
            }}
          />
        </div>
      )}

      {/* Result button */}
      {isAnalyzed && (
        <div
          style={{
            opacity: interpolate(frame, [progressStart + 1.3 * fps, progressStart + 1.5 * fps], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            }),
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <div
            style={{
              backgroundColor: colors.charcoal,
              borderRadius: 8,
              padding: '8px 18px',
              fontFamily: montserrat,
              fontSize: 13,
              fontWeight: 700,
              color: colors.pureWhite,
            }}
          >
            Ver Resultado →
          </div>
        </div>
      )}
    </div>
  );
};

// Drag & drop zone
const DropZone: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const entrance = spring({ frame, fps, delay: 0.3 * fps, config: { damping: 200 } });
  const opacity = interpolate(frame, [0.3 * fps, 0.6 * fps], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // File being dragged in animation
  const dragPhase = frame > 1.2 * fps && frame < 2.2 * fps;
  const dragProgress = dragPhase
    ? interpolate(frame - 1.2 * fps, [0, 0.5 * fps, 0.8 * fps, 1 * fps], [0, 0.6, 0.9, 1], {
        extrapolateRight: 'clamp',
        easing: Easing.out(Easing.quad),
      })
    : 0;

  const isDragOver = dragProgress > 0.3 && dragProgress < 1;
  const isDropped = dragProgress >= 1;

  // Floating file representation
  const fileY = interpolate(dragProgress, [0, 0.6, 1], [-80, 0, 20], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const fileScale = interpolate(dragProgress, [0, 0.5, 0.8, 1], [0.6, 1, 1, 0.8], {
    extrapolateRight: 'clamp',
  });
  const fileOpacity = interpolate(dragProgress, [0, 0.15, 0.85, 1], [0, 1, 1, 0], {
    extrapolateRight: 'clamp',
  });

  // Drop zone pulse
  const borderOpacity = isDragOver
    ? 0.8 + Math.sin(frame * 0.3) * 0.2
    : 0.3;

  return (
    <div
      style={{
        opacity,
        transform: `translateY(${interpolate(entrance, [0, 1], [15, 0])}px)`,
        position: 'relative',
      }}
    >
      <div
        style={{
          border: `2px dashed ${isDragOver ? colors.charcoal : colors.lightGray}`,
          borderRadius: 16,
          padding: '48px 32px',
          textAlign: 'center',
          backgroundColor: isDragOver ? 'rgba(33,33,33,0.03)' : 'transparent',
          borderColor: isDragOver ? colors.charcoal : colors.lightGray,
          borderOpacity,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Upload icon */}
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 16,
            backgroundColor: colors.surface2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            fontSize: 28,
          }}
        >
          ☁️
        </div>
        <div style={{ fontFamily: montserrat, fontSize: 18, fontWeight: 700, color: colors.charcoal, marginBottom: 8 }}>
          Arraste seus exames aqui
        </div>
        <div style={{ fontFamily: openSans, fontSize: 14, color: colors.contentMuted, marginBottom: 20 }}>
          ou clique para selecionar arquivos
        </div>
        <div
          style={{
            display: 'inline-block',
            backgroundColor: colors.charcoal,
            borderRadius: 10,
            padding: '12px 28px',
            fontFamily: montserrat,
            fontSize: 14,
            fontWeight: 700,
            color: colors.pureWhite,
          }}
        >
          Selecionar Arquivos
        </div>
        <div style={{ fontFamily: openSans, fontSize: 12, color: colors.contentSubtle, marginTop: 16 }}>
          PDF, JPEG, PNG • Max 50MB por arquivo
        </div>
      </div>

      {/* Floating file being dragged */}
      {dragPhase && (
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '30%',
            transform: `translate(-50%, ${fileY}px) scale(${fileScale})`,
            opacity: fileOpacity,
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              width: 120,
              backgroundColor: colors.pureWhite,
              borderRadius: 12,
              padding: '12px 16px',
              boxShadow: '0 12px 40px rgba(0,0,0,0.18)',
              border: `1px solid ${colors.strokeDefault}`,
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 4 }}>📋</div>
            <div style={{ fontFamily: openSans, fontSize: 11, color: colors.charcoal, fontWeight: 600 }}>
              hemograma.pdf
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// AI processing banner
const ProcessingBanner: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const entrance = spring({ frame, fps, config: { damping: 15, stiffness: 120 } });
  const opacity = interpolate(frame, [0, 0.3 * fps], [0, 1], {
    extrapolateRight: 'clamp',
  });

  // Pulse animation for the brain icon
  const pulse = 0.9 + Math.sin(frame * 0.2) * 0.1;

  return (
    <div
      style={{
        opacity,
        transform: `translateY(${interpolate(entrance, [0, 1], [-20, 0])}px)`,
        background: 'linear-gradient(135deg, rgba(59,130,246,0.06) 0%, rgba(59,130,246,0.12) 100%)',
        border: '1px solid rgba(59,130,246,0.2)',
        borderRadius: 14,
        padding: '18px 24px',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 12,
          backgroundColor: 'rgba(59,130,246,0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transform: `scale(${pulse})`,
          fontSize: 24,
        }}
      >
        🧠
      </div>
      <div>
        <div style={{ fontFamily: montserrat, fontSize: 16, fontWeight: 700, color: '#1e40af' }}>
          Processando seus exames...
        </div>
        <div style={{ fontFamily: openSans, fontSize: 13, color: '#3b82f6', marginTop: 2 }}>
          Nossa IA esta analisando seus documentos.
        </div>
      </div>

      {/* Animated dots */}
      <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: '#3b82f6',
              opacity: 0.3 + (Math.sin(frame * 0.2 + i * 1.2) + 1) * 0.35,
            }}
          />
        ))}
      </div>
    </div>
  );
};

export const ExamUploadScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOpacity = interpolate(frame, [0, 0.3 * fps], [0, 1], { extrapolateRight: 'clamp' });
  const titleY = interpolate(
    spring({ frame, fps, config: { damping: 200 } }),
    [0, 1],
    [20, 0],
  );

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
          Envio de Exames
        </div>
        <div style={{ fontFamily: montserrat, fontSize: 42, fontWeight: 700, color: colors.charcoal, letterSpacing: -1 }}>
          Upload → IA → Resultado
        </div>
      </div>

      {/* Left: Drop zone */}
      <div
        style={{
          position: 'absolute',
          left: 60,
          top: 180,
          width: 540,
        }}
      >
        <DropZone />
      </div>

      {/* Right: Upload progress + AI processing */}
      <div
        style={{
          position: 'absolute',
          right: 60,
          top: 180,
          width: 540,
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
        {/* Processing banner */}
        <Sequence from={2.5 * fps} layout="none" premountFor={0.5 * fps}>
          <ProcessingBanner />
        </Sequence>

        {/* File items */}
        <Sequence from={2.3 * fps} layout="none" premountFor={0.3 * fps}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <UploadFileItem
              name="Hemograma_Completo.pdf"
              size="2.4 MB"
              delay={0}
              status="analyzed"
              statusDelay={0.4 * fps}
            />
            <UploadFileItem
              name="TSH_T4_Livre.pdf"
              size="1.8 MB"
              delay={0.15 * fps}
              status="processing"
              statusDelay={0.6 * fps}
            />
            <UploadFileItem
              name="Perfil_Lipidico.jpg"
              size="3.1 MB"
              delay={0.3 * fps}
              status="queued"
              statusDelay={0.9 * fps}
            />
          </div>
        </Sequence>
      </div>

      {/* Connection arrow between zones */}
      <div
        style={{
          position: 'absolute',
          left: 615,
          top: 380,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        {frame > 2 * fps && (
          <div
            style={{
              opacity: interpolate(frame - 2 * fps, [0, 0.3 * fps], [0, 1], {
                extrapolateRight: 'clamp',
              }),
            }}
          >
            <svg width="60" height="24" viewBox="0 0 60 24">
              <line x1="0" y1="12" x2="48" y2="12" stroke={colors.charcoal} strokeWidth="2" strokeDasharray="6 4" />
              <polygon points="48,6 60,12 48,18" fill={colors.charcoal} />
            </svg>
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};
