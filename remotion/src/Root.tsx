import { Composition, Folder } from 'remotion';
import { VitaViewShowcase } from './VitaViewShowcase';
import { IntroScene } from './scenes/IntroScene';
import { ExamUploadScene } from './scenes/ExamUploadScene';
import { AgendaScene } from './scenes/AgendaScene';
import { TranscriptionScene } from './scenes/TranscriptionScene';
import { PatientCardScene } from './scenes/PatientCardScene';
import { OutroScene } from './scenes/OutroScene';
import { COMP_WIDTH, COMP_HEIGHT, VERT_WIDTH, VERT_HEIGHT, FPS } from './theme';

const TOTAL_FRAMES = 915;

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* Landscape 1920x1080 */}
      <Composition
        id="VitaViewShowcase"
        component={VitaViewShowcase}
        durationInFrames={TOTAL_FRAMES}
        fps={FPS}
        width={COMP_WIDTH}
        height={COMP_HEIGHT}
      />

      {/* Vertical 1080x1920 (Reels/Stories) */}
      <Composition
        id="VitaViewShowcase-Vertical"
        component={VitaViewShowcase}
        durationInFrames={TOTAL_FRAMES}
        fps={FPS}
        width={VERT_WIDTH}
        height={VERT_HEIGHT}
      />

      <Folder name="Scenes">
        <Composition id="Intro" component={IntroScene} durationInFrames={3 * FPS} fps={FPS} width={COMP_WIDTH} height={COMP_HEIGHT} />
        <Composition id="ExamUpload" component={ExamUploadScene} durationInFrames={7 * FPS} fps={FPS} width={COMP_WIDTH} height={COMP_HEIGHT} />
        <Composition id="Agenda" component={AgendaScene} durationInFrames={7 * FPS} fps={FPS} width={COMP_WIDTH} height={COMP_HEIGHT} />
        <Composition id="Transcription" component={TranscriptionScene} durationInFrames={7 * FPS} fps={FPS} width={COMP_WIDTH} height={COMP_HEIGHT} />
        <Composition id="PatientCard" component={PatientCardScene} durationInFrames={6 * FPS} fps={FPS} width={COMP_WIDTH} height={COMP_HEIGHT} />
        <Composition id="Outro" component={OutroScene} durationInFrames={4 * FPS} fps={FPS} width={COMP_WIDTH} height={COMP_HEIGHT} />
      </Folder>

      <Folder name="Scenes-Vertical">
        <Composition id="Intro-V" component={IntroScene} durationInFrames={3 * FPS} fps={FPS} width={VERT_WIDTH} height={VERT_HEIGHT} />
        <Composition id="ExamUpload-V" component={ExamUploadScene} durationInFrames={7 * FPS} fps={FPS} width={VERT_WIDTH} height={VERT_HEIGHT} />
        <Composition id="Agenda-V" component={AgendaScene} durationInFrames={7 * FPS} fps={FPS} width={VERT_WIDTH} height={VERT_HEIGHT} />
        <Composition id="PatientCard-V" component={PatientCardScene} durationInFrames={6 * FPS} fps={FPS} width={VERT_WIDTH} height={VERT_HEIGHT} />
        <Composition id="Outro-V" component={OutroScene} durationInFrames={4 * FPS} fps={FPS} width={VERT_WIDTH} height={VERT_HEIGHT} />
      </Folder>
    </>
  );
};
