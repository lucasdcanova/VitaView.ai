import {useCurrentFrame, useVideoConfig, interpolate, Easing} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import * as THREE from 'three';

export const Logo3D: React.FC<{scale?: number}> = ({scale = 1}) => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();

  // Entrada suave com spring
  const entrance = interpolate(frame, [0, 1.5 * fps], [0, 1], {
    easing: Easing.out(Easing.exp),
    extrapolateRight: 'clamp',
  });

  // Rotação contínua
  const rotationY = (frame / fps) * Math.PI * 0.5;
  const rotationX = Math.sin(frame / fps) * 0.1;

  // Escala pulsante sutil
  const pulse = Math.sin(frame / 15) * 0.02 + 1;

  return (
    <ThreeCanvas width={width} height={height} camera={{position: [0, 0, 5], fov: 45}}>
      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 5, 5]} intensity={0.8} />
      <directionalLight position={[-5, -5, -5]} intensity={0.3} />
      <pointLight position={[0, 0, 3]} intensity={0.5} color="#ffffff" />

      {/* Logo principal - cubo com bordas */}
      <group
        rotation={[rotationX, rotationY, 0]}
        scale={entrance * scale * pulse}
      >
        {/* Cubo sólido interno */}
        <mesh>
          <boxGeometry args={[1.5, 1.5, 1.5]} />
          <meshStandardMaterial
            color="#212121"
            metalness={0.8}
            roughness={0.2}
            envMapIntensity={1}
          />
        </mesh>

        {/* Bordas do cubo */}
        <lineSegments>
          <edgesGeometry
            args={[new THREE.BoxGeometry(1.5, 1.5, 1.5)]}
          />
          <lineBasicMaterial color="#ffffff" linewidth={2} />
        </lineSegments>

        {/* Cruz 3D no centro (símbolo médico) */}
        {/* Barra vertical */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.3, 1.2, 0.3]} />
          <meshStandardMaterial color="#ffffff" metalness={0.5} roughness={0.3} />
        </mesh>
        {/* Barra horizontal */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[1.2, 0.3, 0.3]} />
          <meshStandardMaterial color="#ffffff" metalness={0.5} roughness={0.3} />
        </mesh>
      </group>
    </ThreeCanvas>
  );
};
