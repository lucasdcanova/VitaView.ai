import {AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, Easing} from 'remotion';
import {Logo3D} from '../components/Logo3D';
import {FloatingParticles} from '../components/FloatingParticles';

export const IntroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  // Fade in do título
  const titleOpacity = interpolate(frame, [0.5 * fps, 1.5 * fps], [0, 1], {
    easing: Easing.out(Easing.quad),
    extrapolateRight: 'clamp',
  });

  // Desliza o título de baixo
  const titleY = interpolate(frame, [0.5 * fps, 1.5 * fps], [50, 0], {
    easing: Easing.out(Easing.exp),
    extrapolateRight: 'clamp',
  });

  // Fade in do subtítulo
  const subtitleOpacity = interpolate(frame, [1 * fps, 2 * fps], [0, 1], {
    easing: Easing.out(Easing.quad),
    extrapolateRight: 'clamp',
  });

  const subtitleY = interpolate(frame, [1 * fps, 2 * fps], [30, 0], {
    easing: Easing.out(Easing.exp),
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{backgroundColor: '#ffffff'}}>
      {/* Partículas de fundo */}
      <div style={{position: 'absolute', inset: 0, opacity: 0.3}}>
        <FloatingParticles count={30} />
      </div>

      {/* Logo 3D */}
      <div
        style={{
          position: 'absolute',
          top: '30%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '400px',
          height: '400px',
        }}
      >
        <Logo3D scale={1.2} />
      </div>

      {/* Título */}
      <div
        style={{
          position: 'absolute',
          top: '60%',
          left: 0,
          right: 0,
          textAlign: 'center',
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
        }}
      >
        <h1
          style={{
            fontSize: '80px',
            fontWeight: 900,
            color: '#212121',
            margin: 0,
            fontFamily: 'Inter, sans-serif',
            letterSpacing: '-0.02em',
          }}
        >
          VitaView<span style={{color: '#424242'}}>.ai</span>
        </h1>
      </div>

      {/* Subtítulo */}
      <div
        style={{
          position: 'absolute',
          top: '72%',
          left: 0,
          right: 0,
          textAlign: 'center',
          opacity: subtitleOpacity,
          transform: `translateY(${subtitleY}px)`,
        }}
      >
        <p
          style={{
            fontSize: '32px',
            fontWeight: 500,
            color: '#424242',
            margin: 0,
            fontFamily: 'Inter, sans-serif',
          }}
        >
          Prontuário Inteligente com IA
        </p>
      </div>
    </AbsoluteFill>
  );
};
