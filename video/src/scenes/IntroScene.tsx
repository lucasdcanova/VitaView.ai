import {AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, Easing, spring} from 'remotion';
import {VitaViewLogo} from '../components/VitaViewLogo';
import {SimpleParticles} from '../components/SimpleParticles';

export const IntroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  // Entrada do logo
  const logoProgress = spring({
    frame,
    fps,
    config: {damping: 200},
  });

  // Entrada do texto principal (delayed)
  const titleProgress = spring({
    frame: frame - 15,
    fps,
    config: {damping: 200},
  });

  const titleOpacity = interpolate(titleProgress, [0, 1], [0, 1]);
  const titleY = interpolate(titleProgress, [0, 1], [30, 0]);

  // Entrada do subtítulo (mais delayed)
  const subtitleProgress = spring({
    frame: frame - 25,
    fps,
    config: {damping: 200},
  });

  const subtitleOpacity = interpolate(subtitleProgress, [0, 1], [0, 1]);
  const subtitleY = interpolate(subtitleProgress, [0, 1], [20, 0]);

  return (
    <AbsoluteFill style={{backgroundColor: '#ffffff'}}>
      {/* Partículas simples de fundo */}
      <div style={{position: 'absolute', inset: 0, opacity: 0.4}}>
        <SimpleParticles count={40} />
      </div>

      {/* Conteúdo centralizado */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          padding: '0 100px',
        }}
      >
        {/* Logo */}
        <div style={{marginBottom: '60px'}}>
          <VitaViewLogo size={160} delay={0} />
        </div>

        {/* Nome do produto */}
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            marginBottom: '40px',
            opacity: titleOpacity,
            transform: `translateY(${titleY}px)`,
          }}
        >
          <h1
            style={{
              fontSize: '96px',
              fontWeight: 900,
              color: '#212121',
              margin: 0,
              fontFamily: 'Inter, sans-serif',
              letterSpacing: '-0.02em',
            }}
          >
            VitaView
          </h1>
          <span
            style={{
              fontSize: '48px',
              fontWeight: 900,
              color: '#9E9E9E',
              marginLeft: '8px',
              fontFamily: 'Inter, sans-serif',
              position: 'relative',
              top: '-20px',
            }}
          >
            AI
          </span>
        </div>

        {/* Headline */}
        <h2
          style={{
            fontSize: '56px',
            fontWeight: 700,
            color: '#212121',
            margin: 0,
            marginBottom: '20px',
            textAlign: 'center',
            fontFamily: 'Inter, sans-serif',
            letterSpacing: '-0.01em',
            opacity: subtitleOpacity,
            transform: `translateY(${subtitleY}px)`,
          }}
        >
          O Prontuário que{' '}
          <span style={{color: '#9E9E9E'}}>pensa com você.</span>
        </h2>

        {/* Subtitle */}
        <p
          style={{
            fontSize: '24px',
            fontWeight: 400,
            color: '#757575',
            margin: 0,
            textAlign: 'center',
            fontFamily: 'Inter, sans-serif',
            maxWidth: '700px',
            lineHeight: 1.5,
            opacity: subtitleOpacity,
            transform: `translateY(${subtitleY}px)`,
          }}
        >
          Concentre-se no paciente enquanto nossa IA cuida da burocracia.
        </p>
      </div>
    </AbsoluteFill>
  );
};
