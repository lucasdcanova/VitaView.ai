import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface AudioWaveformProps {
  /** Nivel de audio normalizado entre 0 e 1 */
  level: number;
  /** Quando false, mostra estado de "silencio" (todas as barras no minimo) */
  active?: boolean;
  /** Numero de barras a renderizar (padrao 5) */
  bars?: number;
  className?: string;
}

/**
 * Visualizacao discreta de ondas de audio. Mantém um historico curto do nivel
 * para criar uma animacao fluida das barras (efeito "scrolling waveform").
 *
 * - Quando `active=true` e o microfone esta captando, as barras pulsam.
 * - Quando `active=false` ou nivel zero, fica visivel mas inerte (cinza).
 *
 * Usado junto ao botao/cartao de gravacao para confirmar visualmente que
 * o audio esta chegando ao sistema.
 */
export function AudioWaveform({
  level,
  active = true,
  bars = 5,
  className,
}: AudioWaveformProps) {
  // Mantemos um buffer rolling para popular as barras com valores ligeiramente
  // defasados — assim cada barra mostra um momento diferente do som recente.
  const historyRef = useRef<number[]>(Array(bars).fill(0));

  useEffect(() => {
    historyRef.current = [level, ...historyRef.current].slice(0, bars);
  }, [level, bars]);

  const heights = historyRef.current;

  return (
    <div
      className={cn(
        "inline-flex items-end gap-[2px] h-4",
        className
      )}
      aria-hidden="true"
    >
      {Array.from({ length: bars }).map((_, i) => {
        const value = heights[i] ?? 0;
        // Altura minima 18% (sempre visivel) escalando ate 100%
        const heightPct = active
          ? Math.max(18, Math.min(100, value * 100))
          : 18;
        return (
          <span
            key={i}
            className={cn(
              "w-[3px] rounded-full transition-[height,background-color] duration-75 ease-out",
              active
                ? "bg-current opacity-90"
                : "bg-current opacity-30"
            )}
            style={{ height: `${heightPct}%` }}
          />
        );
      })}
    </div>
  );
}
