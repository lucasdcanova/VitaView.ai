import { cn } from "@/lib/utils";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
  className?: string;
  showText?: boolean;
  textSize?: "sm" | "md" | "lg" | "xl";
  onClick?: () => void;
  /**
   * Variante do logo:
   * - "icon": Usa apenas o ícone/símbolo (LOGO SEM TEXTO.jpg) - ideal para header, sidebar, footer
   * - "full": Usa o logo completo com texto (LOGO COM TEXTO.PNG) - ideal para hero, login, páginas de destaque
   * - "legacy": Usa o SVG original gerado dinamicamente
   */
  variant?: "icon" | "full" | "legacy";
}

const sizeClasses = {
  sm: "h-8 w-8",
  md: "h-12 w-12",
  lg: "h-16 w-16",
  xl: "h-20 w-20",
  "2xl": "h-28 w-28"
};

// Tamanhos para a imagem do logo completo (proporcionalmente maiores para acomodar texto)
const fullLogoSizeClasses = {
  sm: "h-10",
  md: "h-14",
  lg: "h-20",
  xl: "h-28",
  "2xl": "h-40"
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
 * - variant="icon": Usa LOGO SEM TEXTO.jpg para cabeçalhos e áreas compactas
 * - variant="full": Usa LOGO COM TEXTO.PNG para hero, login e destaques
 * - variant="legacy": SVG gerado dinamicamente (compatibilidade)
 */
export function Logo({
  size = "md",
  className,
  showText = true,
  textSize = "md",
  onClick,
  variant = "legacy"
}: LogoProps) {
  const isColumn = className?.includes('flex-col');

  // Variante com logo completo (imagem com texto)
  if (variant === "full") {
    return (
      <div
        className={cn("flex items-center justify-center", onClick && "cursor-pointer", className)}
        onClick={onClick}
      >
        <img
          src="/LOGO COM TEXTO.PNG"
          alt="VitaView AI"
          className={cn(fullLogoSizeClasses[size], "object-contain mix-blend-multiply dark:brightness-0 dark:invert dark:mix-blend-screen")}
        />
      </div>
    );
  }

  // Variante apenas com ícone (imagem sem texto)
  if (variant === "icon") {
    return (
      <div
        className={cn("flex items-center", onClick && "cursor-pointer", className)}
        onClick={onClick}
      >
        <img
          src="/LOGO SEM TEXTO.jpg"
          alt="VitaView AI"
          className={cn(sizeClasses[size], "object-contain rounded-md mix-blend-multiply dark:invert dark:mix-blend-screen")}
        />
        {showText && (
          <div className={cn("text-center", isColumn ? "mt-2" : "ml-3", isColumn ? "" : "flex items-baseline")}>
            <span
              className={cn(
                "font-heading font-bold text-foreground",
                textSizeClasses[textSize]
              )}
            >
              VitaView
            </span>
            <span
              className={cn(
                "font-heading font-bold text-muted-foreground ml-0.5",
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

  // Variante legacy (SVG original)
  return (
    <div
      className={cn("flex items-center text-foreground", onClick && "cursor-pointer", className)}
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
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          {/* Segundo V entrelaçado */}
          <path
            d="M20 12L30 36L40 12"
            stroke="currentColor"
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
              "font-heading font-bold text-foreground",
              textSizeClasses[textSize]
            )}
          >
            VitaView
          </span>
          <span
            className={cn(
              "font-heading font-bold text-muted-foreground ml-0.5",
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