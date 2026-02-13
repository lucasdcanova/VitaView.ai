import {useCurrentFrame, useVideoConfig, interpolate, Easing, spring} from 'remotion';
import {ThreeCanvas} from '@remotion/three';

interface FeatureIcon3DProps {
  type: 'microphone' | 'prescription' | 'lab' | 'calendar' | 'ai';
  delay?: number;
}

export const FeatureIcon3D: React.FC<FeatureIcon3DProps> = ({type, delay = 0}) => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();

  // Entrada com spring
  const entrance = spring({
    frame: frame - delay,
    fps,
    config: {damping: 200},
  });

  // Rotação suave
  const rotationY = (frame / fps) * Math.PI * 0.3;

  const renderIcon = () => {
    switch (type) {
      case 'microphone':
        // Microfone estilizado
        return (
          <group>
            {/* Corpo do microfone */}
            <mesh position={[0, 0.3, 0]}>
              <cylinderGeometry args={[0.3, 0.3, 0.8, 32]} />
              <meshStandardMaterial color="#424242" metalness={0.8} roughness={0.2} />
            </mesh>
            {/* Base */}
            <mesh position={[0, -0.5, 0]}>
              <cylinderGeometry args={[0.4, 0.5, 0.2, 32]} />
              <meshStandardMaterial color="#212121" metalness={0.9} roughness={0.1} />
            </mesh>
            {/* Grades */}
            <mesh position={[0, 0.5, 0]}>
              <sphereGeometry args={[0.35, 16, 16]} />
              <meshStandardMaterial
                color="#E0E0E0"
                metalness={0.6}
                roughness={0.4}
                wireframe
              />
            </mesh>
          </group>
        );

      case 'prescription':
        // Documento/prescrição
        return (
          <group>
            <mesh>
              <boxGeometry args={[0.8, 1.2, 0.05]} />
              <meshStandardMaterial color="#ffffff" metalness={0.1} roughness={0.8} />
            </mesh>
            {/* Linhas de texto */}
            {[0.3, 0.1, -0.1, -0.3].map((y, i) => (
              <mesh key={i} position={[0, y, 0.03]}>
                <boxGeometry args={[0.6, 0.05, 0.02]} />
                <meshStandardMaterial color="#424242" />
              </mesh>
            ))}
          </group>
        );

      case 'lab':
        // Tubo de ensaio
        return (
          <group>
            <mesh position={[0, -0.2, 0]}>
              <cylinderGeometry args={[0.15, 0.15, 0.8, 32]} />
              <meshStandardMaterial
                color="#E0E0E0"
                metalness={0.1}
                roughness={0.1}
                transparent
                opacity={0.9}
              />
            </mesh>
            {/* Líquido */}
            <mesh position={[0, -0.4, 0]}>
              <cylinderGeometry args={[0.14, 0.14, 0.4, 32]} />
              <meshStandardMaterial color="#424242" metalness={0.3} roughness={0.5} />
            </mesh>
            {/* Tampa */}
            <mesh position={[0, 0.25, 0]}>
              <cylinderGeometry args={[0.18, 0.18, 0.1, 32]} />
              <meshStandardMaterial color="#212121" metalness={0.8} roughness={0.2} />
            </mesh>
          </group>
        );

      case 'calendar':
        // Calendário
        return (
          <group>
            {/* Base */}
            <mesh>
              <boxGeometry args={[1, 1.2, 0.1]} />
              <meshStandardMaterial color="#ffffff" metalness={0.1} roughness={0.8} />
            </mesh>
            {/* Header */}
            <mesh position={[0, 0.5, 0.06]}>
              <boxGeometry args={[1, 0.25, 0.02]} />
              <meshStandardMaterial color="#212121" />
            </mesh>
            {/* Dias (grid) */}
            {Array.from({length: 12}).map((_, i) => {
              const row = Math.floor(i / 4);
              const col = i % 4;
              const x = -0.3 + col * 0.2;
              const y = 0.2 - row * 0.2;
              return (
                <mesh key={i} position={[x, y, 0.06]}>
                  <boxGeometry args={[0.15, 0.15, 0.02]} />
                  <meshStandardMaterial color="#E0E0E0" />
                </mesh>
              );
            })}
          </group>
        );

      case 'ai':
        // Brain/IA estilizado
        return (
          <group>
            <mesh>
              <sphereGeometry args={[0.6, 32, 32]} />
              <meshStandardMaterial
                color="#424242"
                metalness={0.7}
                roughness={0.3}
                wireframe
              />
            </mesh>
            {/* Núcleo interno */}
            <mesh>
              <sphereGeometry args={[0.3, 16, 16]} />
              <meshStandardMaterial
                color="#ffffff"
                metalness={0.5}
                roughness={0.2}
                emissive="#ffffff"
                emissiveIntensity={0.2}
              />
            </mesh>
          </group>
        );

      default:
        return null;
    }
  };

  return (
    <ThreeCanvas width={width} height={height} camera={{position: [0, 0, 3], fov: 45}}>
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 5, 5]} intensity={0.8} />
      <directionalLight position={[-5, -5, -5]} intensity={0.3} />
      <pointLight position={[2, 2, 2]} intensity={0.5} color="#ffffff" />

      <group rotation={[0, rotationY, 0]} scale={entrance}>
        {renderIcon()}
      </group>
    </ThreeCanvas>
  );
};
