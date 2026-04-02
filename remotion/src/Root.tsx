import { Composition, Folder } from 'remotion';
import { VitaViewShowcase } from './VitaViewShowcase';
import { IntroScene } from './scenes/IntroScene';
import { ExamUploadScene } from './scenes/ExamUploadScene';
import { AgendaScene } from './scenes/AgendaScene';
import { TranscriptionScene } from './scenes/TranscriptionScene';
import { PatientCardScene } from './scenes/PatientCardScene';
import { OutroScene } from './scenes/OutroScene';
import { COMP_WIDTH, COMP_HEIGHT, FPS } from './theme';

// 6 scenes: 3 + 7 + 7 + 7 + 6 + 4 = 34s minus transitions (~3.5s) ≈ 30.5s → 915 frames
const TOTAL_FRAMES = 915;

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="VitaViewShowcase"
        component={VitaViewShowcase}
        durationInFrames={TOTAL_FRAMES}
        fps={FPS}
        width={COMP_WIDTH}
        height={COMP_HEIGHT}
      />

      <Folder name="Scenes">
        <Composition
          id="Intro"
          component={IntroScene}
          durationInFrames={3 * FPS}
          fps={FPS}
          width={COMP_WIDTH}
          height={COMP_HEIGHT}
        />
        <Composition
          id="ExamUpload"
          component={ExamUploadScene}
          durationInFrames={7 * FPS}
          fps={FPS}
          width={COMP_WIDTH}
          height={COMP_HEIGHT}
        />
        <Composition
          id="Agenda"
          component={AgendaScene}
          durationInFrames={7 * FPS}
          fps={FPS}
          width={COMP_WIDTH}
          height={COMP_HEIGHT}
        />
        <Composition
          id="Transcription"
          component={TranscriptionScene}
          durationInFrames={7 * FPS}
          fps={FPS}
          width={COMP_WIDTH}
          height={COMP_HEIGHT}
        />
        <Composition
          id="PatientCard"
          component={PatientCardScene}
          durationInFrames={6 * FPS}
          fps={FPS}
          width={COMP_WIDTH}
          height={COMP_HEIGHT}
        />
        <Composition
          id="Outro"
          component={OutroScene}
          durationInFrames={4 * FPS}
          fps={FPS}
          width={COMP_WIDTH}
          height={COMP_HEIGHT}
        />
      </Folder>
    </>
  );
};
