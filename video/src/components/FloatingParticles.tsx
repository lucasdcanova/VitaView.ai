import {useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useMemo} from 'react';

interface Particle {
  position: [number, number, number];
  speed: number;
  size: number;
}

export const FloatingParticles: React.FC<{count?: number}> = ({count = 50}) => {
  const frame = useCurrentFrame();
  const {width, height, fps} = useVideoConfig();

  const particles = useMemo<Particle[]>(() => {
    return Array.from({length: count}, (_, i) => ({
      position: [
        (Math.random() - 0.5) * 15,
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10,
      ] as [number, number, number],
      speed: 0.01 + Math.random() * 0.02,
      size: 0.05 + Math.random() * 0.1,
    }));
  }, [count]);

  return (
    <ThreeCanvas width={width} height={height} camera={{position: [0, 0, 8], fov: 50}}>
      <ambientLight intensity={0.5} />

      {particles.map((particle, i) => {
        // Movimento flutuante
        const yOffset = Math.sin((frame * particle.speed + i) * 0.05) * 2;
        const xOffset = Math.cos((frame * particle.speed + i) * 0.03) * 0.5;

        return (
          <mesh
            key={i}
            position={[
              particle.position[0] + xOffset,
              particle.position[1] + yOffset,
              particle.position[2],
            ]}
          >
            <sphereGeometry args={[particle.size, 16, 16]} />
            <meshStandardMaterial
              color="#E0E0E0"
              metalness={0.7}
              roughness={0.3}
              opacity={0.6}
              transparent
            />
          </mesh>
        );
      })}
    </ThreeCanvas>
  );
};
