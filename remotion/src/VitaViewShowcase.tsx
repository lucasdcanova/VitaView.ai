import React from 'react';
import { TransitionSeries, linearTiming } from '@remotion/transitions';
import { fade } from '@remotion/transitions/fade';
import { slide } from '@remotion/transitions/slide';
import { IntroScene } from './scenes/IntroScene';
import { AgendaScene } from './scenes/AgendaScene';
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
        timing={linearTiming({ durationInFrames: 15 })}
      />

      {/* 2. Agenda interaction — 7s */}
      <TransitionSeries.Sequence durationInFrames={7 * FPS}>
        <AgendaScene />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={slide({ direction: 'from-right' })}
        timing={linearTiming({ durationInFrames: 18 })}
      />

      {/* 3. Transcription / Voice to Record — 7s */}
      <TransitionSeries.Sequence durationInFrames={7 * FPS}>
        <TranscriptionScene />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={slide({ direction: 'from-right' })}
        timing={linearTiming({ durationInFrames: 18 })}
      />

      {/* 4. Patient dashboard / metrics — 6s */}
      <TransitionSeries.Sequence durationInFrames={6 * FPS}>
        <PatientCardScene />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: 20 })}
      />

      {/* 5. Outro / CTA — 4s */}
      <TransitionSeries.Sequence durationInFrames={4 * FPS}>
        <OutroScene />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  );
};
