import React from 'react';
import { TransitionSeries, linearTiming, springTiming } from '@remotion/transitions';
import { fade } from '@remotion/transitions/fade';
import { slide } from '@remotion/transitions/slide';
import { wipe } from '@remotion/transitions/wipe';
import { IntroScene } from './scenes/IntroScene';
import { AgendaScene } from './scenes/AgendaScene';
import { ExamUploadScene } from './scenes/ExamUploadScene';
import { TranscriptionScene } from './scenes/TranscriptionScene';
import { PatientCardScene } from './scenes/PatientCardScene';
import { OutroScene } from './scenes/OutroScene';
import { FPS } from './theme';

export const VitaViewShowcase: React.FC = () => {
  return (
    <TransitionSeries>
      {/* 1. Intro — 3s */}
      <TransitionSeries.Sequence durationInFrames={3 * FPS}>
        <IntroScene />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={fade()}
        timing={springTiming({ config: { damping: 200 }, durationInFrames: 20 })}
      />

      {/* 2. Exam Upload — 7s */}
      <TransitionSeries.Sequence durationInFrames={7 * FPS}>
        <ExamUploadScene />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={slide({ direction: 'from-right' })}
        timing={springTiming({ config: { damping: 200 }, durationInFrames: 22 })}
      />

      {/* 3. Agenda interaction — 7s */}
      <TransitionSeries.Sequence durationInFrames={7 * FPS}>
        <AgendaScene />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={wipe({ direction: 'from-left' })}
        timing={linearTiming({ durationInFrames: 18 })}
      />

      {/* 4. Transcription / Voice to Record — 7s */}
      <TransitionSeries.Sequence durationInFrames={7 * FPS}>
        <TranscriptionScene />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={slide({ direction: 'from-bottom' })}
        timing={springTiming({ config: { damping: 200 }, durationInFrames: 22 })}
      />

      {/* 5. Patient dashboard / metrics — 6s */}
      <TransitionSeries.Sequence durationInFrames={6 * FPS}>
        <PatientCardScene />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={fade()}
        timing={springTiming({ config: { damping: 200 }, durationInFrames: 24 })}
      />

      {/* 6. Outro / CTA — 4s */}
      <TransitionSeries.Sequence durationInFrames={4 * FPS}>
        <OutroScene />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  );
};
