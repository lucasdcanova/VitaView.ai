import React from 'react';
import { useVideoConfig } from 'remotion';
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

export const VitaViewShowcase: React.FC = () => {
  const { fps } = useVideoConfig();

  const st = (frames: number) => springTiming({ config: { damping: 200 }, durationInFrames: Math.round(frames * fps / 30) });

  return (
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={Math.round(3 * fps)}>
        <IntroScene />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition presentation={fade()} timing={st(28)} />

      <TransitionSeries.Sequence durationInFrames={Math.round(7 * fps)}>
        <TranscriptionScene />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition presentation={slide({ direction: 'from-right' })} timing={st(26)} />

      <TransitionSeries.Sequence durationInFrames={Math.round(7 * fps)}>
        <ExamUploadScene />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition presentation={wipe({ direction: 'from-left' })} timing={linearTiming({ durationInFrames: Math.round(24 * fps / 30) })} />

      <TransitionSeries.Sequence durationInFrames={Math.round(6 * fps)}>
        <PatientCardScene />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition presentation={slide({ direction: 'from-bottom' })} timing={st(26)} />

      <TransitionSeries.Sequence durationInFrames={Math.round(8 * fps)}>
        <ImportScene />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition presentation={fade()} timing={st(30)} />

      <TransitionSeries.Sequence durationInFrames={Math.round(4 * fps)}>
        <OutroScene />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  );
};
