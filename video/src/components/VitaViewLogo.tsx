import {useCurrentFrame, useVideoConfig, spring, interpolate, Easing} from 'remotion';

interface VitaViewLogoProps {
  size?: number;
  delay?: number;
}

/**
 * Logo oficial do VitaView.ai - dois V's entrelaçados
 * Baseado no componente Logo do site (variant="legacy")
 */
export const VitaViewLogo: React.FC<VitaViewLogoProps> = ({size = 120, delay = 0}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  // Entrada com spring suave
  const entrance = spring({
    frame: frame - delay,
    fps,
    config: {damping: 200},
  });

  const opacity = interpolate(entrance, [0, 1], [0, 1]);
  const scale = interpolate(entrance, [0, 1], [0.8, 1]);

  // Rotação sutil
  const rotation = interpolate(frame, [0, 10 * fps], [0, 360], {
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        width: size,
        height: size,
        opacity,
        transform: `scale(${scale})`,
      }}
    >
      <svg
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          width: '100%',
          height: '100%',
        }}
      >
        {/* Primeiro V */}
        <path
          d="M8 12L18 36L28 12"
          stroke="#212121"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        {/* Segundo V entrelaçado */}
        <path
          d="M20 12L30 36L40 12"
          stroke="#212121"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
    </div>
  );
};
