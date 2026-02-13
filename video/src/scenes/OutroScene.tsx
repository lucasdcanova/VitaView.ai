import {AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate} from 'remotion';
import {VitaViewLogo} from '../components/VitaViewLogo';
import {SimpleParticles} from '../components/SimpleParticles';

export const OutroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  // Entrada do CTA
  const ctaProgress = spring({
    frame,
    fps,
    config: {damping: 200},
  });

  const ctaOpacity = interpolate(ctaProgress, [0, 1], [0, 1]);
  const ctaScale = interpolate(ctaProgress, [0, 1], [0.9, 1]);

  // Entrada do URL (delayed)
  const urlProgress = spring({
    frame: frame - 15,
    fps,
    config: {damping: 200},
  });

  const urlOpacity = interpolate(urlProgress, [0, 1], [0, 1]);

  // Pulsação sutil do botão
  const pulse = Math.sin(frame / 30) * 0.03 + 1;

  return (
    <AbsoluteFill style={{backgroundColor: '#212121'}}>
      {/* Partículas de fundo */}
      <div style={{position: 'absolute', inset: 0, opacity: 0.1}}>
        <SimpleParticles count={50} />
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
        {/* Logo pequeno no topo */}
        <div style={{marginBottom: '80px'}}>
          <VitaViewLogo size={100} delay={0} />
        </div>

        {/* CTA Principal */}
        <div
          style={{
            textAlign: 'center',
            opacity: ctaOpacity,
            transform: `scale(${ctaScale})`,
          }}
        >
          <h2
            style={{
              fontSize: '64px',
              fontWeight: 900,
              color: '#ffffff',
              margin: 0,
              marginBottom: '40px',
              fontFamily: 'Inter, sans-serif',
              letterSpacing: '-0.02em',
            }}
          >
            Comece Gratuitamente
          </h2>

          {/* Botão CTA */}
          <div
            style={{
              display: 'inline-block',
              padding: '28px 64px',
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              transform: `scale(${pulse})`,
              boxShadow: '0 20px 60px rgba(255, 255, 255, 0.3)',
            }}
          >
            <p
              style={{
                fontSize: '32px',
                fontWeight: 700,
                color: '#212121',
                margin: 0,
                fontFamily: 'Inter, sans-serif',
              }}
            >
              Experimente Agora
            </p>
          </div>
        </div>

        {/* URL e tagline */}
        <div
          style={{
            marginTop: '80px',
            textAlign: 'center',
            opacity: urlOpacity,
          }}
        >
          <p
            style={{
              fontSize: '36px',
              fontWeight: 600,
              color: '#E0E0E0',
              margin: 0,
              marginBottom: '16px',
              fontFamily: 'Inter, sans-serif',
              letterSpacing: '0.02em',
            }}
          >
            vitaview.ai
          </p>

          <p
            style={{
              fontSize: '20px',
              fontWeight: 400,
              color: '#9E9E9E',
              margin: 0,
              fontFamily: 'Inter, sans-serif',
            }}
          >
            O prontuário que pensa com você
          </p>
        </div>
      </div>
    </AbsoluteFill>
  );
};
