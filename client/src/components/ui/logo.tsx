import { cn } from "@/lib/utils";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  showText?: boolean;
  textSize?: "sm" | "md" | "lg" | "xl";
  onClick?: () => void;
}

const sizeClasses = {
  sm: "h-8 w-8",
  md: "h-12 w-12",
  lg: "h-16 w-16",
  xl: "h-20 w-20"
};

const textSizeClasses = {
  sm: "text-lg",
  md: "text-xl",
  lg: "text-2xl",
  xl: "text-3xl"
};

/**
 * VitaView AI Logo Component
 * 
 * Design Language:
 * - Logotipo textual minimalista
 * - Duas letras 'V' maiúsculas estilizadas (VV) entrelaçadas
 * - Geométrico, limpo, moderno
 * - Cor Charcoal Gray (#212121) sobre fundos claros
 */
export function Logo({
  size = "md",
  className,
  showText = true,
  textSize = "md",
  onClick
}: LogoProps) {
  const isColumn = className?.includes('flex-col');

  return (
    <div
      className={cn("flex items-center", onClick && "cursor-pointer", className)}
      onClick={onClick}
    >
      {/* Symbol: Duas letras V estilizadas */}
      <div className={cn(
        "flex items-center justify-center",
        sizeClasses[size],
        isColumn ? "mb-2" : "mr-3"
      )}>
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
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

      {showText && (
        <div className={cn("text-center", isColumn ? "" : "flex items-baseline")}>
          <span
            className={cn(
              "font-heading font-bold text-[#212121]",
              textSizeClasses[textSize]
            )}
          >
            VitaView
          </span>
          <span
            className={cn(
              "font-heading font-bold text-[#9E9E9E] ml-0.5",
              // AI em tamanho menor (sobrescrito)
              textSize === "xl" ? "text-lg" :
                textSize === "lg" ? "text-base" :
                  textSize === "md" ? "text-sm" : "text-xs",
              "align-super"
            )}
          >
            AI
          </span>
        </div>
      )}
    </div>
  );
}

export default Logo;