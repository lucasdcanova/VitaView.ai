import { cn } from "@/lib/utils";

type BrandLoaderProps = {
  className?: string;
  label?: string;
};

export function BrandLoader({ className, label = "Carregando" }: BrandLoaderProps) {
  const normalizedClassName = className?.replace(/\banimate-spin\b/g, "").trim();

  return (
    <span
      role="status"
      aria-live="polite"
      aria-label={label}
      className={cn("inline-flex items-center justify-center", normalizedClassName)}
    >
      <svg
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-full w-full"
      >
        <circle
          cx="24"
          cy="24"
          r="18.5"
          stroke="currentColor"
          strokeWidth="1.1"
          strokeOpacity="0.2"
        />
        <circle
          cx="24"
          cy="24"
          r="18.5"
          stroke="currentColor"
          strokeWidth="1.35"
          strokeLinecap="round"
          strokeDasharray="34 120"
          className="origin-center animate-spin"
        />
        <path
          d="M9 12L15.5 35L24 16L32.5 35L39 12"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="sr-only">{label}</span>
    </span>
  );
}

export default BrandLoader;
