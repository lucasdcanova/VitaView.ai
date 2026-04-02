import { Composition, Folder } from 'remotion';
import { VitaViewShowcase } from './VitaViewShowcase';
import { IntroScene } from './scenes/IntroScene';
import { ImportScene } from './scenes/ImportScene';
import { ExamUploadScene } from './scenes/ExamUploadScene';
import { TranscriptionScene } from './scenes/TranscriptionScene';
import { PatientCardScene } from './scenes/PatientCardScene';
import { OutroScene } from './scenes/OutroScene';
import { COMP_WIDTH, COMP_HEIGHT, VERT_WIDTH, VERT_HEIGHT, FPS } from './theme';

const TOTAL = 920;

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition id="VitaViewShowcase" component={VitaViewShowcase} durationInFrames={TOTAL} fps={FPS} width={COMP_WIDTH} height={COMP_HEIGHT} />
      <Composition id="VitaViewShowcase-Vertical" component={VitaViewShowcase} durationInFrames={TOTAL} fps={FPS} width={VERT_WIDTH} height={VERT_HEIGHT} />

      <Folder name="Scenes">
        <Composition id="Intro" component={IntroScene} durationInFrames={3 * FPS} fps={FPS} width={COMP_WIDTH} height={COMP_HEIGHT} />
        <Composition id="Import" component={ImportScene} durationInFrames={8 * FPS} fps={FPS} width={COMP_WIDTH} height={COMP_HEIGHT} />
        <Composition id="ExamUpload" component={ExamUploadScene} durationInFrames={7 * FPS} fps={FPS} width={COMP_WIDTH} height={COMP_HEIGHT} />
        <Composition id="Transcription" component={TranscriptionScene} durationInFrames={7 * FPS} fps={FPS} width={COMP_WIDTH} height={COMP_HEIGHT} />
        <Composition id="PatientCard" component={PatientCardScene} durationInFrames={6 * FPS} fps={FPS} width={COMP_WIDTH} height={COMP_HEIGHT} />
        <Composition id="Outro" component={OutroScene} durationInFrames={4 * FPS} fps={FPS} width={COMP_WIDTH} height={COMP_HEIGHT} />
      </Folder>

      <Folder name="Vertical">
        <Composition id="Import-V" component={ImportScene} durationInFrames={8 * FPS} fps={FPS} width={VERT_WIDTH} height={VERT_HEIGHT} />
        <Composition id="ExamUpload-V" component={ExamUploadScene} durationInFrames={7 * FPS} fps={FPS} width={VERT_WIDTH} height={VERT_HEIGHT} />
        <Composition id="PatientCard-V" component={PatientCardScene} durationInFrames={6 * FPS} fps={FPS} width={VERT_WIDTH} height={VERT_HEIGHT} />
      </Folder>
    </>
  );
};
