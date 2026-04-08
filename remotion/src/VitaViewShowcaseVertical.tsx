import React from 'react';
import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { c, S } from './theme';
import { montserrat, openSans } from './fonts';
import { fs } from './scale';
import { reveal, wordReveal } from './anim';

type DetailCard = {
  label: string;
  text: string;
};

type Feature = {
  title: string;
  eyebrow: string;
  summary: string;
  bullets: string[];
  chips: string[];
  workflow: DetailCard[];
  outcomes: string[];
  accent: string;
  accentSoft: string;
};

type Segment =
  | { kind: 'intro'; duration: number }
  | { kind: 'overview'; duration: number; activeIndex: number | null }
  | { kind: 'detail'; duration: number; featureIndex: number }
  | { kind: 'migration'; duration: number }
  | { kind: 'outro'; duration: number };

const FEATURES: Feature[] = [
  {
    title: 'Exames com IA',
    eyebrow: 'Resultados estruturados',
    summary:
      'PDFs, imagens e laudos entram no prontuário com leitura automática, estrutura clínica e continuidade no histórico do paciente.',
    bullets: [
      'Upload de laudos, PDFs e imagens no mesmo fluxo',
      'Leitura automática dos achados principais',
      'Comparativo de resultados dentro da evolução clínica',
      'Entrada mais limpa no prontuário do paciente',
    ],
    chips: ['Upload', 'Leitura', 'Histórico'],
    workflow: [
      {
        label: 'Entrada',
        text: 'PDFs, imagens e laudos podem ser enviados sem reorganizar arquivos antes.',
      },
      {
        label: 'Leitura',
        text: 'A plataforma identifica exames, marcadores e achados relevantes para a revisão clínica.',
      },
      {
        label: 'Prontuário',
        text: 'Os dados ficam prontos para comparação e consulta futura dentro do caso.',
      },
    ],
    outcomes: ['Achados organizados', 'Histórico comparável', 'Menos trabalho manual'],
    accent: c.blue,
    accentSoft: c.blueMuted,
  },
  {
    title: 'Anamnese assistida',
    eyebrow: 'Consulta em linguagem clínica',
    summary:
      'A consulta vira texto estruturado com gravação, transcrição, melhoria do texto e extração dos pontos clínicos relevantes.',
    bullets: [
      'Gravação com transcrição durante a consulta',
      'Melhoria do texto clínico com IA sem retrabalho manual',
      'Extração de sintomas, história e contexto do caso',
      'Base pronta para evolução e registro formal',
    ],
    chips: ['Gravação', 'Melhorar', 'Extrair'],
    workflow: [
      {
        label: 'Captação',
        text: 'Médico e paciente entram no mesmo fluxo de transcrição, preservando o contexto da conversa.',
      },
      {
        label: 'Refino',
        text: 'O texto pode ser melhorado para ganhar clareza, densidade clínica e formato mais profissional.',
      },
      {
        label: 'Estrutura',
        text: 'Informações relevantes saem organizadas para a próxima etapa do atendimento.',
      },
    ],
    outcomes: ['Consulta transcrita', 'Texto refinado', 'Dados extraídos'],
    accent: c.primary,
    accentSoft: 'rgba(242,244,248,0.12)',
  },
  {
    title: 'Protocolos de exames',
    eyebrow: 'Pedidos recorrentes',
    summary:
      'Protocolos personalizados reduzem repetição manual e aceleram pedidos por hipótese, especialidade ou rotina da clínica.',
    bullets: [
      'Protocolos por hipótese, especialidade ou linha de cuidado',
      'Aplicação rápida durante a solicitação de exames',
      'Padrão próprio da clínica sem remontar pedidos sempre do zero',
      'Mais consistência entre atendimentos recorrentes',
    ],
    chips: ['Rotina', 'Padrão', 'Agilidade'],
    workflow: [
      {
        label: 'Biblioteca',
        text: 'A clínica pode manter seus protocolos prontos conforme a rotina de solicitação.',
      },
      {
        label: 'Aplicação',
        text: 'Um protocolo inteiro entra no pedido com poucos toques, sem repetir a mesma lista todo dia.',
      },
      {
        label: 'Revisão',
        text: 'O pedido continua claro para revisar, adaptar ou complementar antes de concluir.',
      },
    ],
    outcomes: ['Pedidos rápidos', 'Menos repetição', 'Padrão próprio'],
    accent: c.green,
    accentSoft: c.greenMuted,
  },
  {
    title: 'Prescrição inteligente',
    eyebrow: 'Fluxo completo da receita',
    summary:
      'Busca do medicamento, prescrição, sugestão de dose e alerta de interações ficam no mesmo fluxo antes da emissão final.',
    bullets: [
      'Prescrição digital no contexto do prontuário',
      'Sugestão de dose com IA conforme o caso',
      'Interações, alergias e pontos de atenção antes da emissão',
      'Renovação e manutenção de tratamentos contínuos',
    ],
    chips: ['Receita', 'Dose', 'Interações'],
    workflow: [
      {
        label: 'Busca',
        text: 'O medicamento entra com mais rapidez no fluxo da consulta, sem quebrar a linha de raciocínio.',
      },
      {
        label: 'Apoio',
        text: 'A sugestão de dose ajuda no preenchimento, e as interações aparecem antes da assinatura.',
      },
      {
        label: 'Emissão',
        text: 'A receita sai revisada no mesmo ambiente, com menos ida e volta operacional.',
      },
    ],
    outcomes: ['Dose sugerida', 'Interações revistas', 'Receita pronta'],
    accent: c.amber,
    accentSoft: c.amberMuted,
  },
  {
    title: 'Agenda clínica',
    eyebrow: 'Rotina organizada',
    summary:
      'Consultas, retornos, encaixes e triagem pré-consulta ficam mais claros antes do atendimento e da tomada de decisão.',
    bullets: [
      'Agenda da rotina clínica em uma só visão',
      'Retornos e encaixes com mais previsibilidade',
      'Triagem pré-consulta antes do paciente entrar',
      'Mais contexto para começar o atendimento já orientado',
    ],
    chips: ['Agenda', 'Encaixes', 'Triagem'],
    workflow: [
      {
        label: 'Dia',
        text: 'A visualização da agenda deixa mais claro o fluxo de consultas, retornos e prioridades da rotina.',
      },
      {
        label: 'Pré-consulta',
        text: 'A triagem prepara contexto antes do encontro com o paciente, reduzindo improviso.',
      },
      {
        label: 'Operação',
        text: 'A equipe enxerga melhor a linha do dia e organiza encaixes com menos atrito.',
      },
    ],
    outcomes: ['Consultas do dia', 'Retornos claros', 'Triagem antes da sala'],
    accent: c.textStrong,
    accentSoft: 'rgba(238,242,248,0.12)',
  },
  {
    title: 'Vita Assist',
    eyebrow: 'Assistente contextual',
    summary:
      'O contexto do caso acompanha o atendimento para resumir o quadro, organizar hipóteses e sugerir o próximo passo clínico.',
    bullets: [
      'Resumo do caso durante o atendimento',
      'Organização de hipóteses e próximos passos',
      'Apoio à evolução e ao raciocínio clínico',
      'Menos perda de contexto entre leitura, consulta e conduta',
    ],
    chips: ['Resumo', 'Hipóteses', 'Próximos passos'],
    workflow: [
      {
        label: 'Contexto',
        text: 'O assistente acompanha exames, conversa e histórico para responder dentro do caso real.',
      },
      {
        label: 'Síntese',
        text: 'Resumo clínico, hipóteses e próximo passo aparecem de forma mais objetiva para revisar.',
      },
      {
        label: 'Continuidade',
        text: 'A consulta segue com menos ruptura entre pensar, registrar e decidir.',
      },
    ],
    outcomes: ['Caso resumido', 'Hipóteses organizadas', 'Próximo passo guiado'],
    accent: '#c4b5fd',
    accentSoft: 'rgba(196,181,253,0.14)',
  },
];

const seq = (fps: number, seconds: number) => Math.round(fps * seconds);

const SEGMENTS = (fps: number): Segment[] => [
  { kind: 'intro', duration: seq(fps, 3.0) },
  { kind: 'overview', duration: seq(fps, 1.6), activeIndex: null },
  { kind: 'overview', duration: seq(fps, 1.0), activeIndex: 0 },
  { kind: 'detail', duration: seq(fps, 5.4), featureIndex: 0 },
  { kind: 'overview', duration: seq(fps, 0.8), activeIndex: 1 },
  { kind: 'detail', duration: seq(fps, 5.4), featureIndex: 1 },
  { kind: 'overview', duration: seq(fps, 0.8), activeIndex: 2 },
  { kind: 'detail', duration: seq(fps, 5.4), featureIndex: 2 },
  { kind: 'overview', duration: seq(fps, 0.8), activeIndex: 3 },
  { kind: 'detail', duration: seq(fps, 5.4), featureIndex: 3 },
  { kind: 'overview', duration: seq(fps, 0.8), activeIndex: 4 },
  { kind: 'detail', duration: seq(fps, 5.4), featureIndex: 4 },
  { kind: 'overview', duration: seq(fps, 0.8), activeIndex: 5 },
  { kind: 'detail', duration: seq(fps, 5.4), featureIndex: 5 },
  { kind: 'migration', duration: seq(fps, 3.4) },
  { kind: 'outro', duration: seq(fps, 2.4) },
];

const getSegmentAtFrame = (frame: number, fps: number) => {
  const segments = SEGMENTS(fps);
  let cursor = 0;

  for (const segment of segments) {
    const end = cursor + segment.duration;
    if (frame < end) {
      return { segment, start: cursor, localFrame: frame - cursor, total: end };
    }
    cursor = end;
  }

  const last = segments[segments.length - 1];
  return {
    segment: last,
    start: cursor - last.duration,
    localFrame: last.duration - 1,
    total: cursor,
  };
};

const OverviewGrid: React.FC<{
  frame: number;
  fps: number;
  activeIndex: number | null;
}> = ({ frame, fps, activeIndex }) => {
  const hasFocus = activeIndex !== null;
  const titleReveal = hasFocus
    ? { opacity: 1, transform: 'translate3d(0px, 0px, 0px)' }
    : reveal(frame, fps, 0.12 * fps, { y: 14 });
  const focusProgress = interpolate(frame, [0.04 * fps, 0.88 * fps], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '120px 64px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 900,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            ...titleReveal,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            marginBottom: 28,
          }}
        >
          <Img
            src={staticFile('logo-icon.png')}
            style={{
              width: 88,
              height: 88,
              objectFit: 'contain',
              filter: 'brightness(0) invert(1)',
              opacity: 0.9,
              marginBottom: 18,
            }}
          />
          <div
            style={{
              fontFamily: montserrat,
              fontSize: fs(15, true),
              fontWeight: 700,
              letterSpacing: 3.2,
              color: c.textSubtle,
              textTransform: 'uppercase',
            }}
          >
            Visão geral da plataforma
          </div>
        </div>

        <div
          style={{
            width: '100%',
            display: 'grid',
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
            gap: 18,
          }}
        >
          {FEATURES.map((feature, index) => {
            const tileReveal = hasFocus
              ? { opacity: 1, transform: 'translate3d(0px, 0px, 0px)' }
              : reveal(frame, fps, 0.28 * fps + index * 0.04 * fps, {
                  y: 10,
                });
            const isActive = activeIndex === index;
            const origin = FEATURE_ORIGINS[index];
            const focusTranslateX = isActive ? -origin.x * 0.22 * focusProgress : 0;
            const focusTranslateY = isActive ? -origin.y * 0.18 * focusProgress : 0;
            const focusScale = isActive ? 1 + 0.27 * focusProgress : hasFocus ? 0.92 : 1;
            const cardOpacity = hasFocus ? (isActive ? 1 : 0.24) : 1;
            return (
              <div
                key={feature.title}
                style={{
                  ...tileReveal,
                  opacity: cardOpacity,
                  borderRadius: 24,
                  padding: '22px 20px 18px',
                  border: `1px solid ${isActive ? feature.accent : c.strokeSoft}`,
                  backgroundColor: isActive ? feature.accentSoft : c.bgCard,
                  boxShadow: isActive
                    ? '0 22px 54px rgba(0,0,0,0.3)'
                    : '0 12px 32px rgba(0,0,0,0.18)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                  transform: `${tileReveal.transform} translate3d(${focusTranslateX}px, ${focusTranslateY}px, 0) scale(${focusScale})`,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                  }}
                >
                  <div
                    style={{
                      fontFamily: montserrat,
                      fontSize: fs(11, true),
                      fontWeight: 700,
                      letterSpacing: 2,
                      color: isActive ? feature.accent : c.textSubtle,
                    }}
                  >
                    {String(index + 1).padStart(2, '0')}
                  </div>
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 999,
                      backgroundColor: isActive ? feature.accent : c.strokeStrong,
                    }}
                  />
                </div>

                <div
                  style={{
                    fontFamily: montserrat,
                  fontSize: fs(18, true),
                  fontWeight: 700,
                  color: c.textStrong,
                  lineHeight: 1.16,
                  minHeight: 48,
                }}
              >
                {feature.title}
                </div>

                <div
                  style={{
                    fontFamily: openSans,
                    fontSize: fs(12, true),
                    color: c.textMuted,
                    lineHeight: 1.42,
                  }}
                >
                  {feature.eyebrow}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const FEATURE_ORIGINS = [
  { x: -210, y: -230 },
  { x: 210, y: -230 },
  { x: -210, y: 0 },
  { x: 210, y: 0 },
  { x: -210, y: 230 },
  { x: 210, y: 230 },
];

const MIGRATION_ASSETS = [
  { label: 'Pacientes', width: 116 },
  { label: 'Prontuários', width: 132 },
  { label: 'Consultas', width: 116 },
  { label: 'Horários', width: 108 },
  { label: 'Telefones', width: 118 },
];

const MIGRATION_RESULTS = [
  'Pacientes e contatos',
  'Agenda e horários',
  'Histórico clínico',
];

const StageShell: React.FC<
  React.PropsWithChildren<{
    frame: number;
    fps: number;
    delay?: number;
    maxWidth?: number;
  }>
> = ({ frame, fps, delay = 0.34, maxWidth = 760, children }) => (
  <div
    style={{
      ...reveal(frame, fps, delay * fps, { y: 14 }),
      width: '100%',
      maxWidth,
      margin: '0 auto',
      borderRadius: 34,
      border: `1px solid ${c.strokeSoft}`,
      background:
        'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))',
      backgroundColor: '#111111',
      boxShadow: '0 30px 80px rgba(0,0,0,0.34)',
      overflow: 'hidden',
    }}
  >
    {children}
  </div>
);

const SupportCard: React.FC<{
  frame: number;
  fps: number;
  delay: number;
  title: string;
  text: string;
  tone?: 'default' | 'accent';
  accent?: string;
}> = ({ frame, fps, delay, title, text, tone = 'default', accent = c.textStrong }) => (
  <div
    style={{
      ...reveal(frame, fps, delay * fps, { y: 10 }),
      borderRadius: 22,
      border: `1px solid ${tone === 'accent' ? accent : c.strokeSoft}`,
      backgroundColor:
        tone === 'accent' ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.04)',
      padding: '18px 16px',
      minHeight: 138,
    }}
  >
    <div
      style={{
        fontFamily: montserrat,
        fontSize: fs(10, true),
        fontWeight: 700,
        letterSpacing: 1.6,
        color: tone === 'accent' ? accent : c.textSubtle,
        textTransform: 'uppercase',
        marginBottom: 10,
      }}
    >
      {title}
    </div>
    <div
      style={{
        fontFamily: openSans,
        fontSize: fs(13, true),
        lineHeight: 1.5,
        color: c.textDefault,
      }}
    >
      {text}
    </div>
  </div>
);

const FeatureVisual: React.FC<{
  featureIndex: number;
  feature: Feature;
  frame: number;
  fps: number;
}> = ({ featureIndex, feature, frame, fps }) => {
  if (featureIndex === 0) {
    const uploadProgress = interpolate(frame, [0.42 * fps, 1.52 * fps], [0, 100], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
    const filesOpacity = interpolate(frame, [0.08 * fps, 0.32 * fps], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
    const extractionOpacity = interpolate(frame, [1.42 * fps, 1.96 * fps], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });

    return (
      <StageShell frame={frame} fps={fps} delay={0.04} maxWidth={720}>
        <div style={{ padding: '0 0 22px' }}>
          <div
            style={{
              backgroundColor: '#111111',
              padding: '18px 20px',
              borderBottom: `1px solid ${c.strokeSoft}`,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 12,
                  backgroundColor: 'rgba(255,255,255,0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: `1px solid ${c.strokeSoft}`,
                }}
              >
                <div
                  style={{
                    width: 16,
                    height: 18,
                    borderRadius: 4,
                    border: `1px solid ${c.textStrong}`,
                    opacity: 0.82,
                  }}
                />
              </div>
              <div>
                <div
                  style={{
                    fontFamily: montserrat,
                    fontSize: fs(14, true),
                    fontWeight: 700,
                    color: c.textStrong,
                  }}
                >
                  Envio de exames
                </div>
                <div
                  style={{
                    fontFamily: openSans,
                    fontSize: fs(11, true),
                    color: c.textMuted,
                  }}
                >
                  Arraste arquivos para análise automática
                </div>
              </div>
            </div>
          </div>

          <div style={{ padding: '18px 20px 0', display: 'grid', gap: 14 }}>
            <div
              style={{
                position: 'relative',
                minHeight: 232,
                borderRadius: 24,
                border: `2px dashed ${
                  uploadProgress < 92 ? 'rgba(255,255,255,0.18)' : 'rgba(34,197,94,0.32)'
                }`,
                backgroundColor:
                  uploadProgress < 92 ? 'rgba(255,255,255,0.02)' : 'rgba(34,197,94,0.05)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    width: 66,
                    height: 66,
                    borderRadius: 999,
                    backgroundColor:
                      uploadProgress < 48
                        ? 'rgba(255,255,255,0.06)'
                        : uploadProgress < 92
                        ? 'rgba(245,158,11,0.14)'
                        : 'rgba(34,197,94,0.14)',
                    border: `1px solid ${
                      uploadProgress < 48
                        ? c.strokeStrong
                        : uploadProgress < 92
                        ? c.amber
                        : c.green
                    }`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <div
                    style={{
                      width: uploadProgress < 48 ? 18 : 22,
                      height: uploadProgress < 48 ? 18 : 22,
                      borderRadius: 999,
                      backgroundColor:
                        uploadProgress < 48
                          ? c.textSubtle
                          : uploadProgress < 92
                          ? c.amber
                          : c.green,
                      opacity: 0.9,
                      transform: `scale(${1 + Math.sin(frame * 0.12) * 0.05})`,
                    }}
                  />
                </div>
                <div
                  style={{
                    fontFamily: montserrat,
                    fontSize: fs(15, true),
                    fontWeight: 700,
                    color: c.textStrong,
                  }}
                >
                  {uploadProgress < 20
                    ? '2 arquivos recebidos'
                    : uploadProgress < 48
                    ? 'Arquivos detectados'
                    : uploadProgress < 92
                    ? 'Estruturando resultados...'
                    : 'Integrado ao prontuário'}
                </div>
                {uploadProgress >= 48 && (
                  <div
                    style={{
                      width: 210,
                      height: 8,
                      borderRadius: 999,
                      backgroundColor: 'rgba(255,255,255,0.08)',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        width: `${uploadProgress}%`,
                        height: '100%',
                        borderRadius: 999,
                        backgroundColor: uploadProgress < 92 ? c.amber : c.green,
                      }}
                    />
                  </div>
                )}
                <div
                  style={{
                    fontFamily: openSans,
                    fontSize: fs(10, true),
                    color: c.textMuted,
                  }}
                >
                  PDFs enviados para leitura automática
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gap: 10, opacity: filesOpacity }}>
              {[
                ['hemograma_recente.pdf', '1.2 MB'],
                ['perfil_lipidico.pdf', '840 KB'],
              ].map(([name, size], index) => (
                <div
                  key={name}
                  style={{
                    ...reveal(frame, fps, (0.14 + index * 0.06) * fps, { y: 8 }),
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    borderRadius: 16,
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    border: `1px solid ${c.strokeSoft}`,
                    padding: '12px 14px',
                  }}
                >
                  <div
                    style={{
                      width: 16,
                      height: 18,
                      borderRadius: 4,
                      border: `1px solid ${c.textStrong}`,
                      opacity: 0.72,
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontFamily: openSans,
                        fontSize: fs(12, true),
                        fontWeight: 600,
                        color: c.textDefault,
                        lineHeight: 1.2,
                      }}
                    >
                      {name}
                    </div>
                    <div
                      style={{
                        marginTop: 3,
                        fontFamily: openSans,
                        fontSize: fs(10, true),
                        color: c.textSubtle,
                      }}
                    >
                      {size}
                    </div>
                  </div>
                  <div
                    style={{
                      width: 14,
                      height: 14,
                      borderRadius: 999,
                      backgroundColor:
                        uploadProgress < 48 ? c.strokeStrong : uploadProgress < 92 ? c.amber : c.green,
                      flexShrink: 0,
                    }}
                  />
                </div>
              ))}
            </div>

            <div
              style={{
                opacity: extractionOpacity,
                borderRadius: 18,
                backgroundColor: 'rgba(34,197,94,0.08)',
                border: '1px solid rgba(34,197,94,0.2)',
                padding: '14px 14px 12px',
              }}
            >
              <div
                style={{
                  fontFamily: montserrat,
                  fontSize: fs(9, true),
                  fontWeight: 700,
                  letterSpacing: 1.4,
                  color: '#86efac',
                  textTransform: 'uppercase',
                  marginBottom: 10,
                }}
              >
                Dados estruturados para o prontuário
              </div>
              <div style={{ display: 'grid', gap: 8 }}>
                {[
                  ['Hemograma completo', '18 marcadores'],
                  ['Perfil lipídico', '6 marcadores'],
                  ['Evolução comparativa', 'gerada'],
                ].map(([label, value], index) => (
                  <div
                    key={label}
                    style={{
                      ...reveal(frame, fps, (1.54 + index * 0.06) * fps, { y: 6 }),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 12,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: openSans,
                        fontSize: fs(11, true),
                        color: c.textDefault,
                      }}
                    >
                      {label}
                    </span>
                    <span
                      style={{
                        fontFamily: montserrat,
                        fontSize: fs(9, true),
                        fontWeight: 700,
                        color: '#86efac',
                      }}
                    >
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </StageShell>
    );
  }

  if (featureIndex === 1) {
    return (
      <div>
        <StageShell frame={frame} fps={fps}>
          <div style={{ padding: '14px 24px 24px', display: 'grid', gap: 18 }}>
            <div
              style={{
                borderRadius: 28,
                border: `1px solid ${c.strokeSoft}`,
                backgroundColor: 'rgba(255,255,255,0.03)',
                padding: '26px 22px 22px',
              }}
            >
              <div
                style={{
                  width: 420,
                  margin: '0 auto',
                  borderRadius: 28,
                  backgroundColor: c.bgSurface,
                  padding: '26px 26px 22px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                }}
              >
                <div style={{ position: 'relative', width: 86, height: 86, marginBottom: 18 }}>
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      borderRadius: 999,
                      backgroundColor: 'rgba(239,68,68,0.22)',
                      transform: `scale(${1 + 0.18 * Math.sin(frame * 0.11)})`,
                      opacity: 0.8,
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      inset: 11,
                      borderRadius: 999,
                      backgroundColor: c.red,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 18px 40px rgba(239,68,68,0.26)',
                    }}
                  >
                    <div
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: 999,
                        backgroundColor: c.textStrong,
                      }}
                    />
                  </div>
                </div>
                <div
                  style={{
                    fontFamily: montserrat,
                    fontSize: fs(16, true),
                    fontWeight: 700,
                    color: c.textStrong,
                    marginBottom: 8,
                  }}
                >
                  Ouvindo consulta...
                </div>
                <div
                  style={{
                    fontFamily: openSans,
                    fontSize: fs(13, true),
                    color: c.textMuted,
                    fontStyle: 'italic',
                    lineHeight: 1.48,
                    maxWidth: 290,
                  }}
                >
                  "Paciente relata dor frontal pulsátil há 3 dias, com episódios
                  de náusea..."
                </div>
                <div
                  style={{
                    display: 'flex',
                    gap: 6,
                    marginTop: 18,
                    alignItems: 'end',
                    height: 42,
                  }}
                >
                  {[12, 24, 16, 30, 20, 14, 26, 18, 28, 22].map((h, index) => (
                    <div
                      key={index}
                      style={{
                        width: 7,
                        height: h + Math.sin(frame * 0.22 + index) * 6,
                        borderRadius: 999,
                        backgroundColor: c.textStrong,
                        opacity: 0.9,
                      }}
                    />
                  ))}
                </div>
              </div>

              <div
                style={{
                  marginTop: 18,
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 14,
                }}
              >
                <div
                  style={{
                    ...reveal(frame, fps, 0.78 * fps, { y: 8 }),
                    borderRadius: 20,
                    backgroundColor: c.bgSurface,
                    padding: '16px 16px 14px',
                  }}
                >
                  <div
                    style={{
                      fontFamily: montserrat,
                      fontSize: fs(9, true),
                      letterSpacing: 1.4,
                      color: c.textSubtle,
                      marginBottom: 7,
                    }}
                  >
                    TEXTO ORIGINAL
                  </div>
                  <div
                    style={{
                      fontFamily: openSans,
                      fontSize: fs(12, true),
                      color: c.textMuted,
                      fontStyle: 'italic',
                      lineHeight: 1.5,
                      marginBottom: 12,
                    }}
                  >
                    "paciente ta com dor na cabeça já faz uns 3 dia tb ta com mta
                    ânsia"
                  </div>
                  <div
                    style={{
                      height: 1,
                      backgroundColor: c.strokeSoft,
                      marginBottom: 12,
                    }}
                  />
                  <div
                    style={{
                      fontFamily: montserrat,
                      fontSize: fs(9, true),
                      letterSpacing: 1.4,
                      color: '#86efac',
                      marginBottom: 7,
                    }}
                  >
                    TEXTO REVISADO
                  </div>
                  <div
                    style={{
                      fontFamily: openSans,
                      fontSize: fs(13, true),
                      color: c.textStrong,
                      lineHeight: 1.48,
                    }}
                  >
                    Cefaleia há 3 dias, associada a episódios de náusea.
                  </div>
                </div>

                <div
                  style={{
                    ...reveal(frame, fps, 0.9 * fps, { y: 8 }),
                    borderRadius: 20,
                    backgroundColor: c.bgSurface,
                    padding: '16px 16px 14px',
                  }}
                >
                  <div
                    style={{
                      fontFamily: montserrat,
                      fontSize: fs(9, true),
                      letterSpacing: 1.4,
                      color: c.textSubtle,
                      marginBottom: 10,
                    }}
                  >
                    CONTEXTO EXTRAÍDO
                  </div>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr',
                      gap: 10,
                    }}
                  >
                    {[
                      ['Sinal clínico', 'Dor frontal pulsátil', '#86efac'],
                      ['Comorbidades', 'HAS\nTaquicardia', '#facc15'],
                    ].map(([label, value, color], index) => (
                      <div
                        key={value}
                        style={{
                          ...reveal(frame, fps, (1.0 + index * 0.08) * fps, { y: 8 }),
                          borderRadius: 16,
                          backgroundColor: 'rgba(255,255,255,0.04)',
                          border: `1px solid ${c.strokeSoft}`,
                          padding: '12px 12px 11px',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'flex-start',
                          gap: index === 0 ? 10 : 8,
                          minHeight: index === 0 ? 72 : 78,
                        }}
                      >
                        <div
                          style={{
                          display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                          }}
                        >
                          <div
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: 999,
                              backgroundColor: color,
                              flexShrink: 0,
                            }}
                          />
                          <div
                            style={{
                              fontFamily: montserrat,
                              fontSize: fs(8, true),
                              fontWeight: 700,
                              letterSpacing: 1.1,
                              color: c.textSubtle,
                              textTransform: 'uppercase',
                            }}
                          >
                            {label}
                          </div>
                        </div>
                        <div
                          style={{
                            fontFamily: openSans,
                            fontSize: index === 0 ? fs(13, true) : fs(12, true),
                            fontWeight: 600,
                            color: c.textDefault,
                            lineHeight: 1.32,
                            whiteSpace: 'pre-line',
                          }}
                        >
                          {value}
                        </div>
                        {index === 0 && (
                          <div
                            style={{
                              fontFamily: openSans,
                              fontSize: fs(10, true),
                              color: c.textMuted,
                              lineHeight: 1.34,
                            }}
                          >
                            Dor de cabeça relatada com náusea durante a consulta.
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </StageShell>
      </div>
    );
  }

  if (featureIndex === 2) {
    return (
      <div>
        <StageShell frame={frame} fps={fps}>
          <div style={{ padding: '14px 24px 24px', display: 'grid', gap: 18 }}>
            <div
              style={{
                borderRadius: 30,
                border: `1px solid ${c.strokeSoft}`,
                backgroundColor: 'rgba(255,255,255,0.03)',
                padding: '24px 24px 22px',
              }}
            >
              <div
                style={{
                  maxWidth: 560,
                  margin: '0 auto',
                  borderRadius: 26,
                  border: `1px solid ${c.strokeSoft}`,
                  backgroundColor: c.bgSurface,
                  padding: '18px 18px 16px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: 16,
                    marginBottom: 18,
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontFamily: montserrat,
                        fontSize: fs(15, true),
                        fontWeight: 700,
                        color: c.textStrong,
                      }}
                    >
                      Check-up Metabolico Completo
                    </div>
                    <div
                      style={{
                        fontFamily: openSans,
                        fontSize: fs(12, true),
                        color: c.textMuted,
                        marginTop: 6,
                      }}
                    >
                      Pronto para reutilizar em consultas de acompanhamento.
                    </div>
                  </div>
                  <div
                    style={{
                      borderRadius: 999,
                      backgroundColor: c.greenMuted,
                      border: `1px solid ${c.green}`,
                      padding: '8px 11px',
                      fontFamily: montserrat,
                      fontSize: fs(9, true),
                      fontWeight: 700,
                      letterSpacing: 1.3,
                      color: '#86efac',
                    }}
                  >
                    MODELO
                  </div>
                </div>

                <div style={{ display: 'grid', gap: 10 }}>
                  {[
                    'Hemograma completo',
                    'Ferritina',
                    'Vitamina B12',
                    'TSH + T4 Livre',
                  ].map((item, index) => (
                    <div
                      key={item}
                      style={{
                        ...reveal(frame, fps, (0.58 + index * 0.08) * fps, { y: 8 }),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 14px',
                        borderRadius: 18,
                        backgroundColor: 'rgba(255,255,255,0.04)',
                        border: `1px solid ${c.strokeSoft}`,
                      }}
                    >
                      <div
                        style={{
                          fontFamily: openSans,
                          fontSize: fs(13, true),
                          fontWeight: 600,
                          color: c.textDefault,
                        }}
                      >
                        {item}
                      </div>
                      <div
                        style={{
                          fontFamily: montserrat,
                          fontSize: fs(9, true),
                          fontWeight: 700,
                          letterSpacing: 1.3,
                          color: '#86efac',
                        }}
                      >
                        OK
                      </div>
                    </div>
                  ))}
                </div>

                <div
                  style={{
                    marginTop: 16,
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 12,
                  }}
                >
                  <div
                    style={{
                      ...reveal(frame, fps, 0.94 * fps, { y: 8 }),
                      borderRadius: 18,
                      border: `1px solid ${c.strokeSoft}`,
                      backgroundColor: 'rgba(255,255,255,0.04)',
                      padding: '14px 14px 12px',
                    }}
                  >
                    <div
                      style={{
                        fontFamily: montserrat,
                        fontSize: fs(9, true),
                        letterSpacing: 1.4,
                        color: c.textSubtle,
                        marginBottom: 8,
                      }}
                    >
                      AÇÃO
                    </div>
                    <div
                      style={{
                        fontFamily: openSans,
                        fontSize: fs(13, true),
                        color: c.textStrong,
                        lineHeight: 1.46,
                      }}
                    >
                      Aplicar o protocolo inteiro com poucos toques.
                    </div>
                  </div>
                  <div
                    style={{
                      ...reveal(frame, fps, 1.02 * fps, { y: 8 }),
                      borderRadius: 18,
                      border: `1px solid ${c.strokeSoft}`,
                      backgroundColor: 'rgba(255,255,255,0.04)',
                      padding: '14px 14px 12px',
                    }}
                  >
                    <div
                      style={{
                        fontFamily: montserrat,
                        fontSize: fs(9, true),
                        letterSpacing: 1.4,
                        color: c.textSubtle,
                        marginBottom: 8,
                      }}
                    >
                      RESULTADO
                    </div>
                    <div
                      style={{
                        fontFamily: openSans,
                        fontSize: fs(13, true),
                        color: c.textStrong,
                        lineHeight: 1.46,
                      }}
                    >
                      Pedido mais rápido, claro e fácil de revisar antes de concluir.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </StageShell>
      </div>
    );
  }

  if (featureIndex === 3) {
    const suggestionDrop = interpolate(frame, [0.7 * fps, 1.15 * fps], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });

    return (
      <div>
        <StageShell frame={frame} fps={fps}>
          <div style={{ padding: '14px 24px 24px', display: 'grid', gap: 18 }}>
            <div
              style={{
                borderRadius: 30,
                border: `1px solid ${c.strokeSoft}`,
                backgroundColor: 'rgba(255,255,255,0.03)',
                padding: '24px 24px 22px',
              }}
            >
              <div
                style={{
                  maxWidth: 610,
                  margin: '0 auto',
                  display: 'grid',
                  gap: 14,
                }}
              >
                <div
                  style={{
                    borderRadius: 24,
                    backgroundColor: c.bgSurface,
                    border: `1px solid ${c.strokeSoft}`,
                    padding: '20px 18px 18px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 16,
                    }}
                  >
                    <div
                      style={{
                        fontFamily: openSans,
                        fontSize: fs(13, true),
                        color: c.textDefault,
                      }}
                    >
                      Medicamento / Substância
                    </div>
                    <div
                      style={{
                        fontFamily: montserrat,
                        fontSize: fs(9, true),
                        fontWeight: 700,
                        letterSpacing: 1.2,
                        color: c.textSubtle,
                      }}
                    >
                      BUSCA CONTEXTUAL
                    </div>
                  </div>
                  <div
                    style={{
                      borderRadius: 18,
                      border: `1px solid ${c.strokeStrong}`,
                      backgroundColor: '#181c23',
                      padding: '16px 18px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                    }}
                  >
                    <div style={{ width: 2, height: 28, backgroundColor: c.textStrong }} />
                    <div
                      style={{
                        fontFamily: openSans,
                        fontSize: fs(17, true),
                        color: c.textStrong,
                        fontWeight: 600,
                      }}
                    >
                      Dipi
                    </div>
                  </div>

                  <div
                    style={{
                      marginTop: 10,
                      opacity: suggestionDrop,
                      transform: `translateY(${(1 - suggestionDrop) * -18}px)`,
                      borderRadius: 20,
                      backgroundColor: '#15181f',
                      border: `1px solid ${c.strokeSoft}`,
                      boxShadow: '0 24px 48px rgba(0,0,0,0.24)',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        padding: '12px 14px',
                        backgroundColor: 'rgba(255,255,255,0.04)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div
                        style={{
                          fontFamily: openSans,
                          fontSize: fs(13, true),
                          fontWeight: 600,
                          color: c.textStrong,
                        }}
                      >
                        Dipirona 500mg
                      </div>
                      <div
                        style={{
                          borderRadius: 999,
                          padding: '5px 8px',
                          backgroundColor: 'rgba(255,255,255,0.1)',
                          fontFamily: montserrat,
                          fontSize: fs(8, true),
                          fontWeight: 700,
                          letterSpacing: 1.1,
                          color: c.textStrong,
                        }}
                      >
                        VITA
                      </div>
                    </div>
                    <div style={{ padding: '14px 14px 12px' }}>
                      <div
                        style={{
                          fontFamily: montserrat,
                          fontSize: fs(9, true),
                          fontWeight: 700,
                          letterSpacing: 1.4,
                          color: '#fde68a',
                          marginBottom: 8,
                        }}
                      >
                        SUGESTÃO PARA DOR E FEBRE
                      </div>
                      <div
                        style={{
                          fontFamily: openSans,
                          fontSize: fs(13, true),
                          color: c.textDefault,
                          lineHeight: 1.48,
                          marginBottom: 12,
                        }}
                      >
                        Tomar 1 comprimido a cada 6 horas se necessário.
                      </div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {['Baseado no histórico', 'Peso: 70 kg'].map((item) => (
                          <div
                            key={item}
                            style={{
                              borderRadius: 999,
                              border: `1px solid ${c.strokeSoft}`,
                              padding: '6px 10px',
                              fontFamily: openSans,
                              fontSize: fs(10, true),
                              color: c.textMuted,
                            }}
                          >
                            {item}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gap: 14,
                  }}
                >
                  <div
                    style={{
                      ...reveal(frame, fps, 1.0 * fps, { y: 8 }),
                      borderRadius: 22,
                      border: `1px solid ${c.strokeSoft}`,
                      backgroundColor: 'rgba(255,255,255,0.04)',
                      padding: '16px 16px 16px',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 12,
                        marginBottom: 12,
                      }}
                    >
                      <div
                        style={{
                          fontFamily: montserrat,
                          fontSize: fs(9, true),
                          letterSpacing: 1.4,
                          color: c.textSubtle,
                        }}
                      >
                        INTERAÇÕES RELEVANTES
                      </div>
                      <div
                        style={{
                          borderRadius: 999,
                          backgroundColor: c.amberMuted,
                          border: `1px solid ${c.amber}`,
                          padding: '6px 9px',
                          fontFamily: montserrat,
                          fontSize: fs(8, true),
                          fontWeight: 700,
                          letterSpacing: 1.1,
                          color: '#fde68a',
                        }}
                      >
                        MODERADO
                      </div>
                    </div>
                    <div
                      style={{
                        borderRadius: 16,
                        backgroundColor: c.bgSurface,
                        padding: '13px 12px',
                        marginBottom: 10,
                      }}
                    >
                      <div
                        style={{
                          fontFamily: openSans,
                          fontSize: fs(13, true),
                          fontWeight: 600,
                          color: c.textStrong,
                          marginBottom: 6,
                        }}
                      >
                        Sertralina 50mg + Zolpidem 10mg
                      </div>
                      <div
                        style={{
                          fontFamily: openSans,
                          fontSize: fs(12, true),
                          color: c.textMuted,
                          lineHeight: 1.45,
                        }}
                      >
                      Risco moderado de sedação e piora de atenção no dia seguinte.
                      </div>
                    </div>
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
                        gap: 8,
                      }}
                    >
                      {[
                        ['Histórico cruzado', 'Alergias + uso contínuo'],
                        ['Orientação sugerida', 'Orientar uso noturno'],
                        ['Paciente', '42 anos / 70 kg'],
                        ['Alergia registrada', 'AAS / AINEs'],
                      ].map(([label, value], index) => (
                        <div
                          key={label}
                          style={{
                            display: 'grid',
                            gap: 5,
                            padding: '11px 12px',
                            borderRadius: 14,
                            backgroundColor: c.bgSurface,
                          }}
                        >
                          <div
                            style={{
                              fontFamily: montserrat,
                              fontSize: fs(8, true),
                              fontWeight: 700,
                              letterSpacing: 1.1,
                              color: c.textSubtle,
                              textTransform: 'uppercase',
                            }}
                          >
                            {label}
                          </div>
                          <div
                            style={{
                              fontFamily: openSans,
                              fontSize: fs(11, true),
                              fontWeight: 600,
                              color:
                                index === 1 || index === 3 ? '#fde68a' : c.textStrong,
                              lineHeight: 1.32,
                            }}
                          >
                            {value}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </StageShell>
      </div>
    );
  }

  if (featureIndex === 4) {
    return (
      <div style={{ display: 'grid', gap: 18 }}>
        <StageShell frame={frame} fps={fps} maxWidth={790}>
          <div style={{ padding: '14px 24px 24px', display: 'grid', gap: 18 }}>
            <div
              style={{
                borderRadius: 30,
                border: `1px solid ${c.strokeSoft}`,
                backgroundColor: 'rgba(255,255,255,0.03)',
                padding: '20px 20px 18px',
              }}
            >
              <div
                style={{
                  borderRadius: 24,
                  backgroundColor: c.bgSurface,
                  padding: '18px 18px 16px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 16,
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontFamily: montserrat,
                        fontSize: fs(15, true),
                        fontWeight: 700,
                        color: c.textStrong,
                      }}
                    >
                      Agenda da Semana
                    </div>
                    <div
                      style={{
                        fontFamily: openSans,
                        fontSize: fs(12, true),
                        color: c.textMuted,
                        marginTop: 5,
                      }}
                    >
                      Consultas, retornos, exames e urgências em uma leitura só.
                    </div>
                  </div>
                  <div
                    style={{
                      borderRadius: 999,
                      padding: '8px 10px',
                      backgroundColor: 'rgba(255,255,255,0.06)',
                      fontFamily: montserrat,
                      fontSize: fs(8, true),
                      fontWeight: 700,
                      letterSpacing: 1.1,
                      color: c.textSubtle,
                      textAlign: 'center',
                      minWidth: 92,
                    }}
                  >
                    10 CONSULTAS
                  </div>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                    gap: 10,
                  }}
                >
                  {[
                    {
                      day: 'Seg',
                      items: [
                        ['09:00', 'Maria Silva', '#60a5fa'],
                        ['14:30', 'João Santos', '#22c55e'],
                      ],
                    },
                    {
                      day: 'Ter',
                      items: [
                        ['08:00', 'Pedro Lima', '#f87171'],
                        ['11:00', 'Carla Mendes', '#60a5fa'],
                      ],
                    },
                    {
                      day: 'Qua',
                      items: [
                        ['09:30', 'Lúcia Alves', '#60a5fa'],
                        ['13:00', 'Fernando Costa', '#f59e0b'],
                        ['15:00', 'Roberto Silva', '#22c55e'],
                      ],
                    },
                  ].map((day, colIndex) => (
                    <div
                      key={day.day}
                      style={{
                        ...reveal(frame, fps, (0.58 + colIndex * 0.08) * fps, { y: 8 }),
                        borderRadius: 18,
                        backgroundColor: '#171b22',
                        padding: '12px 10px',
                        minHeight: 232,
                      }}
                    >
                      <div
                        style={{
                          fontFamily: montserrat,
                          fontSize: fs(10, true),
                          fontWeight: 700,
                          color: c.textStrong,
                          marginBottom: 10,
                        }}
                      >
                        {day.day}
                      </div>
                      <div style={{ display: 'grid', gap: 8 }}>
                        {day.items.map(([time, name, color], index) => (
                          <div
                            key={`${day.day}-${time}`}
                            style={{
                              borderRadius: 14,
                              backgroundColor: 'rgba(255,255,255,0.05)',
                              borderLeft: `4px solid ${color}`,
                              padding: '9px 9px 9px 10px',
                              transform: `translateY(${Math.sin(
                                frame * 0.06 + colIndex + index,
                              ) * 1.5}px)`,
                            }}
                          >
                            <div
                              style={{
                                fontFamily: montserrat,
                                fontSize: fs(9, true),
                                fontWeight: 700,
                                color: c.textStrong,
                                marginBottom: 3,
                              }}
                            >
                              {time}
                            </div>
                            <div
                              style={{
                                fontFamily: openSans,
                                fontSize: fs(11, true),
                                fontWeight: 600,
                                color: c.textDefault,
                                lineHeight: 1.3,
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                            >
                              {name}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div
                  style={{
                    marginTop: 14,
                    display: 'flex',
                    justifyContent: 'center',
                    gap: 20,
                  }}
                >
                  {[
                    ['Consulta', '#60a5fa'],
                    ['Retorno', '#22c55e'],
                    ['Exames', '#f59e0b'],
                    ['Urgência', '#f87171'],
                  ].map(([label, color]) => (
                    <div
                      key={label}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        fontFamily: openSans,
                        fontSize: fs(11, true),
                        color: c.textMuted,
                      }}
                    >
                      <div
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: 999,
                          backgroundColor: color,
                        }}
                      />
                      {label}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </StageShell>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            gap: 14,
          }}
        >
          <SupportCard
            frame={frame}
            fps={fps}
            delay={0.88}
            title="Retornos do dia"
            text="Paciente, horário e contexto principal aparecem sem abrir outra tela."
          />
          <SupportCard
            frame={frame}
            fps={fps}
            delay={0.96}
            title="Triagem pré-consulta"
            text="A equipe entra no atendimento com mais contexto e menos improviso."
            tone="accent"
            accent={feature.accent}
          />
          <SupportCard
            frame={frame}
            fps={fps}
            delay={1.04}
            title="Rotina contínua"
            text="Consultas, encaixes e exames ficam no mesmo fluxo de acompanhamento."
          />
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <StageShell frame={frame} fps={fps}>
        <div style={{ padding: '14px 24px 24px', display: 'grid', gap: 18 }}>
          <div
            style={{
              borderRadius: 30,
              border: `1px solid ${c.strokeSoft}`,
              backgroundColor: 'rgba(255,255,255,0.03)',
              padding: '20px 20px 18px',
            }}
          >
            <div
              style={{
                maxWidth: 620,
                margin: '0 auto',
                overflow: 'hidden',
                borderRadius: 28,
                border: `1px solid ${c.strokeSoft}`,
                backgroundColor: '#111111',
                boxShadow: '0 24px 70px rgba(0,0,0,0.36)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderBottom: `1px solid ${c.strokeSoft}`,
                  backgroundColor: 'rgba(255,255,255,0.03)',
                  padding: '16px 18px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 14,
                      border: `1px solid ${c.strokeSoft}`,
                      backgroundColor: 'rgba(255,255,255,0.06)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: montserrat,
                      fontSize: fs(10, true),
                      fontWeight: 700,
                      color: c.textStrong,
                    }}
                  >
                    AI
                  </div>
                  <div>
                    <div
                      style={{
                        fontFamily: montserrat,
                        fontSize: fs(13, true),
                        fontWeight: 700,
                        color: c.textStrong,
                      }}
                    >
                      Vita Assist
                    </div>
                    <div
                      style={{
                        fontFamily: openSans,
                        fontSize: fs(11, true),
                        color: c.textMuted,
                      }}
                    >
                      Chat clínico contextual dentro da plataforma
                    </div>
                  </div>
                </div>
                <div
                  style={{
                    fontFamily: montserrat,
                    fontSize: fs(8, true),
                    fontWeight: 700,
                    letterSpacing: 1.2,
                    color: c.textSubtle,
                  }}
                >
                  CASO ATIVO
                </div>
              </div>

              <div style={{ borderBottom: `1px solid ${c.strokeSoft}`, padding: '14px 18px' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {['Histórico clínico', 'Exames recentes', 'Paciente em atendimento'].map(
                    (chip, index) => (
                      <div
                        key={chip}
                        style={{
                          ...reveal(frame, fps, (0.62 + index * 0.08) * fps, { y: 8 }),
                          borderRadius: 999,
                          border: `1px solid ${c.strokeSoft}`,
                          backgroundColor: 'rgba(255,255,255,0.04)',
                          padding: '8px 12px',
                          fontFamily: openSans,
                          fontSize: fs(11, true),
                          color: c.textDefault,
                        }}
                      >
                        {chip}
                      </div>
                    ),
                  )}
                </div>
              </div>

              <div style={{ padding: '20px 18px 18px', display: 'grid', gap: 16 }}>
                <div
                  style={{
                    ...reveal(frame, fps, 0.74 * fps, { y: 8 }),
                    marginLeft: 'auto',
                    maxWidth: 340,
                    borderRadius: 22,
                    borderBottomRightRadius: 8,
                    backgroundColor: c.textStrong,
                    color: c.bg,
                    padding: '14px 15px',
                    fontFamily: openSans,
                    fontSize: fs(13, true),
                    fontWeight: 600,
                    lineHeight: 1.44,
                  }}
                >
                  Organize os pontos principais antes da consulta.
                </div>

                <div
                  style={{
                    ...reveal(frame, fps, 0.92 * fps, { y: 8 }),
                    maxWidth: 470,
                    borderRadius: 24,
                    borderBottomLeftRadius: 8,
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    border: `1px solid ${c.strokeSoft}`,
                    padding: '16px 16px 14px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <div
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 999,
                        backgroundColor: c.textStrong,
                        color: c.bg,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontFamily: montserrat,
                        fontSize: fs(9, true),
                        fontWeight: 700,
                      }}
                    >
                      AI
                    </div>
                    <div>
                      <div
                        style={{
                          fontFamily: montserrat,
                          fontSize: fs(11, true),
                          fontWeight: 700,
                          color: c.textStrong,
                        }}
                      >
                        Contexto carregado
                      </div>
                      <div
                        style={{
                          fontFamily: openSans,
                          fontSize: fs(10, true),
                          color: c.textMuted,
                        }}
                      >
                        Resumo do caso
                      </div>
                    </div>
                  </div>
                  <div
                    style={{
                      borderRadius: 18,
                      backgroundColor: 'rgba(0,0,0,0.18)',
                      padding: '14px 13px',
                    }}
                  >
                    <div
                      style={{
                        fontFamily: openSans,
                        fontSize: fs(13, true),
                        color: c.textDefault,
                        lineHeight: 1.52,
                      }}
                    >
                      Sintomas persistentes, ferritina reduzida e histórico recente
                      já reunidos em um resumo para revisão rápida.
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    ...reveal(frame, fps, 1.08 * fps, { y: 8 }),
                    borderRadius: 20,
                    border: `1px solid ${c.strokeSoft}`,
                    backgroundColor: '#161616',
                    padding: '13px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                  }}
                >
                  <div
                    style={{
                      fontFamily: openSans,
                      fontSize: fs(12, true),
                      color: c.textDefault,
                    }}
                  >
                    Pergunte sobre o caso, peça um resumo ou monte um rascunho clínico.
                  </div>
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 999,
                      backgroundColor: c.textStrong,
                      color: c.bg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: montserrat,
                      fontSize: fs(10, true),
                      fontWeight: 700,
                    }}
                  >
                    ^
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </StageShell>

    </div>
  );
};

const FeatureDetail: React.FC<{
  feature: Feature;
  frame: number;
  fps: number;
  featureIndex: number;
  duration: number;
}> = ({ feature, frame, fps, featureIndex, duration }) => {
  const isExamFeature = featureIndex === 0;
  const exitFrames = 0.62 * fps;
  const entrySpring = spring({ frame, fps, config: S.gentle });
  const examEntry = interpolate(frame, [0, 0.64 * fps], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const entryProgress = isExamFeature ? examEntry : entrySpring;
  const exitProgress = interpolate(frame, [duration - exitFrames, duration], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const origin = FEATURE_ORIGINS[featureIndex];
  const shellScale =
    interpolate(entryProgress, [0, 1], [isExamFeature ? 0.88 : 0.58, 1]) -
    interpolate(exitProgress, [0, 1], [0, isExamFeature ? 0.34 : 0.42]);
  const shellTranslateX =
    interpolate(entryProgress, [0, 1], [origin.x * (isExamFeature ? 0.56 : 1.04), 0]) +
    interpolate(exitProgress, [0, 1], [0, origin.x * 0.92]);
  const shellTranslateY =
    interpolate(entryProgress, [0, 1], [origin.y * (isExamFeature ? 0.54 : 1.02), 0]) +
    interpolate(exitProgress, [0, 1], [0, origin.y * 0.92]);
  const shellRotate =
    interpolate(
      entryProgress,
      [0, 1],
      [origin.x < 0 ? (isExamFeature ? -1.2 : -4.8) : isExamFeature ? 1.2 : 4.8, 0],
    ) +
    interpolate(exitProgress, [0, 1], [0, origin.x < 0 ? -3.2 : 3.2]);
  const shellOpacity =
    interpolate(frame, [0, (isExamFeature ? 0.16 : 0.4) * fps], [isExamFeature ? 0.7 : 0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }) * interpolate(exitProgress, [0, 1], [1, 0], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
  const contentOpacity = interpolate(
    frame,
    [(isExamFeature ? 0.04 : 0.34) * fps, (isExamFeature ? 0.42 : 1.08) * fps],
    [isExamFeature ? 0.4 : 0, 1],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    },
  ) * interpolate(exitProgress, [0, 1], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const titleScale =
    interpolate(entryProgress, [0, 1], [isExamFeature ? 1.05 : 1.24, 1]) -
    interpolate(exitProgress, [0, 1], [0, 0.12]);
  const titleTranslateY =
    interpolate(entryProgress, [0, 1], [isExamFeature ? -6 : -24, 0]) +
    interpolate(exitProgress, [0, 1], [0, 10]);
  const panelReveal = reveal(frame, fps, (isExamFeature ? 0 : 0.08) * fps, { y: isExamFeature ? 6 : 12 });
  const summaryReveal = reveal(frame, fps, (isExamFeature ? 0.04 : 0.28) * fps, { y: isExamFeature ? 4 : 10 });

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div
        style={{
          width: 900,
          maxWidth: '86vw',
          opacity: shellOpacity,
          transform: `translate3d(${shellTranslateX}px, ${shellTranslateY}px, 0) scale(${shellScale}) rotate(${shellRotate}deg)`,
          display: 'flex',
          flexDirection: 'column',
          gap: 24,
        }}
      >
        <div>
          <div style={{ ...panelReveal, display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: montserrat, fontSize: fs(11, true), fontWeight: 700, letterSpacing: 2.2, color: feature.accent, textTransform: 'uppercase', marginBottom: 12 }}>
                {feature.eyebrow}
              </div>
              <div
                style={{
                  fontFamily: montserrat,
                  fontSize: featureIndex === 2 ? fs(29, true) : featureIndex === 3 ? fs(28, true) : fs(33, true),
                  fontWeight: 700,
                  color: c.textStrong,
                  lineHeight: 1.04,
                  maxWidth: 700,
                  transform: `translateY(${titleTranslateY}px) scale(${titleScale})`,
                  transformOrigin: 'center center',
                  whiteSpace: featureIndex === 2 || featureIndex === 3 ? 'nowrap' : 'normal',
                }}
              >
                {feature.title}
              </div>
            </div>
          </div>
          <p style={{ ...summaryReveal, opacity: contentOpacity, margin: '0 auto', fontFamily: openSans, fontSize: fs(17, true), color: c.textMuted, lineHeight: 1.58, maxWidth: 760, textAlign: 'center' }}>
            {feature.summary}
          </p>
        </div>
        <div style={{ opacity: contentOpacity }}>
          <FeatureVisual featureIndex={featureIndex} feature={feature} frame={frame} fps={fps} />
        </div>
      </div>
    </div>
  );
};

export const VitaViewShowcaseVertical: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { segment, localFrame } = getSegmentAtFrame(frame, fps);

  const introWords = wordReveal(
    'Prontuário Médico Inteligente',
    localFrame,
    fps,
    1.0 * fps,
    0.07,
  );
  const overviewFrame = segment.kind === 'overview' ? localFrame : 0;
  const detailFrame = segment.kind === 'detail' ? localFrame : 0;
  const migrationFrame = segment.kind === 'migration' ? localFrame : 0;
  const outroFrame = segment.kind === 'outro' ? localFrame : 0;

  return (
    <AbsoluteFill style={{ backgroundColor: c.bg }}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse 60% 38% at 50% 20%, rgba(149,163,188,0.06), transparent), radial-gradient(ellipse 46% 30% at 50% 84%, rgba(34,197,94,0.04), transparent)',
        }}
      />

      {segment.kind === 'intro' && (
        <AbsoluteFill
          style={{
            justifyContent: 'center',
            alignItems: 'center',
            padding: '0 40px',
          }}
        >
          <Img
            src={staticFile('logo-full.png')}
            style={{
              height: 160,
              objectFit: 'contain',
              filter: 'brightness(0) invert(1)',
              transform: `translateY(${interpolate(
                spring({ frame: localFrame, fps, config: S.gentle }),
                [0, 1],
                [40, 0],
              )}px)`,
              opacity: interpolate(localFrame, [0, 0.7 * fps], [0, 1], {
                extrapolateRight: 'clamp',
              }),
            }}
          />

          <div
            style={{
              width: interpolate(localFrame, [0.9 * fps, 1.8 * fps], [0, 180], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              }),
              height: 2.5,
              backgroundColor: c.primaryMuted,
              borderRadius: 2,
              marginTop: 28,
              opacity: interpolate(localFrame, [1.0 * fps, 1.8 * fps], [0, 0.5], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              }),
            }}
          />

          <div
            style={{
              marginTop: 22,
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              maxWidth: 760,
            }}
          >
            {introWords.map((word, index) => (
              <span
                key={index}
                style={{
                  ...word.style,
                  fontFamily: openSans,
                  fontSize: fs(28, true),
                  color: c.textMuted,
                  fontWeight: 500,
                  textAlign: 'center',
                }}
              >
                {word.word}
              </span>
            ))}
          </div>
        </AbsoluteFill>
      )}

      {segment.kind === 'overview' && (
        <OverviewGrid
          frame={overviewFrame}
          fps={fps}
          activeIndex={segment.activeIndex}
        />
      )}

      {segment.kind === 'detail' && (
        <FeatureDetail
          feature={FEATURES[segment.featureIndex]}
          frame={detailFrame}
          fps={fps}
          featureIndex={segment.featureIndex}
          duration={segment.duration}
        />
      )}

      {segment.kind === 'migration' && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            padding: '88px 56px 64px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              ...reveal(migrationFrame, fps, 0.12 * fps, { y: 18 }),
              width: '100%',
              maxWidth: 920,
              borderRadius: 34,
              border: `1px solid ${c.strokeStrong}`,
              backgroundColor: c.bgCard,
              boxShadow: '0 24px 70px rgba(0,0,0,0.28)',
              padding: '34px 30px 30px',
            }}
          >
            <div
              style={{
                fontFamily: montserrat,
                fontSize: fs(12, true),
                fontWeight: 700,
                letterSpacing: 2,
                color: c.textSubtle,
                textTransform: 'uppercase',
                marginBottom: 12,
              }}
            >
              Já utiliza um outro sistema?
            </div>
            <div
              style={{
                fontFamily: montserrat,
                fontSize: fs(34, true),
                fontWeight: 700,
                color: c.textStrong,
                lineHeight: 1.06,
                marginBottom: 12,
              }}
            >
              Migração Assistida
            </div>
            <p
              style={{
                margin: 0,
                fontFamily: openSans,
                fontSize: fs(17, true),
                color: c.textMuted,
                lineHeight: 1.58,
              }}
            >
              A transição para o VitaView acontece com apoio da equipe do início ao fim,
              reduzindo atrito na mudança de pacientes, agenda e histórico clínico.
            </p>

            <div
              style={{
                display: 'grid',
                gap: 12,
                marginTop: 24,
              }}
            >
              {[
                'Levantamento da base atual',
                'Entrada assistida no novo fluxo',
                'Virada acompanhada pela equipe',
              ].map((item, index) => (
                <div
                  key={item}
                  style={{
                    ...reveal(migrationFrame, fps, (0.38 + index * 0.13) * fps, {
                      y: 10,
                    }),
                    borderRadius: 18,
                    border: `1px solid ${c.strokeSoft}`,
                    backgroundColor: c.bgSurface,
                    padding: '14px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                  }}
                >
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 10,
                      backgroundColor: c.primary,
                      color: c.bg,
                      fontFamily: montserrat,
                      fontSize: fs(12, true),
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {index + 1}
                  </div>
                  <div
                    style={{
                      fontFamily: openSans,
                      fontSize: fs(15, true),
                      fontWeight: 600,
                      color: c.textDefault,
                    }}
                  >
                    {item}
                  </div>
                </div>
                ))}
            </div>

            <div
              style={{
                ...reveal(migrationFrame, fps, 0.72 * fps, { y: 12 }),
                marginTop: 22,
                borderRadius: 26,
                border: `1px solid ${c.strokeSoft}`,
                backgroundColor: '#101010',
                padding: '16px 16px 18px',
                overflow: 'hidden',
                boxShadow: '0 24px 60px rgba(0,0,0,0.24)',
              }}
            >
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                  gap: 10,
                  marginBottom: 14,
                }}
              >
                {[
                  ['Sistema atual', 'Mapeamento seguro da base'],
                  ['Equipe VitaView', 'Condução assistida da migração'],
                ].map(([label, sub]) => (
                  <div
                    key={label}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      borderRadius: 18,
                      border: '1px solid rgba(255,255,255,0.08)',
                      backgroundColor: 'rgba(255,255,255,0.05)',
                      padding: '12px 12px',
                    }}
                  >
                    <div
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: 10,
                        backgroundColor: 'rgba(255,255,255,0.07)',
                        border: '1px solid rgba(255,255,255,0.08)',
                      }}
                    />
                    <div>
                      <div
                        style={{
                          fontFamily: montserrat,
                          fontSize: fs(8, true),
                          fontWeight: 700,
                          letterSpacing: 1.2,
                          color: 'rgba(255,255,255,0.42)',
                          textTransform: 'uppercase',
                        }}
                      >
                        {label}
                      </div>
                      <div
                        style={{
                          marginTop: 3,
                          fontFamily: openSans,
                          fontSize: fs(10, true),
                          fontWeight: 600,
                          color: 'rgba(255,255,255,0.78)',
                        }}
                      >
                        {sub}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div
                style={{
                  position: 'relative',
                  height: 430,
                  borderRadius: 20,
                  background:
                    'linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.015))',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background:
                      'radial-gradient(circle at 50% 48%, rgba(255,255,255,0.06), transparent 42%)',
                    opacity: 0.8,
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    inset: 18,
                    display: 'grid',
                    gridTemplateColumns: '0.8fr 0.56fr 1.34fr',
                    gap: 14,
                    alignItems: 'start',
                  }}
                >
                  <div
                    style={{
                      borderRadius: 18,
                      border: '1px solid rgba(255,255,255,0.08)',
                      backgroundColor: 'rgba(255,255,255,0.03)',
                      padding: '14px 12px 16px',
                      display: 'grid',
                      alignContent: 'start',
                      gap: 12,
                    }}
                  >
                    <div
                      style={{
                        display: 'grid',
                        gap: 5,
                      }}
                    >
                      <div
                        style={{
                          fontFamily: montserrat,
                          fontSize: fs(8, true),
                          fontWeight: 700,
                          letterSpacing: 1.2,
                          color: 'rgba(255,255,255,0.42)',
                          textTransform: 'uppercase',
                        }}
                      >
                        Sistema atual
                      </div>
                      <div
                        style={{
                          fontFamily: openSans,
                          fontSize: fs(9, true),
                          color: 'rgba(255,255,255,0.72)',
                          lineHeight: 1.28,
                        }}
                      >
                        Base atual mapeada.
                      </div>
                    </div>
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr',
                        gap: 8,
                        alignContent: 'start',
                      }}
                    >
                      {MIGRATION_ASSETS.map((asset, index) => (
                        <div
                          key={asset.label}
                          style={{
                            ...reveal(migrationFrame, fps, (0.82 + index * 0.05) * fps, {
                              y: 6,
                            }),
                            borderRadius: 14,
                            border: '1px solid rgba(255,255,255,0.14)',
                            backgroundColor: 'rgba(255,255,255,0.08)',
                            padding: '8px 10px',
                            minHeight: 34,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            textAlign: 'center',
                            fontFamily: openSans,
                            fontSize: fs(9, true),
                            fontWeight: 600,
                            color: 'rgba(255,255,255,0.86)',
                            lineHeight: 1.22,
                          }}
                        >
                          {asset.label}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div
                    style={{
                      borderRadius: 18,
                      border: '1px solid rgba(255,255,255,0.08)',
                      backgroundColor: 'rgba(255,255,255,0.035)',
                      padding: '14px 12px 16px',
                      display: 'grid',
                      alignContent: 'start',
                      gap: 12,
                    }}
                  >
                    <div
                      style={{
                        fontFamily: montserrat,
                        fontSize: fs(8, true),
                        fontWeight: 700,
                        letterSpacing: 1.2,
                        color: 'rgba(255,255,255,0.42)',
                        textTransform: 'uppercase',
                      }}
                    >
                      Transferência assistida
                    </div>
                    <div
                      style={{
                        fontFamily: openSans,
                        fontSize: fs(9, true),
                        color: 'rgba(255,255,255,0.72)',
                        lineHeight: 1.28,
                      }}
                    >
                      Entrada assistida.
                    </div>
                    <div
                      style={{
                        position: 'relative',
                        height: 44,
                        borderRadius: 16,
                        border: '1px solid rgba(255,255,255,0.08)',
                        backgroundColor: 'rgba(255,255,255,0.04)',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          position: 'absolute',
                          left: 14,
                          right: 14,
                          top: '50%',
                          height: 2,
                          backgroundColor: 'rgba(255,255,255,0.16)',
                          transform: 'translateY(-50%)',
                        }}
                      />
                      <div
                        style={{
                          position: 'absolute',
                          left: 14,
                          top: '50%',
                          width: `${interpolate(
                            migrationFrame,
                            [1.0 * fps, 1.72 * fps],
                            [8, 138],
                            {
                              extrapolateLeft: 'clamp',
                              extrapolateRight: 'clamp',
                            },
                          )}px`,
                          height: 2,
                          background:
                            'linear-gradient(90deg, rgba(255,255,255,0.22), rgba(134,239,172,0.9))',
                          transform: 'translateY(-50%)',
                          boxShadow: '0 0 14px rgba(134,239,172,0.35)',
                        }}
                      />
                      <div
                        style={{
                          position: 'absolute',
                          left: `${interpolate(
                            migrationFrame,
                            [1.0 * fps, 1.72 * fps],
                            [18, 146],
                            {
                              extrapolateLeft: 'clamp',
                              extrapolateRight: 'clamp',
                            },
                          )}px`,
                          top: '50%',
                          width: 16,
                          height: 16,
                          borderRadius: 999,
                          backgroundColor: '#86efac',
                          transform: 'translate(-50%, -50%)',
                          boxShadow: '0 0 18px rgba(134,239,172,0.48)',
                        }}
                      />
                    </div>
                    <div style={{ display: 'grid', gap: 8 }}>
                      {[
                        'Mapeamento da base',
                        'Validação dos dados',
                        'Importação acompanhada',
                      ].map((step, index) => (
                        <div
                          key={step}
                          style={{
                            ...reveal(migrationFrame, fps, (1.04 + index * 0.1) * fps, {
                              y: 6,
                            }),
                            borderRadius: 14,
                            backgroundColor: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            padding: '10px 10px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 9,
                          }}
                        >
                          <div
                            style={{
                              width: 18,
                              height: 18,
                              borderRadius: 999,
                              backgroundColor: 'rgba(134,239,172,0.16)',
                              border: '1px solid rgba(134,239,172,0.42)',
                              color: '#86efac',
                              fontFamily: montserrat,
                              fontSize: fs(9, true),
                              fontWeight: 700,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            {index + 1}
                          </div>
                          <div
                            style={{
                              fontFamily: openSans,
                              fontSize: fs(9, true),
                              fontWeight: 600,
                              color: 'rgba(255,255,255,0.84)',
                              lineHeight: 1.26,
                            }}
                          >
                            {step}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div
                    style={{
                      borderRadius: 20,
                      border: '1px solid rgba(255,255,255,0.1)',
                      backgroundColor: 'rgba(255,255,255,0.05)',
                      padding: '14px 14px 16px',
                      display: 'grid',
                      alignContent: 'start',
                      gap: 12,
                    }}
                  >
                    <div
                      style={{
                        fontFamily: montserrat,
                        fontSize: fs(9, true),
                        fontWeight: 700,
                        letterSpacing: 1.3,
                        color: 'rgba(255,255,255,0.42)',
                        textTransform: 'uppercase',
                      }}
                    >
                      VitaView
                    </div>
                    <div
                      style={{
                        fontFamily: openSans,
                        fontSize: fs(10, true),
                        fontWeight: 600,
                        color: 'rgba(255,255,255,0.82)',
                        lineHeight: 1.3,
                        marginBottom: 4,
                      }}
                    >
                      Dados organizados com continuidade
                    </div>
                    <div
                      style={{
                        borderRadius: 14,
                        backgroundColor: 'rgba(134,239,172,0.08)',
                        border: '1px solid rgba(134,239,172,0.18)',
                        padding: '10px 12px',
                        fontFamily: openSans,
                        fontSize: fs(9, true),
                        color: 'rgba(255,255,255,0.78)',
                        lineHeight: 1.4,
                      }}
                    >
                      Estrutura final pronta para continuidade.
                    </div>
                    {MIGRATION_RESULTS.map((item, index) => (
                      <div
                        key={item}
                        style={{
                          ...reveal(migrationFrame, fps, (1.24 + index * 0.1) * fps, {
                            y: 6,
                          }),
                          borderRadius: 14,
                          backgroundColor: 'rgba(255,255,255,0.06)',
                          border: '1px solid rgba(255,255,255,0.08)',
                          padding: '11px 12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 12,
                        }}
                      >
                          <div
                            style={{
                              fontFamily: openSans,
                              fontSize: fs(10, true),
                              fontWeight: 600,
                              color: 'rgba(255,255,255,0.88)',
                              lineHeight: 1.22,
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {item}
                        </div>
                        <div
                          style={{
                            width: 18,
                            height: 18,
                            borderRadius: 999,
                            backgroundColor: 'rgba(134,239,172,0.16)',
                            border: '1px solid rgba(134,239,172,0.4)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#86efac',
                            fontFamily: montserrat,
                            fontSize: fs(9, true),
                            fontWeight: 700,
                            flexShrink: 0,
                          }}
                        >
                          ✓
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {segment.kind === 'outro' && (
        <AbsoluteFill
          style={{
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 42px',
          }}
        >
          <Img
            src={staticFile('logo-full.png')}
            style={{
              height: 160,
              objectFit: 'contain',
              filter: 'brightness(0) invert(1)',
              transform: `translateY(${interpolate(
                spring({ frame: outroFrame, fps, config: S.gentle }),
                [0, 1],
                [40, 0],
              )}px)`,
              opacity: interpolate(outroFrame, [0, 0.7 * fps], [0, 1], {
                extrapolateRight: 'clamp',
              }),
            }}
          />

          <div
            style={{
              width: interpolate(outroFrame, [0.9 * fps, 1.8 * fps], [0, 180], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              }),
              height: 2.5,
              backgroundColor: c.primaryMuted,
              borderRadius: 2,
              marginTop: 28,
              opacity: interpolate(outroFrame, [1.0 * fps, 1.8 * fps], [0, 0.5], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              }),
            }}
          />

          <div
            style={{
              marginTop: 22,
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              maxWidth: 760,
            }}
          >
            {introWords.map((word, index) => (
              <span
                key={index}
                style={{
                  ...word.style,
                  fontFamily: openSans,
                  fontSize: fs(28, true),
                  color: c.textMuted,
                  fontWeight: 500,
                  textAlign: 'center',
                }}
              >
                {word.word}
              </span>
            ))}
          </div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
