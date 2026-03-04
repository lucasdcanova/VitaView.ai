import { Moon, Sun } from "lucide-react";

import { useTheme } from "@/hooks/use-theme";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ThemeToggleButtonProps {
  className?: string;
}

export default function ThemeToggleButton({ className }: ThemeToggleButtonProps) {
  const { theme, setTheme } = useTheme();
  const isDarkMode = theme === "dark";
  const nextTheme = isDarkMode ? "light" : "dark";
  const label = isDarkMode ? "Ativar modo claro" : "Ativar modo escuro";
  const Icon = isDarkMode ? Sun : Moon;

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn(
        "h-8 w-8 rounded-full border border-border bg-background/80 text-muted-foreground shadow-sm backdrop-blur-sm hover:bg-muted hover:text-foreground",
        className
      )}
      onClick={() => setTheme(nextTheme)}
      aria-label={label}
      aria-pressed={isDarkMode}
      title={label}
    >
      <Icon className="h-4 w-4" />
    </Button>
  );
}
