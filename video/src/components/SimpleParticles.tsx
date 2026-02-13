import {useCurrentFrame, useVideoConfig} from 'remotion';
import {useMemo} from 'react';

interface Particle {
  x: number;
  y: number;
  size: number;
  speed: number;
  opacity: number;
}

export const SimpleParticles: React.FC<{count?: number}> = ({count = 30}) => {
  const frame = useCurrentFrame();
  const {width, height, fps} = useVideoConfig();

  const particles = useMemo<Particle[]>(() => {
    return Array.from({length: count}, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: 2 + Math.random() * 4,
      speed: 0.3 + Math.random() * 0.7,
      opacity: 0.1 + Math.random() * 0.3,
    }));
  }, [count, width, height]);

  return (
    <svg width={width} height={height} style={{position: 'absolute', inset: 0}}>
      {particles.map((particle, i) => {
        // Movimento flutuante
        const y = (particle.y + frame * particle.speed) % height;

        return (
          <circle
            key={i}
            cx={particle.x}
            cy={y}
            r={particle.size}
            fill="#E0E0E0"
            opacity={particle.opacity}
          />
        );
      })}
    </svg>
  );
};
