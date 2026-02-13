import {AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate} from 'remotion';
import {SimpleParticles} from '../components/SimpleParticles';

interface FeatureSceneProps {
  title: string;
  description: string;
  highlights: string[];
  icon: React.ReactNode;
}

export const FeatureScene: React.FC<FeatureSceneProps> = ({
  title,
  description,
  highlights,
  icon,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  // Entrada do ícone
  const iconProgress = spring({
    frame,
    fps,
    config: {damping: 200},
  });

  const iconScale = interpolate(iconProgress, [0, 1], [0.5, 1]);
  const iconOpacity = interpolate(iconProgress, [0, 1], [0, 1]);

  // Entrada do título
  const titleProgress = spring({
    frame: frame - 10,
    fps,
    config: {damping: 200},
  });

  const titleOpacity = interpolate(titleProgress, [0, 1], [0, 1]);
  const titleX = interpolate(titleProgress, [0, 1], [-50, 0]);

  // Entrada da descrição
  const descProgress = spring({
    frame: frame - 15,
    fps,
    config: {damping: 200},
  });

  const descOpacity = interpolate(descProgress, [0, 1], [0, 1]);

  // Entrada dos highlights (staggered)
  const getHighlightProgress = (index: number) => {
    return spring({
      frame: frame - 20 - index * 4,
      fps,
      config: {damping: 200},
    });
  };

  return (
    <AbsoluteFill style={{backgroundColor: '#ffffff'}}>
      {/* Partículas sutis */}
      <div style={{position: 'absolute', inset: 0, opacity: 0.3}}>
        <SimpleParticles count={25} />
      </div>

      {/* Layout em grade */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          height: '100%',
          alignItems: 'center',
          padding: '0 120px',
          gap: '80px',
        }}
      >
        {/* Coluna esquerda - Ícone */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              transform: `scale(${iconScale})`,
              opacity: iconOpacity,
            }}
          >
            {icon}
          </div>
        </div>

        {/* Coluna direita - Conteúdo */}
        <div>
          {/* Título */}
          <h2
            style={{
              fontSize: '72px',
              fontWeight: 900,
              color: '#212121',
              margin: 0,
              marginBottom: '24px',
              fontFamily: 'Inter, sans-serif',
              letterSpacing: '-0.02em',
              opacity: titleOpacity,
              transform: `translateX(${titleX}px)`,
            }}
          >
            {title}
          </h2>

          {/* Descrição */}
          <p
            style={{
              fontSize: '24px',
              fontWeight: 400,
              color: '#757575',
              margin: 0,
              marginBottom: '40px',
              fontFamily: 'Inter, sans-serif',
              lineHeight: 1.5,
              opacity: descOpacity,
            }}
          >
            {description}
          </p>

          {/* Highlights */}
          <div style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
            {highlights.map((highlight, index) => {
              const progress = getHighlightProgress(index);
              const opacity = interpolate(progress, [0, 1], [0, 1]);
              const x = interpolate(progress, [0, 1], [-30, 0]);

              return (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    opacity,
                    transform: `translateX(${x}px)`,
                  }}
                >
                  {/* Bullet */}
                  <div
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: '#212121',
                      flexShrink: 0,
                    }}
                  />

                  {/* Texto */}
                  <p
                    style={{
                      fontSize: '20px',
                      fontWeight: 500,
                      color: '#424242',
                      margin: 0,
                      fontFamily: 'Inter, sans-serif',
                    }}
                  >
                    {highlight}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
