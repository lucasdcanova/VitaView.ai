import {TransitionSeries, linearTiming} from '@remotion/transitions';
import {slide} from '@remotion/transitions/slide';
import {fade} from '@remotion/transitions/fade';
import {IntroScene} from './scenes/IntroScene';
import {FeatureScene} from './scenes/FeatureScene';
import {OutroScene} from './scenes/OutroScene';

export const VitaViewPromo: React.FC = () => {
  // Duração de cada cena em frames (30 fps)
  const INTRO_DURATION = 90; // 3s
  const FEATURE_DURATION = 150; // 5s cada
  const OUTRO_DURATION = 60; // 2s
  const TRANSITION_DURATION = 20; // 0.67s cada

  return (
    <TransitionSeries>
      {/* Intro - Logo e título */}
      <TransitionSeries.Sequence durationInFrames={INTRO_DURATION}>
        <IntroScene />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({durationInFrames: TRANSITION_DURATION})}
      />

      {/* Feature 1 - Anamnese com IA */}
      <TransitionSeries.Sequence durationInFrames={FEATURE_DURATION}>
        <FeatureScene
          title="Anamnese com IA"
          description="Transcrição de voz em tempo real com estruturação automática do prontuário"
          highlights={[
            'Gravação de voz durante a consulta',
            'Transcrição automática e estruturada',
            'Foco total no paciente',
          ]}
          iconType="microphone"
        />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={slide({direction: 'from-right'})}
        timing={linearTiming({durationInFrames: TRANSITION_DURATION})}
      />

      {/* Feature 2 - Prescrição Inteligente */}
      <TransitionSeries.Sequence durationInFrames={FEATURE_DURATION}>
        <FeatureScene
          title="Prescrição Digital"
          description="Prescrição ilimitada com alerta automático de interações medicamentosas"
          highlights={[
            'Autocomplete de medicamentos',
            'Alerta de interações',
            'Assinatura digital',
          ]}
          iconType="prescription"
        />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={slide({direction: 'from-left'})}
        timing={linearTiming({durationInFrames: TRANSITION_DURATION})}
      />

      {/* Feature 3 - Análise de Exames */}
      <TransitionSeries.Sequence durationInFrames={FEATURE_DURATION}>
        <FeatureScene
          title="Análise de Exames"
          description="IA que interpreta resultados laboratoriais e gera gráficos de evolução"
          highlights={[
            'Upload ilimitado de exames',
            'Análise automática com IA',
            'Gráficos de evolução',
          ]}
          iconType="lab"
        />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={slide({direction: 'from-right'})}
        timing={linearTiming({durationInFrames: TRANSITION_DURATION})}
      />

      {/* Feature 4 - Agenda Inteligente */}
      <TransitionSeries.Sequence durationInFrames={FEATURE_DURATION}>
        <FeatureScene
          title="Agenda Inteligente"
          description="Agendamento com IA e triagem pré-consulta para otimizar seu tempo"
          highlights={[
            'Triagem automática de urgência',
            'Agendamento online',
            'Resumo pré-consulta',
          ]}
          iconType="calendar"
        />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({durationInFrames: TRANSITION_DURATION})}
      />

      {/* Outro - CTA */}
      <TransitionSeries.Sequence durationInFrames={OUTRO_DURATION}>
        <OutroScene />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  );
};
