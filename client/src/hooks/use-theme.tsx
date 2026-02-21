import { createContext, useContext, useEffect, useMemo, useState } from "react";

type Theme = "dark" | "light";

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}

interface ThemeProviderState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const initialState: ThemeProviderState = {
  theme: "light",
  setTheme: () => null,
};

const isTheme = (value: string | null): value is Theme => value === "light" || value === "dark";

const resolveInitialTheme = (storageKey: string, defaultTheme: Theme): Theme => {
  if (typeof window === "undefined") {
    return defaultTheme;
  }

  const directTheme = localStorage.getItem(storageKey);
  if (isTheme(directTheme)) return directTheme;

  const legacyKeys = ["theme", "vite-ui-theme"];
  for (const key of legacyKeys) {
    const legacyTheme = localStorage.getItem(key);
    if (isTheme(legacyTheme)) return legacyTheme;
  }

  return defaultTheme;
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = "light",
  storageKey = "vitaview-theme",
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(() => resolveInitialTheme(storageKey, defaultTheme));

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    root.style.colorScheme = theme;
  }, [theme]);

  useEffect(() => {
    localStorage.setItem(storageKey, theme);
  }, [storageKey, theme]);

  useEffect(() => {
    const onStorageChange = (event: StorageEvent) => {
      if (event.key !== storageKey) return;
      if (isTheme(event.newValue)) {
        setThemeState(event.newValue);
      }
    };

    window.addEventListener("storage", onStorageChange);
    return () => window.removeEventListener("storage", onStorageChange);
  }, [storageKey]);

  const value = useMemo(
    () => ({
      theme,
      setTheme: (nextTheme: Theme) => {
        setThemeState(nextTheme);
      },
    }),
    [theme]
  );

  return <ThemeProviderContext.Provider value={value}>{children}</ThemeProviderContext.Provider>;
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined) throw new Error("useTheme must be used within a ThemeProvider");

  return context;
};
