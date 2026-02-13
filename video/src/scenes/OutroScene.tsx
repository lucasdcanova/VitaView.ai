import {AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, Easing, spring} from 'remotion';
import {Logo3D} from '../components/Logo3D';
import {FloatingParticles} from '../components/FloatingParticles';

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
  const ctaScale = interpolate(ctaProgress, [0, 1], [0.8, 1]);

  // Entrada do URL (delayed)
  const urlProgress = spring({
    frame: frame - 15,
    fps,
    config: {damping: 200},
  });

  const urlOpacity = interpolate(urlProgress, [0, 1], [0, 1]);
  const urlY = interpolate(urlProgress, [0, 1], [30, 0]);

  // Pulsação do botão
  const buttonPulse = Math.sin(frame / 15) * 0.05 + 1;

  return (
    <AbsoluteFill style={{backgroundColor: '#212121'}}>
      {/* Partículas de fundo (invertidas) */}
      <div style={{position: 'absolute', inset: 0, opacity: 0.15}}>
        <FloatingParticles count={40} />
      </div>

      {/* Logo pequeno no topo */}
      <div
        style={{
          position: 'absolute',
          top: '100px',
          left: '50%',
          transform: 'translate(-50%, 0)',
          width: '200px',
          height: '200px',
        }}
      >
        <Logo3D scale={0.6} />
      </div>

      {/* CTA Principal */}
      <div
        style={{
          position: 'absolute',
          top: '45%',
          left: 0,
          right: 0,
          textAlign: 'center',
          transform: `translateY(-50%) scale(${ctaScale})`,
          opacity: ctaOpacity,
        }}
      >
        <h2
          style={{
            fontSize: '72px',
            fontWeight: 900,
            color: '#ffffff',
            margin: 0,
            marginBottom: '30px',
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
            padding: '24px 60px',
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            transform: `scale(${buttonPulse})`,
            boxShadow: '0 10px 40px rgba(255, 255, 255, 0.2)',
          }}
        >
          <p
            style={{
              fontSize: '36px',
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

      {/* URL */}
      <div
        style={{
          position: 'absolute',
          bottom: '150px',
          left: 0,
          right: 0,
          textAlign: 'center',
          opacity: urlOpacity,
          transform: `translateY(${urlY}px)`,
        }}
      >
        <p
          style={{
            fontSize: '42px',
            fontWeight: 600,
            color: '#E0E0E0',
            margin: 0,
            fontFamily: 'Inter, sans-serif',
            letterSpacing: '0.05em',
          }}
        >
          vitaview.ai
        </p>
      </div>

      {/* Tagline */}
      <div
        style={{
          position: 'absolute',
          bottom: '80px',
          left: 0,
          right: 0,
          textAlign: 'center',
          opacity: urlOpacity,
        }}
      >
        <p
          style={{
            fontSize: '24px',
            fontWeight: 400,
            color: '#9E9E9E',
            margin: 0,
            fontFamily: 'Inter, sans-serif',
          }}
        >
          Inteligência Artificial para o seu Consultório
        </p>
      </div>
    </AbsoluteFill>
  );
};
