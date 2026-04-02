import React from 'react';
import { TransitionSeries, springTiming, linearTiming } from '@remotion/transitions';
import { fade } from '@remotion/transitions/fade';
import { slide } from '@remotion/transitions/slide';
import { wipe } from '@remotion/transitions/wipe';
import { IntroScene } from './scenes/IntroScene';
import { ExamUploadScene } from './scenes/ExamUploadScene';
import { AgendaScene } from './scenes/AgendaScene';
import { TranscriptionScene } from './scenes/TranscriptionScene';
import { PatientCardScene } from './scenes/PatientCardScene';
import { OutroScene } from './scenes/OutroScene';
import { FPS } from './theme';

const SPRING_TRANS = { config: { damping: 200 }, durationInFrames: 24 };

export const VitaViewShowcase: React.FC = () => {
  return (
    <TransitionSeries>
      {/* Intro — 3s */}
      <TransitionSeries.Sequence durationInFrames={3 * FPS}>
        <IntroScene />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={fade()}
        timing={springTiming(SPRING_TRANS)}
      />

      {/* Upload de Exames — 7s */}
      <TransitionSeries.Sequence durationInFrames={7 * FPS}>
        <ExamUploadScene />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={slide({ direction: 'from-right' })}
        timing={springTiming({ ...SPRING_TRANS, durationInFrames: 26 })}
      />

      {/* Agenda — 7s */}
      <TransitionSeries.Sequence durationInFrames={7 * FPS}>
        <AgendaScene />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={wipe({ direction: 'from-left' })}
        timing={linearTiming({ durationInFrames: 22 })}
      />

      {/* Transcrição — 7s */}
      <TransitionSeries.Sequence durationInFrames={7 * FPS}>
        <TranscriptionScene />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={slide({ direction: 'from-bottom' })}
        timing={springTiming({ ...SPRING_TRANS, durationInFrames: 26 })}
      />

      {/* Painel do Paciente — 6s */}
      <TransitionSeries.Sequence durationInFrames={6 * FPS}>
        <PatientCardScene />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={fade()}
        timing={springTiming({ ...SPRING_TRANS, durationInFrames: 28 })}
      />

      {/* Outro / CTA — 4s */}
      <TransitionSeries.Sequence durationInFrames={4 * FPS}>
        <OutroScene />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  );
};
