import React from 'react';
import { TransitionSeries, springTiming, linearTiming } from '@remotion/transitions';
import { fade } from '@remotion/transitions/fade';
import { slide } from '@remotion/transitions/slide';
import { wipe } from '@remotion/transitions/wipe';
import { IntroScene } from './scenes/IntroScene';
import { TranscriptionScene } from './scenes/TranscriptionScene';
import { ExamUploadScene } from './scenes/ExamUploadScene';
import { PatientCardScene } from './scenes/PatientCardScene';
import { ImportScene } from './scenes/ImportScene';
import { OutroScene } from './scenes/OutroScene';
import { FPS } from './theme';

const ST = { config: { damping: 200 }, durationInFrames: 26 };

export const VitaViewShowcase: React.FC = () => {
  return (
    <TransitionSeries>
      {/* 1. Intro — 3s */}
      <TransitionSeries.Sequence durationInFrames={3 * FPS}>
        <IntroScene />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={fade()}
        timing={springTiming({ ...ST, durationInFrames: 28 })}
      />

      {/* 2. Transcrição por Voz — 7s */}
      <TransitionSeries.Sequence durationInFrames={7 * FPS}>
        <TranscriptionScene />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={slide({ direction: 'from-right' })}
        timing={springTiming(ST)}
      />

      {/* 3. Upload de Exames — 7s */}
      <TransitionSeries.Sequence durationInFrames={7 * FPS}>
        <ExamUploadScene />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={wipe({ direction: 'from-left' })}
        timing={linearTiming({ durationInFrames: 24 })}
      />

      {/* 4. Painel do Paciente — 6s */}
      <TransitionSeries.Sequence durationInFrames={6 * FPS}>
        <PatientCardScene />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={slide({ direction: 'from-bottom' })}
        timing={springTiming(ST)}
      />

      {/* 5. Importação de Prontuário — 8s */}
      <TransitionSeries.Sequence durationInFrames={8 * FPS}>
        <ImportScene />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={fade()}
        timing={springTiming({ ...ST, durationInFrames: 30 })}
      />

      {/* 6. Outro / CTA — 4s */}
      <TransitionSeries.Sequence durationInFrames={4 * FPS}>
        <OutroScene />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  );
};
