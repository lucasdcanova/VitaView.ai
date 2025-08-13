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
      <div className={cn(
        "flex items-center justify-center", 
        sizeClasses[size],
        isColumn ? "mb-2" : "mr-3"
      )}>
        <img 
          src="/assets/vitaview_logo_icon.png" 
          alt="VitaView AI Logo" 
          className="w-full h-full object-contain" 
          onError={(e) => {
            console.warn('Primary logo failed to load, trying fallback');
            e.currentTarget.src = "/assets/vitaview_logo_new.png";
            e.currentTarget.onerror = (fallbackError) => {
              console.error('Both logo files failed to load:', fallbackError);
              // Could set a default SVG or text fallback here
              fallbackError.currentTarget.onerror = null;
            };
          }}
        />
      </div>
      
      {showText && (
        <div className="text-center">
          <span className={cn("font-semibold text-[#1E3A5F]", textSizeClasses[textSize])}>
            VitaView
          </span>
          <span className={cn("font-semibold text-[#448C9B] ml-1", textSizeClasses[textSize])}>
            AI
          </span>
        </div>
      )}
    </div>
  );
}

export default Logo;