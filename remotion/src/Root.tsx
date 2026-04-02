import { Composition, Folder } from 'remotion';
import { VitaViewShowcase } from './VitaViewShowcase';
import { IntroScene } from './scenes/IntroScene';
import { ImportScene } from './scenes/ImportScene';
import { ExamUploadScene } from './scenes/ExamUploadScene';
import { TranscriptionScene } from './scenes/TranscriptionScene';
import { PatientCardScene } from './scenes/PatientCardScene';
import { OutroScene } from './scenes/OutroScene';
import { COMP_WIDTH, COMP_HEIGHT, VERT_WIDTH, VERT_HEIGHT } from './theme';

// Duration in seconds: 3+7+7+6+8+4 = 35s, minus ~4.5s transitions ≈ 30.5s
const DURATION_30 = 920;   // 30fps
const DURATION_60 = 1840;  // 60fps (same real duration)

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* 30fps — preview & quick render */}
      <Composition id="VitaViewShowcase" component={VitaViewShowcase} durationInFrames={DURATION_30} fps={30} width={COMP_WIDTH} height={COMP_HEIGHT} />
      <Composition id="VitaViewShowcase-Vertical" component={VitaViewShowcase} durationInFrames={DURATION_30} fps={30} width={VERT_WIDTH} height={VERT_HEIGHT} />

      {/* 60fps — high quality export (use --scale 2 for 4K) */}
      <Folder name="4K-60fps">
        <Composition id="Showcase-60fps" component={VitaViewShowcase} durationInFrames={DURATION_60} fps={60} width={COMP_WIDTH} height={COMP_HEIGHT} />
        <Composition id="Showcase-Vertical-60fps" component={VitaViewShowcase} durationInFrames={DURATION_60} fps={60} width={VERT_WIDTH} height={VERT_HEIGHT} />
      </Folder>

      <Folder name="Scenes">
        <Composition id="Intro" component={IntroScene} durationInFrames={90} fps={30} width={COMP_WIDTH} height={COMP_HEIGHT} />
        <Composition id="Import" component={ImportScene} durationInFrames={240} fps={30} width={COMP_WIDTH} height={COMP_HEIGHT} />
        <Composition id="ExamUpload" component={ExamUploadScene} durationInFrames={210} fps={30} width={COMP_WIDTH} height={COMP_HEIGHT} />
        <Composition id="Transcription" component={TranscriptionScene} durationInFrames={210} fps={30} width={COMP_WIDTH} height={COMP_HEIGHT} />
        <Composition id="PatientCard" component={PatientCardScene} durationInFrames={180} fps={30} width={COMP_WIDTH} height={COMP_HEIGHT} />
        <Composition id="Outro" component={OutroScene} durationInFrames={120} fps={30} width={COMP_WIDTH} height={COMP_HEIGHT} />
      </Folder>
    </>
  );
};
