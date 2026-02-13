import {TransitionSeries, linearTiming} from '@remotion/transitions';
import {slide} from '@remotion/transitions/slide';
import {fade} from '@remotion/transitions/fade';
import {IntroScene} from './scenes/IntroScene';
import {FeatureScene} from './scenes/FeatureScene';
import {OutroScene} from './scenes/OutroScene';
import {
  MicrophoneIcon,
  PrescriptionIcon,
  LabIcon,
  CalendarIcon,
  AIIcon,
} from './components/FeatureIcons';

export const VitaViewPromo: React.FC = () => {
  // Duração de cada cena em frames (30 fps)
  const INTRO_DURATION = 90; // 3s
  const FEATURE_DURATION = 150; // 5s cada
  const OUTRO_DURATION = 60; // 2s
  const TRANSITION_DURATION = 20; // 0.67s cada

  return (
    <TransitionSeries>
      {/* Intro - Logo e headline */}
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
          description="Grave a consulta e deixe a IA estruturar todo o prontuário automaticamente"
          highlights={[
            'Transcrição em tempo real',
            'Estruturação automática',
            'Foco total no paciente',
          ]}
          icon={<MicrophoneIcon />}
        />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={slide({direction: 'from-right'})}
        timing={linearTiming({durationInFrames: TRANSITION_DURATION})}
      />

      {/* Feature 2 - Prescrição Digital */}
      <TransitionSeries.Sequence durationInFrames={FEATURE_DURATION}>
        <FeatureScene
          title="Prescrição Digital"
          description="Crie prescrições ilimitadas com alertas automáticos de interações medicamentosas"
          highlights={[
            'Autocomplete de medicamentos',
            'Alerta de interações',
            'Assinatura digital integrada',
          ]}
          icon={<PrescriptionIcon />}
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
          description="IA interpreta resultados laboratoriais e gera gráficos de evolução"
          highlights={[
            'Upload ilimitado de exames',
            'Análise automática com IA',
            'Gráficos de evolução temporal',
          ]}
          icon={<LabIcon />}
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
          description="Triagem automática e resumo pré-consulta para otimizar seu tempo"
          highlights={[
            'Triagem de urgência com IA',
            'Agendamento online',
            'Resumo pré-consulta',
          ]}
          icon={<CalendarIcon />}
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
