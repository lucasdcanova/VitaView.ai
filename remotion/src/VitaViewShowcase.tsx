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
  const { fps, width, height } = useVideoConfig();
  const v = height > width;

  const st = (frames: number) => springTiming({ config: { damping: 200 }, durationInFrames: Math.round(frames * fps / 30) });
  const durations = {
    intro: Math.round(3 * fps),
    transcription: Math.round((v ? 9 : 7) * fps),
    examUpload: Math.round(7 * fps),
    patientCard: Math.round(6 * fps),
    import: Math.round(8 * fps),
    outro: Math.round(4 * fps),
  };

  return (
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={durations.intro}>
        <IntroScene />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition presentation={fade()} timing={st(28)} />

      <TransitionSeries.Sequence durationInFrames={durations.transcription}>
        <TranscriptionScene />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition presentation={slide({ direction: 'from-right' })} timing={st(26)} />

      <TransitionSeries.Sequence durationInFrames={durations.examUpload}>
        <ExamUploadScene />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition presentation={wipe({ direction: 'from-left' })} timing={linearTiming({ durationInFrames: Math.round(24 * fps / 30) })} />

      <TransitionSeries.Sequence durationInFrames={durations.patientCard}>
        <PatientCardScene />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition presentation={slide({ direction: 'from-bottom' })} timing={st(26)} />

      <TransitionSeries.Sequence durationInFrames={durations.import}>
        <ImportScene />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition presentation={fade()} timing={st(30)} />

      <TransitionSeries.Sequence durationInFrames={durations.outro}>
        <OutroScene />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  );
};
