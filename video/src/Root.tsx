import {Composition} from 'remotion';
import {VitaViewPromo} from './VitaViewPromo';

export const RemotionRoot: React.FC = () => {
  // Cálculo da duração total
  // 5 cenas: Intro (90) + 4 Features (150 cada) + Outro (60)
  // 5 transições de 20 frames cada
  // Total: 90 + 600 + 60 - (5 * 20) = 650 frames
  // As transições reduzem o total porque sobrepõem cenas
  const INTRO_DURATION = 90;
  const FEATURE_DURATION = 150;
  const OUTRO_DURATION = 60;
  const TRANSITION_DURATION = 20;
  const NUM_FEATURES = 4;
  const NUM_TRANSITIONS = 5;

  const totalDuration =
    INTRO_DURATION +
    FEATURE_DURATION * NUM_FEATURES +
    OUTRO_DURATION -
    TRANSITION_DURATION * NUM_TRANSITIONS;

  return (
    <>
      <Composition
        id="VitaViewPromo"
        component={VitaViewPromo}
        durationInFrames={totalDuration}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
