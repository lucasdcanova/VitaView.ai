import {AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, Easing, spring} from 'remotion';
import {FeatureIcon3D} from '../components/FeatureIcon3D';
import {FloatingParticles} from '../components/FloatingParticles';

interface FeatureSceneProps {
  title: string;
  description: string;
  highlights: string[];
  iconType: 'microphone' | 'prescription' | 'lab' | 'calendar' | 'ai';
}

export const FeatureScene: React.FC<FeatureSceneProps> = ({
  title,
  description,
  highlights,
  iconType,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  // Entrada do título
  const titleProgress = spring({
    frame,
    fps,
    config: {damping: 200},
  });

  const titleOpacity = interpolate(titleProgress, [0, 1], [0, 1]);
  const titleX = interpolate(titleProgress, [0, 1], [-100, 0]);

  // Entrada da descrição (delayed)
  const descProgress = spring({
    frame: frame - 10,
    fps,
    config: {damping: 200},
  });

  const descOpacity = interpolate(descProgress, [0, 1], [0, 1]);
  const descY = interpolate(descProgress, [0, 1], [30, 0]);

  // Entrada dos highlights (staggered)
  const getHighlightProgress = (index: number) => {
    return spring({
      frame: frame - 20 - index * 5,
      fps,
      config: {damping: 200},
    });
  };

  return (
    <AbsoluteFill style={{backgroundColor: '#ffffff'}}>
      {/* Partículas de fundo */}
      <div style={{position: 'absolute', inset: 0, opacity: 0.2}}>
        <FloatingParticles count={25} />
      </div>

      {/* Layout em duas colunas */}
      <div
        style={{
          display: 'flex',
          height: '100%',
          alignItems: 'center',
          padding: '0 100px',
        }}
      >
        {/* Coluna esquerda - Ícone 3D */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <div style={{width: '500px', height: '500px'}}>
            <FeatureIcon3D type={iconType} delay={0} />
          </div>
        </div>

        {/* Coluna direita - Conteúdo */}
        <div style={{flex: 1, paddingLeft: '50px'}}>
          {/* Título */}
          <h2
            style={{
              fontSize: '64px',
              fontWeight: 900,
              color: '#212121',
              margin: 0,
              marginBottom: '20px',
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
              fontSize: '28px',
              fontWeight: 400,
              color: '#424242',
              margin: 0,
              marginBottom: '40px',
              fontFamily: 'Inter, sans-serif',
              lineHeight: 1.4,
              opacity: descOpacity,
              transform: `translateY(${descY}px)`,
            }}
          >
            {description}
          </p>

          {/* Highlights */}
          <div style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
            {highlights.map((highlight, index) => {
              const progress = getHighlightProgress(index);
              const opacity = interpolate(progress, [0, 1], [0, 1]);
              const x = interpolate(progress, [0, 1], [-50, 0]);

              return (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '15px',
                    opacity,
                    transform: `translateX(${x}px)`,
                  }}
                >
                  {/* Ícone de check */}
                  <div
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      backgroundColor: '#212121',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <div
                      style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        backgroundColor: '#ffffff',
                      }}
                    />
                  </div>

                  {/* Texto */}
                  <p
                    style={{
                      fontSize: '22px',
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
