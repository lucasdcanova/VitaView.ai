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
      className={cn("relative inline-flex items-center justify-center isolate", normalizedClassName)}
    >
      <span className="absolute inset-[7%] rounded-full border border-current/18" />
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="absolute inset-0 h-full w-full"
      >
        <circle
          cx="50"
          cy="50"
          r="43"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeOpacity="0.18"
        />
        <circle
          cx="50"
          cy="50"
          r="43"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeDasharray="26 110"
          className="origin-center animate-spin"
          style={{ animationDuration: "2.2s" }}
        />
      </svg>
      <img
        src="/logo-icon-transparent.png"
        alt=""
        aria-hidden="true"
        draggable={false}
        className="relative z-10 h-[68%] w-[68%] object-contain dark:hidden"
      />
      <img
        src="/logo-icon-transparent.png"
        alt=""
        aria-hidden="true"
        draggable={false}
        className="relative z-10 hidden h-[68%] w-[68%] object-contain dark:block dark:brightness-0 dark:invert"
      />
      <span className="sr-only">{label}</span>
    </span>
  );
}

export default BrandLoader;
