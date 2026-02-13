import {useCurrentFrame} from 'remotion';

const iconSize = 280;
const strokeWidth = 3;

export const MicrophoneIcon = () => {
  const frame = useCurrentFrame();
  const pulse = Math.sin(frame / 20) * 0.05 + 1;

  return (
    <svg width={iconSize} height={iconSize} viewBox="0 0 100 100">
      {/* Corpo do microfone */}
      <rect
        x="40"
        y="20"
        width="20"
        height="35"
        rx="10"
        fill="none"
        stroke="#212121"
        strokeWidth={strokeWidth}
        style={{transform: `scale(${pulse})`, transformOrigin: 'center'}}
      />
      {/* Base */}
      <path
        d="M 30 65 Q 50 75 70 65"
        fill="none"
        stroke="#212121"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      {/* Haste */}
      <line
        x1="50"
        y1="55"
        x2="50"
        y2="75"
        stroke="#212121"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      {/* Suporte */}
      <line
        x1="40"
        y1="75"
        x2="60"
        y2="75"
        stroke="#212121"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </svg>
  );
};

export const PrescriptionIcon = () => {
  return (
    <svg width={iconSize} height={iconSize} viewBox="0 0 100 100">
      {/* Documento */}
      <rect
        x="25"
        y="15"
        width="50"
        height="70"
        rx="3"
        fill="none"
        stroke="#212121"
        strokeWidth={strokeWidth}
      />
      {/* Linhas de texto */}
      {[30, 40, 50, 60, 70].map((y, i) => (
        <line
          key={i}
          x1="32"
          y1={y}
          x2={i === 4 ? "50" : "68"}
          y2={y}
          stroke="#424242"
          strokeWidth={2}
          strokeLinecap="round"
        />
      ))}
      {/* Símbolo Rx */}
      <text
        x="55"
        y="78"
        fontFamily="Georgia, serif"
        fontSize="20"
        fontWeight="bold"
        fill="#212121"
      >
        Rx
      </text>
    </svg>
  );
};

export const LabIcon = () => {
  const frame = useCurrentFrame();
  // Líquido sobe e desce
  const liquidLevel = Math.sin(frame / 40) * 5 + 50;

  return (
    <svg width={iconSize} height={iconSize} viewBox="0 0 100 100">
      {/* Tubo de ensaio */}
      <path
        d="M 35 20 L 35 75 Q 35 85 50 85 Q 65 85 65 75 L 65 20"
        fill="none"
        stroke="#212121"
        strokeWidth={strokeWidth}
      />
      {/* Líquido */}
      <path
        d={`M 37 ${liquidLevel} L 37 75 Q 37 83 50 83 Q 63 83 63 75 L 63 ${liquidLevel} Z`}
        fill="#E0E0E0"
        opacity="0.6"
      />
      {/* Borda superior */}
      <line
        x1="30"
        y1="20"
        x2="70"
        y2="20"
        stroke="#212121"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </svg>
  );
};

export const CalendarIcon = () => {
  return (
    <svg width={iconSize} height={iconSize} viewBox="0 0 100 100">
      {/* Base do calendário */}
      <rect
        x="20"
        y="25"
        width="60"
        height="60"
        rx="3"
        fill="none"
        stroke="#212121"
        strokeWidth={strokeWidth}
      />
      {/* Header */}
      <rect
        x="20"
        y="25"
        width="60"
        height="15"
        fill="#212121"
      />
      {/* Argolas */}
      <circle cx="35" cy="20" r="3" fill="none" stroke="#212121" strokeWidth={strokeWidth} />
      <circle cx="65" cy="20" r="3" fill="none" stroke="#212121" strokeWidth={strokeWidth} />
      <line x1="35" y1="20" x2="35" y2="30" stroke="#212121" strokeWidth={strokeWidth} />
      <line x1="65" y1="20" x2="65" y2="30" stroke="#212121" strokeWidth={strokeWidth} />
      {/* Grid de dias */}
      {[0, 1, 2].map((row) =>
        [0, 1, 2, 3].map((col) => (
          <rect
            key={`${row}-${col}`}
            x={25 + col * 12}
            y={45 + row * 12}
            width="10"
            height="10"
            fill={row === 1 && col === 2 ? '#212121' : 'none'}
            stroke="#424242"
            strokeWidth="1"
          />
        ))
      )}
    </svg>
  );
};

export const AIIcon = () => {
  const frame = useCurrentFrame();
  const rotation = (frame / 2) % 360;

  return (
    <svg width={iconSize} height={iconSize} viewBox="0 0 100 100">
      {/* Círculo central */}
      <circle
        cx="50"
        cy="50"
        r="15"
        fill="none"
        stroke="#212121"
        strokeWidth={strokeWidth}
      />
      {/* Nós externos girando */}
      {[0, 120, 240].map((angle, i) => {
        const rad = ((angle + rotation) * Math.PI) / 180;
        const x = 50 + Math.cos(rad) * 25;
        const y = 50 + Math.sin(rad) * 25;

        return (
          <g key={i}>
            <line
              x1="50"
              y1="50"
              x2={x}
              y2={y}
              stroke="#424242"
              strokeWidth="2"
            />
            <circle
              cx={x}
              cy={y}
              r="6"
              fill="#212121"
            />
          </g>
        );
      })}
    </svg>
  );
};
