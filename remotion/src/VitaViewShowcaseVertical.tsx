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
      'PDFs, imagens e laudos entram no prontuario com leitura automatica, estrutura clinica e continuidade no historico do paciente.',
    bullets: [
      'Upload de laudos, PDFs e imagens no mesmo fluxo',
      'Leitura automatica dos achados principais',
      'Comparativo de resultados dentro da evolucao clinica',
      'Entrada mais limpa no prontuario do paciente',
    ],
    chips: ['Upload', 'Leitura', 'Historico'],
    workflow: [
      {
        label: 'Entrada',
        text: 'PDFs, imagens e laudos podem ser enviados sem reorganizar arquivos antes.',
      },
      {
        label: 'Leitura',
        text: 'A plataforma identifica exames, marcadores e achados relevantes para a revisao clinica.',
      },
      {
        label: 'Prontuario',
        text: 'Os dados ficam prontos para comparacao e consulta futura dentro do caso.',
      },
    ],
    outcomes: ['Achados organizados', 'Historico comparavel', 'Menos trabalho manual'],
    accent: c.blue,
    accentSoft: c.blueMuted,
  },
  {
    title: 'Anamnese assistida',
    eyebrow: 'Consulta em linguagem clinica',
    summary:
      'A consulta vira texto estruturado com gravacao, transcricao, melhoria do texto e extracao dos pontos clinicos relevantes.',
    bullets: [
      'Gravacao com transcricao durante a consulta',
      'Melhoria do texto clinico com IA sem retrabalho manual',
      'Extracao de sintomas, historia e contexto do caso',
      'Base pronta para evolucao e registro formal',
    ],
    chips: ['Gravacao', 'Melhorar', 'Extrair'],
    workflow: [
      {
        label: 'Captacao',
        text: 'Medico e paciente entram no mesmo fluxo de transcricao, preservando o contexto da conversa.',
      },
      {
        label: 'Refino',
        text: 'O texto pode ser melhorado para ganhar clareza, densidade clinica e formato mais profissional.',
      },
      {
        label: 'Estrutura',
        text: 'Informacoes relevantes saem organizadas para a proxima etapa do atendimento.',
      },
    ],
    outcomes: ['Consulta transcrita', 'Texto refinado', 'Dados extraidos'],
    accent: c.primary,
    accentSoft: 'rgba(242,244,248,0.12)',
  },
  {
    title: 'Protocolos de exames',
    eyebrow: 'Pedidos recorrentes',
    summary:
      'Protocolos personalizados reduzem repeticao manual e aceleram pedidos por hipotese, especialidade ou rotina da clinica.',
    bullets: [
      'Protocolos por hipotese, especialidade ou linha de cuidado',
      'Aplicacao rapida durante a solicitacao de exames',
      'Padrao proprio da clinica sem remontar pedidos sempre do zero',
      'Mais consistencia entre atendimentos recorrentes',
    ],
    chips: ['Rotina', 'Padrao', 'Agilidade'],
    workflow: [
      {
        label: 'Biblioteca',
        text: 'A clinica pode manter seus protocolos prontos conforme a rotina de solicitacao.',
      },
      {
        label: 'Aplicacao',
        text: 'Um protocolo inteiro entra no pedido com poucos toques, sem repetir a mesma lista todo dia.',
      },
      {
        label: 'Revisao',
        text: 'O pedido continua claro para revisar, adaptar ou complementar antes de concluir.',
      },
    ],
    outcomes: ['Pedidos rapidos', 'Menos repeticao', 'Padrao proprio'],
    accent: c.green,
    accentSoft: c.greenMuted,
  },
  {
    title: 'Prescricao inteligente',
    eyebrow: 'Fluxo completo da receita',
    summary:
      'Busca do medicamento, prescricao, sugestao de dose e alerta de interacoes ficam no mesmo fluxo antes da emissao final.',
    bullets: [
      'Prescricao digital no contexto do prontuario',
      'Sugestao de dose com IA conforme o caso',
      'Interacoes, alergias e pontos de atencao antes da emissao',
      'Renovacao e manutencao de tratamentos continuos',
    ],
    chips: ['Receita', 'Dose', 'Interacoes'],
    workflow: [
      {
        label: 'Busca',
        text: 'O medicamento entra com mais rapidez no fluxo da consulta, sem quebrar a linha de raciocinio.',
      },
      {
        label: 'Apoio',
        text: 'A sugestao de dose ajuda no preenchimento, e as interacoes aparecem antes da assinatura.',
      },
      {
        label: 'Emissao',
        text: 'A receita sai revisada no mesmo ambiente, com menos ida e volta operacional.',
      },
    ],
    outcomes: ['Dose sugerida', 'Interacoes revistas', 'Receita pronta'],
    accent: c.amber,
    accentSoft: c.amberMuted,
  },
  {
    title: 'Agenda clinica',
    eyebrow: 'Rotina organizada',
    summary:
      'Consultas, retornos, encaixes e triagem pre-consulta ficam mais claros antes do atendimento e da tomada de decisao.',
    bullets: [
      'Agenda da rotina clinica em uma so visao',
      'Retornos e encaixes com mais previsibilidade',
      'Triagem pre-consulta antes do paciente entrar',
      'Mais contexto para comecar o atendimento ja orientado',
    ],
    chips: ['Agenda', 'Encaixes', 'Triagem'],
    workflow: [
      {
        label: 'Dia',
        text: 'A visualizacao da agenda deixa mais claro o fluxo de consultas, retornos e prioridades da rotina.',
      },
      {
        label: 'Pre-consulta',
        text: 'A triagem prepara contexto antes do encontro com o paciente, reduzindo improviso.',
      },
      {
        label: 'Operacao',
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
      'O contexto do caso acompanha o atendimento para resumir o quadro, organizar hipoteses e sugerir o proximo passo clinico.',
    bullets: [
      'Resumo do caso durante o atendimento',
      'Organizacao de hipoteses e proximos passos',
      'Apoio a evolucao e ao raciocinio clinico',
      'Menos perda de contexto entre leitura, consulta e conduta',
    ],
    chips: ['Resumo', 'Hipoteses', 'Proximos passos'],
    workflow: [
      {
        label: 'Contexto',
        text: 'O assistente acompanha exames, conversa e historico para responder dentro do caso real.',
      },
      {
        label: 'Sintese',
        text: 'Resumo clinico, hipoteses e proximo passo aparecem de forma mais objetiva para revisar.',
      },
      {
        label: 'Continuidade',
        text: 'A consulta segue com menos ruptura entre pensar, registrar e decidir.',
      },
    ],
    outcomes: ['Caso resumido', 'Hipoteses organizadas', 'Proximo passo guiado'],
    accent: '#c4b5fd',
    accentSoft: 'rgba(196,181,253,0.14)',
  },
];

const seq = (fps: number, seconds: number) => Math.round(fps * seconds);

const SEGMENTS = (fps: number): Segment[] => [
  { kind: 'intro', duration: seq(fps, 3.0) },
  { kind: 'overview', duration: seq(fps, 1.8), activeIndex: null },
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
  const titleReveal = reveal(frame, fps, 0.12 * fps, { y: 14 });

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
            fontFamily: montserrat,
            fontSize: fs(15, true),
            fontWeight: 700,
            letterSpacing: 3.2,
            color: c.textSubtle,
            textTransform: 'uppercase',
            marginBottom: 28,
          }}
        >
          Visao geral da plataforma
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
            const tileReveal = reveal(frame, fps, 0.28 * fps + index * 0.04 * fps, {
              y: 10,
            });
            const isActive = activeIndex === index;
            return (
              <div
                key={feature.title}
                style={{
                  ...tileReveal,
                  borderRadius: 24,
                  padding: '22px 20px 18px',
                  border: `1px solid ${isActive ? feature.accent : c.strokeSoft}`,
                  backgroundColor: isActive ? feature.accentSoft : c.bgCard,
                  boxShadow: isActive
                    ? '0 16px 40px rgba(0,0,0,0.24)'
                    : '0 12px 32px rgba(0,0,0,0.18)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
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

const FeatureVisual: React.FC<{
  featureIndex: number;
  feature: Feature;
  frame: number;
  fps: number;
}> = ({ featureIndex, feature, frame, fps }) => {
  if (featureIndex === 0) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 18 }}>
        <div style={{ ...reveal(frame, fps, 0.34 * fps, { y: 10 }), borderRadius: 28, backgroundColor: 'rgba(15,17,21,0.6)', border: `1px solid ${c.strokeSoft}`, padding: '20px 18px' }}>
          <div style={{ fontFamily: montserrat, fontSize: fs(11, true), fontWeight: 700, letterSpacing: 1.8, color: feature.accent, textTransform: 'uppercase', marginBottom: 14 }}>
            Envio de exames
          </div>
          <div style={{ borderRadius: 22, border: `1px dashed ${feature.accent}`, backgroundColor: 'rgba(96,165,250,0.08)', minHeight: 210, padding: '18px 16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div style={{ display: 'grid', gap: 10 }}>
              {['hemograma_recente.pdf', 'perfil_lipidico.pdf', 'ferritina_marco.pdf'].map((file, index) => (
                <div key={file} style={{ ...reveal(frame, fps, (0.42 + index * 0.1) * fps, { y: 8 }), display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: 16, backgroundColor: c.bgSurface, border: `1px solid ${c.strokeSoft}` }}>
                  <div style={{ fontFamily: openSans, fontSize: fs(13, true), fontWeight: 600, color: c.textDefault }}>{file}</div>
                  <div style={{ fontFamily: montserrat, fontSize: fs(9, true), fontWeight: 700, letterSpacing: 1.4, color: feature.accent }}>PDF</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 14, fontFamily: openSans, fontSize: fs(13, true), color: c.textMuted, lineHeight: 1.45 }}>
              PDFs, imagens e laudos entram no mesmo fluxo antes da leitura automatica.
            </div>
          </div>
        </div>
        <div style={{ display: 'grid', gap: 16 }}>
          <div style={{ ...reveal(frame, fps, 0.56 * fps, { y: 10 }), borderRadius: 24, backgroundColor: 'rgba(15,17,21,0.54)', border: `1px solid ${c.strokeSoft}`, padding: '18px 16px' }}>
            <div style={{ fontFamily: montserrat, fontSize: fs(10, true), fontWeight: 700, letterSpacing: 1.8, color: c.textSubtle, textTransform: 'uppercase', marginBottom: 12 }}>
              Leitura automatica
            </div>
            <div style={{ display: 'grid', gap: 10 }}>
              {[['Hemoglobina', '13,2 g/dL'], ['Ferritina', '22 ng/mL'], ['LDL', '164 mg/dL']].map(([label, value], index) => (
                <div key={label} style={{ ...reveal(frame, fps, (0.66 + index * 0.08) * fps, { y: 8 }), display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: 14, backgroundColor: c.bgSurface }}>
                  <span style={{ fontFamily: openSans, fontSize: fs(13, true), color: c.textDefault }}>{label}</span>
                  <span style={{ fontFamily: montserrat, fontSize: fs(10, true), fontWeight: 700, color: c.textStrong }}>{value}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ ...reveal(frame, fps, 0.84 * fps, { y: 10 }), borderRadius: 24, backgroundColor: 'rgba(15,17,21,0.46)', border: `1px solid ${c.strokeSoft}`, padding: '18px 16px' }}>
            <div style={{ fontFamily: montserrat, fontSize: fs(10, true), fontWeight: 700, letterSpacing: 1.8, color: c.textSubtle, textTransform: 'uppercase', marginBottom: 12 }}>
              Evolucao comparativa
            </div>
            <div style={{ display: 'grid', gap: 12 }}>
              {[72, 54, 88].map((value, index) => (
                <div key={index} style={{ display: 'grid', gap: 6 }}>
                  <div style={{ fontFamily: openSans, fontSize: fs(12, true), color: c.textMuted }}>
                    {['Ferritina', 'Glicemia', 'PCR'][index]}
                  </div>
                  <div style={{ height: 10, borderRadius: 999, backgroundColor: c.bgSurface, overflow: 'hidden' }}>
                    <div style={{ width: `${value}%`, height: '100%', borderRadius: 999, backgroundColor: index === 1 ? c.amber : feature.accent }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (featureIndex === 1) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '0.95fr 1.05fr', gap: 18 }}>
        <div style={{ ...reveal(frame, fps, 0.34 * fps, { y: 10 }), borderRadius: 28, backgroundColor: 'rgba(15,17,21,0.58)', border: `1px solid ${c.strokeSoft}`, padding: '22px 18px' }}>
          <div style={{ fontFamily: montserrat, fontSize: fs(10, true), fontWeight: 700, letterSpacing: 1.8, color: c.textSubtle, textTransform: 'uppercase', marginBottom: 14 }}>
            Gravacao e transcricao
          </div>
          <div style={{ borderRadius: 22, backgroundColor: c.bgSurface, padding: '20px 18px', minHeight: 230, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
            <div style={{ width: 68, height: 68, borderRadius: 999, backgroundColor: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 16px 36px rgba(239,68,68,0.25)', marginBottom: 16 }}>
              <div style={{ width: 18, height: 18, borderRadius: 999, backgroundColor: c.textStrong }} />
            </div>
            <div style={{ fontFamily: montserrat, fontSize: fs(15, true), fontWeight: 700, color: c.textStrong, marginBottom: 10 }}>
              Ouvindo consulta...
            </div>
            <div style={{ fontFamily: openSans, fontSize: fs(13, true), color: c.textMuted, lineHeight: 1.48, maxWidth: 270 }}>
              "Paciente relata dor frontal pulsátil há 3 dias, com episódios de náusea..."
            </div>
            <div style={{ display: 'flex', gap: 5, marginTop: 16, alignItems: 'end', height: 34 }}>
              {[10, 22, 14, 28, 18, 12, 24, 16, 26].map((h, index) => (
                <div key={index} style={{ width: 6, height: h, borderRadius: 999, backgroundColor: c.textStrong, opacity: 0.86 }} />
              ))}
            </div>
          </div>
        </div>
        <div style={{ display: 'grid', gap: 16 }}>
          <div style={{ ...reveal(frame, fps, 0.52 * fps, { y: 10 }), borderRadius: 24, backgroundColor: 'rgba(15,17,21,0.46)', border: `1px solid ${c.strokeSoft}`, padding: '18px 16px' }}>
            <div style={{ fontFamily: montserrat, fontSize: fs(10, true), fontWeight: 700, letterSpacing: 1.8, color: c.textSubtle, textTransform: 'uppercase', marginBottom: 12 }}>
              Refinamento clinico
            </div>
            <div style={{ display: 'grid', gap: 10 }}>
              <div style={{ borderRadius: 16, backgroundColor: c.bgSurface, padding: '12px 13px' }}>
                <div style={{ fontFamily: montserrat, fontSize: fs(9, true), letterSpacing: 1.4, color: c.textSubtle, marginBottom: 6 }}>TEXTO ORIGINAL</div>
                <div style={{ fontFamily: openSans, fontSize: fs(12, true), color: c.textMuted, fontStyle: 'italic', lineHeight: 1.5 }}>
                  "paciente ta com dor na cabeca ja faz uns 3 dia tb ta com mta ansia"
                </div>
              </div>
              <div style={{ borderRadius: 16, backgroundColor: 'rgba(34,197,94,0.12)', border: `1px solid ${c.greenMuted}`, padding: '12px 13px' }}>
                <div style={{ fontFamily: montserrat, fontSize: fs(9, true), letterSpacing: 1.4, color: '#86efac', marginBottom: 6 }}>TEXTO REVISADO</div>
                <div style={{ fontFamily: openSans, fontSize: fs(13, true), color: c.textStrong, lineHeight: 1.48 }}>
                  Cefaleia há 3 dias, associada a episódios de náusea.
                </div>
              </div>
            </div>
          </div>
          <div style={{ ...reveal(frame, fps, 0.76 * fps, { y: 10 }), borderRadius: 24, backgroundColor: 'rgba(15,17,21,0.42)', border: `1px solid ${c.strokeSoft}`, padding: '18px 16px' }}>
            <div style={{ fontFamily: montserrat, fontSize: fs(10, true), fontWeight: 700, letterSpacing: 1.8, color: c.textSubtle, textTransform: 'uppercase', marginBottom: 12 }}>
              Extracao de contexto
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {[
                ['HAS', '#facc15'],
                ['Taquicardia', '#f87171'],
                ['Losartana 50mg', '#60a5fa'],
              ].map(([chip, color], index) => (
                <div key={chip} style={{ ...reveal(frame, fps, (0.88 + index * 0.08) * fps, { y: 8 }), borderRadius: 16, backgroundColor: c.bgSurface, border: `1px solid ${c.strokeSoft}`, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 999, backgroundColor: color }} />
                  <div style={{ fontFamily: openSans, fontSize: fs(13, true), fontWeight: 600, color: c.textDefault }}>{chip}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (featureIndex === 2) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 18 }}>
        <div style={{ ...reveal(frame, fps, 0.34 * fps, { y: 10 }), borderRadius: 28, backgroundColor: 'rgba(15,17,21,0.58)', border: `1px solid ${c.strokeSoft}`, padding: '20px 18px' }}>
          <div style={{ fontFamily: montserrat, fontSize: fs(10, true), fontWeight: 700, letterSpacing: 1.8, color: c.textSubtle, textTransform: 'uppercase', marginBottom: 14 }}>
            Protocolo salvo
          </div>
          <div style={{ borderRadius: 22, backgroundColor: c.bgSurface, padding: '18px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', gap: 14, marginBottom: 16 }}>
              <div>
                <div style={{ fontFamily: montserrat, fontSize: fs(15, true), fontWeight: 700, color: c.textStrong }}>
                  Check-up Metabólico Completo
                </div>
                <div style={{ fontFamily: openSans, fontSize: fs(13, true), color: c.textMuted, marginTop: 6 }}>
                  Pronto para reutilizar em consultas de acompanhamento.
                </div>
              </div>
              <div style={{ borderRadius: 999, backgroundColor: 'rgba(34,197,94,0.12)', border: `1px solid ${c.greenMuted}`, padding: '8px 10px', fontFamily: montserrat, fontSize: fs(9, true), fontWeight: 700, letterSpacing: 1.3, color: '#86efac' }}>
                MODELO
              </div>
            </div>
            <div style={{ display: 'grid', gap: 10 }}>
              {['Hemograma completo', 'Ferritina', 'Vitamina B12', 'TSH + T4 Livre'].map((item, index) => (
                <div key={item} style={{ ...reveal(frame, fps, (0.46 + index * 0.08) * fps, { y: 8 }), display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 12px', borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.03)', border: `1px solid ${c.strokeSoft}` }}>
                  <div style={{ fontFamily: openSans, fontSize: fs(13, true), fontWeight: 600, color: c.textDefault }}>{item}</div>
                  <div style={{ fontFamily: montserrat, fontSize: fs(9, true), fontWeight: 700, letterSpacing: 1.3, color: '#86efac' }}>ok</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div style={{ display: 'grid', gap: 16 }}>
          {[
            ['Solicitacao mais rapida', 'Adicione exames recorrentes sem remontar o pedido inteiro.'],
            ['Mais clareza na revisao', 'O pedido continua organizado, facil de adaptar e concluir.'],
            ['Padrao proprio da clinica', 'Protocolos refletem sua rotina de solicitacao.'],
          ].map(([title, text], index) => (
            <div key={title} style={{ ...reveal(frame, fps, (0.74 + index * 0.1) * fps, { y: 10 }), borderRadius: 24, backgroundColor: index === 0 ? 'rgba(34,197,94,0.12)' : 'rgba(15,17,21,0.42)', border: `1px solid ${c.strokeSoft}`, padding: '18px 16px' }}>
              <div style={{ fontFamily: montserrat, fontSize: fs(12, true), fontWeight: 700, color: index === 0 ? '#86efac' : c.textStrong, lineHeight: 1.24, marginBottom: 8 }}>
                {title}
              </div>
              <div style={{ fontFamily: openSans, fontSize: fs(13, true), color: c.textMuted, lineHeight: 1.46 }}>
                {text}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (featureIndex === 3) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '0.94fr 1.06fr', gap: 18 }}>
        <div style={{ display: 'grid', gap: 16 }}>
          <div style={{ ...reveal(frame, fps, 0.36 * fps, { y: 10 }), borderRadius: 28, backgroundColor: c.bgCard, border: `1px solid ${c.strokeSoft}`, padding: '20px 18px' }}>
            <div style={{ fontFamily: montserrat, fontSize: fs(10, true), fontWeight: 700, letterSpacing: 1.8, color: c.textSubtle, textTransform: 'uppercase', marginBottom: 14 }}>
              Sugestao de dose
            </div>
            <div style={{ borderRadius: 22, backgroundColor: '#111111', border: `1px solid ${c.strokeSoft}`, padding: '16px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, borderRadius: 16, backgroundColor: c.bgSurface, padding: '12px 12px', marginBottom: 12 }}>
                <div style={{ width: 2, height: 24, backgroundColor: c.textStrong }} />
                <div style={{ fontFamily: openSans, fontSize: fs(16, true), fontWeight: 600, color: c.textStrong }}>
                  Dipirona 500mg
                </div>
              </div>
              <div style={{ borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.04)', border: `1px solid ${c.strokeSoft}`, padding: '14px 12px' }}>
                <div style={{ fontFamily: montserrat, fontSize: fs(10, true), fontWeight: 700, letterSpacing: 1.6, color: '#fde68a', textTransform: 'uppercase', marginBottom: 8 }}>
                  Sugestao para dor e febre
                </div>
                <div style={{ fontFamily: openSans, fontSize: fs(13, true), color: c.textDefault, lineHeight: 1.46 }}>
                  Tomar 1 comprimido a cada 6 horas se necessário.
                </div>
              </div>
            </div>
          </div>
          <div style={{ ...reveal(frame, fps, 0.72 * fps, { y: 10 }), borderRadius: 24, backgroundColor: 'rgba(15,17,21,0.44)', border: `1px solid ${c.strokeSoft}`, padding: '18px 16px' }}>
            <div style={{ fontFamily: montserrat, fontSize: fs(10, true), fontWeight: 700, letterSpacing: 1.8, color: c.textSubtle, textTransform: 'uppercase', marginBottom: 10 }}>
              Contexto clinico
            </div>
            <div style={{ display: 'grid', gap: 8 }}>
              {[['Idade', '42 anos'], ['Peso', '70 kg'], ['Alergia', 'AAS / AINEs']].map(([label, value], index) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 11px', borderRadius: 14, backgroundColor: c.bgSurface }}>
                  <span style={{ fontFamily: openSans, fontSize: fs(12, true), color: c.textMuted }}>{label}</span>
                  <span style={{ fontFamily: montserrat, fontSize: fs(10, true), fontWeight: 700, color: index === 2 ? '#fde68a' : c.textStrong }}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div style={{ ...reveal(frame, fps, 0.56 * fps, { y: 10 }), borderRadius: 28, backgroundColor: '#161616', border: `1px solid ${c.strokeSoft}`, padding: '20px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', gap: 14, marginBottom: 16 }}>
            <div>
              <div style={{ fontFamily: montserrat, fontSize: fs(10, true), fontWeight: 700, letterSpacing: 1.8, color: c.textSubtle, textTransform: 'uppercase', marginBottom: 8 }}>
                Interacoes relevantes
              </div>
              <div style={{ fontFamily: montserrat, fontSize: fs(15, true), fontWeight: 700, color: c.textStrong, lineHeight: 1.2 }}>
                Varredura clínica automática antes da emissão
              </div>
            </div>
            <div style={{ borderRadius: 999, backgroundColor: 'rgba(245,158,11,0.12)', border: `1px solid ${c.amberMuted}`, padding: '8px 10px', fontFamily: montserrat, fontSize: fs(9, true), fontWeight: 700, letterSpacing: 1.4, color: '#fde68a' }}>
              Moderado
            </div>
          </div>
          <div style={{ borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.04)', border: `1px solid ${c.strokeSoft}`, padding: '14px 12px', marginBottom: 12 }}>
            <div style={{ fontFamily: openSans, fontSize: fs(13, true), fontWeight: 600, color: c.textStrong, marginBottom: 6 }}>
              Sertralina 50mg + Zolpidem 10mg
            </div>
            <div style={{ fontFamily: openSans, fontSize: fs(12, true), color: c.textMuted, lineHeight: 1.45 }}>
              Risco moderado de sedação e piora de atenção no dia seguinte.
            </div>
          </div>
          <div style={{ display: 'grid', gap: 10 }}>
            {[
              ['Histórico cruzado automaticamente', 'Alergias + uso contínuo'],
              ['Orientação sugerida', 'Orientar uso noturno'],
              ['Decisão final', 'Revisão médica preservada'],
            ].map(([label, value], index) => (
              <div key={label} style={{ ...reveal(frame, fps, (0.88 + index * 0.08) * fps, { y: 8 }), display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '11px 12px', borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.04)' }}>
                <span style={{ fontFamily: openSans, fontSize: fs(12, true), color: c.textMuted }}>{label}</span>
                <span style={{ fontFamily: montserrat, fontSize: fs(10, true), fontWeight: 700, color: index === 1 ? '#fde68a' : c.textStrong }}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (featureIndex === 4) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1.08fr 0.92fr', gap: 18 }}>
        <div style={{ ...reveal(frame, fps, 0.34 * fps, { y: 10 }), borderRadius: 28, backgroundColor: 'rgba(15,17,21,0.56)', border: `1px solid ${c.strokeSoft}`, padding: '18px 18px' }}>
          <div style={{ fontFamily: montserrat, fontSize: fs(10, true), fontWeight: 700, letterSpacing: 1.8, color: c.textSubtle, textTransform: 'uppercase', marginBottom: 14 }}>
            Agenda da semana
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10 }}>
            {[
              { day: 'Seg', items: [['09:00', 'Maria Silva', '#60a5fa'], ['14:30', 'João Santos', '#22c55e']] },
              { day: 'Qua', items: [['08:00', 'Pedro Lima', '#f87171'], ['11:00', 'Carla Mendes', '#60a5fa'], ['15:00', 'Roberto Silva', '#22c55e']] },
              { day: 'Sex', items: [['10:30', 'Beatriz Souza', '#22c55e']] },
            ].map((day, colIndex) => (
              <div key={day.day} style={{ ...reveal(frame, fps, (0.42 + colIndex * 0.08) * fps, { y: 8 }), borderRadius: 18, backgroundColor: c.bgSurface, padding: '12px 10px', minHeight: 230 }}>
                <div style={{ fontFamily: montserrat, fontSize: fs(10, true), fontWeight: 700, color: c.textStrong, marginBottom: 10 }}>{day.day}</div>
                <div style={{ display: 'grid', gap: 8 }}>
                  {day.items.map(([time, name, color]) => (
                    <div key={`${day.day}-${time}`} style={{ borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.04)', borderLeft: `4px solid ${color}`, padding: '9px 9px 9px 10px' }}>
                      <div style={{ fontFamily: montserrat, fontSize: fs(9, true), fontWeight: 700, color: c.textStrong, marginBottom: 3 }}>{time}</div>
                      <div style={{ fontFamily: openSans, fontSize: fs(12, true), fontWeight: 600, color: c.textDefault }}>{name}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: 'grid', gap: 16 }}>
          <div style={{ ...reveal(frame, fps, 0.66 * fps, { y: 10 }), borderRadius: 24, backgroundColor: 'rgba(15,17,21,0.44)', border: `1px solid ${c.strokeSoft}`, padding: '18px 16px' }}>
            <div style={{ fontFamily: montserrat, fontSize: fs(10, true), fontWeight: 700, letterSpacing: 1.8, color: c.textSubtle, textTransform: 'uppercase', marginBottom: 12 }}>
              Triagem pre-consulta
            </div>
            <div style={{ borderRadius: 18, backgroundColor: c.bgSurface, padding: '14px 12px' }}>
              <div style={{ fontFamily: montserrat, fontSize: fs(13, true), fontWeight: 700, color: c.textStrong, marginBottom: 8 }}>Maria Silva · 09:00</div>
              <div style={{ fontFamily: openSans, fontSize: fs(13, true), color: c.textMuted, lineHeight: 1.46 }}>
                Retorno para revisar exames recentes e ajustar antihipertensivo.
              </div>
            </div>
          </div>
          <div style={{ ...reveal(frame, fps, 0.88 * fps, { y: 10 }), borderRadius: 24, backgroundColor: 'rgba(15,17,21,0.42)', border: `1px solid ${c.strokeSoft}`, padding: '18px 16px' }}>
            <div style={{ fontFamily: montserrat, fontSize: fs(10, true), fontWeight: 700, letterSpacing: 1.8, color: c.textSubtle, textTransform: 'uppercase', marginBottom: 12 }}>
              Sinais da rotina
            </div>
            <div style={{ display: 'grid', gap: 10 }}>
              {[
                'Retornos do dia visiveis sem abrir outra tela',
                'Encaixes e urgencias reorganizados com mais rapidez',
                'Consultas, exames e retornos no mesmo fluxo',
              ].map((item, index) => (
                <div key={item} style={{ ...reveal(frame, fps, (0.98 + index * 0.08) * fps, { y: 8 }), borderRadius: 14, backgroundColor: c.bgSurface, padding: '11px 12px', fontFamily: openSans, fontSize: fs(12, true), fontWeight: 600, color: c.textDefault, lineHeight: 1.42 }}>
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '0.96fr 1.04fr', gap: 18 }}>
      <div style={{ ...reveal(frame, fps, 0.36 * fps, { y: 10 }), borderRadius: 28, backgroundColor: '#111111', border: `1px solid ${c.strokeSoft}`, padding: '20px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <div style={{ width: 36, height: 36, borderRadius: 999, backgroundColor: c.textStrong, color: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: montserrat, fontSize: fs(11, true), fontWeight: 700 }}>
            AI
          </div>
          <div>
            <div style={{ fontFamily: montserrat, fontSize: fs(12, true), fontWeight: 700, color: c.textStrong }}>Vita Assist</div>
            <div style={{ fontFamily: openSans, fontSize: fs(11, true), color: c.textMuted }}>Chat clínico contextual</div>
          </div>
        </div>
        <div style={{ display: 'grid', gap: 12 }}>
          <div style={{ ...reveal(frame, fps, 0.48 * fps, { y: 8 }), marginLeft: 'auto', maxWidth: 280, borderRadius: 20, borderBottomRightRadius: 8, backgroundColor: c.textStrong, color: c.bg, padding: '12px 14px', fontFamily: openSans, fontSize: fs(13, true), fontWeight: 600, lineHeight: 1.44 }}>
            Organize os pontos principais antes da consulta.
          </div>
          <div style={{ ...reveal(frame, fps, 0.72 * fps, { y: 8 }), maxWidth: 360, borderRadius: 22, borderBottomLeftRadius: 8, backgroundColor: 'rgba(255,255,255,0.05)', border: `1px solid ${c.strokeSoft}`, padding: '14px 14px' }}>
            <div style={{ fontFamily: montserrat, fontSize: fs(10, true), fontWeight: 700, letterSpacing: 1.7, color: feature.accent, marginBottom: 8, textTransform: 'uppercase' }}>
              Contexto carregado
            </div>
            <div style={{ fontFamily: openSans, fontSize: fs(13, true), color: c.textDefault, lineHeight: 1.5 }}>
              Sintomas persistentes, ferritina reduzida e histórico recente já reunidos em um resumo para revisão rápida.
            </div>
          </div>
        </div>
      </div>
      <div style={{ display: 'grid', gap: 16 }}>
        <div style={{ ...reveal(frame, fps, 0.64 * fps, { y: 10 }), borderRadius: 24, backgroundColor: 'rgba(15,17,21,0.44)', border: `1px solid ${c.strokeSoft}`, padding: '18px 16px' }}>
          <div style={{ fontFamily: montserrat, fontSize: fs(10, true), fontWeight: 700, letterSpacing: 1.8, color: c.textSubtle, textTransform: 'uppercase', marginBottom: 12 }}>
            Estados do assistente
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {['Historico clinico', 'Exames recentes', 'Paciente em atendimento'].map((chip, index) => (
              <div key={chip} style={{ ...reveal(frame, fps, (0.76 + index * 0.08) * fps, { y: 8 }), borderRadius: 999, padding: '9px 12px', backgroundColor: c.bgSurface, border: `1px solid ${c.strokeSoft}`, fontFamily: openSans, fontSize: fs(12, true), fontWeight: 600, color: c.textDefault }}>
                {chip}
              </div>
            ))}
          </div>
        </div>
        <div style={{ ...reveal(frame, fps, 0.98 * fps, { y: 10 }), borderRadius: 24, backgroundColor: 'rgba(15,17,21,0.42)', border: `1px solid ${c.strokeSoft}`, padding: '18px 16px' }}>
          <div style={{ fontFamily: montserrat, fontSize: fs(10, true), fontWeight: 700, letterSpacing: 1.8, color: c.textSubtle, textTransform: 'uppercase', marginBottom: 12 }}>
            Apoio ao raciocinio
          </div>
          <div style={{ display: 'grid', gap: 10 }}>
            {[
              'Resumo do caso em tempo real',
              'Hipóteses clínicas mais organizadas',
              'Próximos passos sugeridos com contexto',
            ].map((item, index) => (
              <div key={item} style={{ ...reveal(frame, fps, (1.08 + index * 0.08) * fps, { y: 8 }), borderRadius: 14, backgroundColor: c.bgSurface, padding: '11px 12px', fontFamily: openSans, fontSize: fs(12, true), fontWeight: 600, color: c.textDefault, lineHeight: 1.42 }}>
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
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
  const exitFrames = 0.48 * fps;
  const entrySpring = spring({ frame, fps, config: S.gentle });
  const exitProgress = interpolate(frame, [duration - exitFrames, duration], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const origin = FEATURE_ORIGINS[featureIndex];
  const shellScale =
    interpolate(entrySpring, [0, 1], [0.32, 1]) -
    interpolate(exitProgress, [0, 1], [0, 0.52]);
  const shellTranslateX =
    interpolate(entrySpring, [0, 1], [origin.x, 0]) +
    interpolate(exitProgress, [0, 1], [0, origin.x * 0.7]);
  const shellTranslateY =
    interpolate(entrySpring, [0, 1], [origin.y, 0]) +
    interpolate(exitProgress, [0, 1], [0, origin.y * 0.7]);
  const shellOpacity =
    interpolate(frame, [0, 0.28 * fps], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }) * interpolate(exitProgress, [0, 1], [1, 0], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
  const contentOpacity = interpolate(frame, [0.22 * fps, 0.86 * fps], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  }) * interpolate(exitProgress, [0, 1], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const panelReveal = reveal(frame, fps, 0.08 * fps, { y: 12 });
  const summaryReveal = reveal(frame, fps, 0.28 * fps, { y: 10 });

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div
        style={{
          width: 860,
          maxWidth: '84vw',
          opacity: shellOpacity,
          transform: `translate3d(${shellTranslateX}px, ${shellTranslateY}px, 0) scale(${shellScale})`,
          display: 'flex',
          flexDirection: 'column',
          gap: 22,
        }}
      >
        <div>
          <div style={{ ...panelReveal, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 18, marginBottom: 14 }}>
            <div>
              <div style={{ fontFamily: montserrat, fontSize: fs(11, true), fontWeight: 700, letterSpacing: 2.2, color: feature.accent, textTransform: 'uppercase', marginBottom: 12 }}>
                {feature.eyebrow}
              </div>
              <div style={{ fontFamily: montserrat, fontSize: fs(31, true), fontWeight: 700, color: c.textStrong, lineHeight: 1.06, maxWidth: 620 }}>
                {feature.title}
              </div>
            </div>
          </div>
          <p style={{ ...summaryReveal, opacity: contentOpacity, margin: 0, fontFamily: openSans, fontSize: fs(17, true), color: c.textMuted, lineHeight: 1.58, maxWidth: 860 }}>
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
    'Prontuario Medico Inteligente',
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
                fontSize: fs(31, true),
                fontWeight: 700,
                color: c.textStrong,
                lineHeight: 1.06,
                marginBottom: 12,
              }}
            >
              Já utiliza um outro sistema?
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
              A migração para o VitaView pode ser assistida do início ao fim, com
              apoio da equipe na transição de pacientes, agenda e histórico clínico.
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
