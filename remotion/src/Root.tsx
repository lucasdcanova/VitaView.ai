import { Composition, Folder } from 'remotion';
import { VitaViewShowcase } from './VitaViewShowcase';
import { IntroScene } from './scenes/IntroScene';
import { AgendaScene } from './scenes/AgendaScene';
import { TranscriptionScene } from './scenes/TranscriptionScene';
import { PatientCardScene } from './scenes/PatientCardScene';
import { OutroScene } from './scenes/OutroScene';
import { COMP_WIDTH, COMP_HEIGHT, FPS } from './theme';

// Total: 3 + 7 + 7 + 6 + 4 = 27s  minus transitions (~2.4s) ≈ 24.6s → 738 frames
const TOTAL_FRAMES = 738;

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* Full showcase */}
      <Composition
        id="VitaViewShowcase"
        component={VitaViewShowcase}
        durationInFrames={TOTAL_FRAMES}
        fps={FPS}
        width={COMP_WIDTH}
        height={COMP_HEIGHT}
      />

      {/* Individual scenes for preview */}
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
