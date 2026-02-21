import { createContext, useContext, useEffect, useMemo, useState } from "react";

type Theme = "dark" | "light";

const THEME_MANIFEST_BY_MODE: Record<Theme, string> = {
  light: "/manifest.json",
  dark: "/manifest-dark.json",
};

const FALLBACK_STATUS_BAR_COLOR: Record<Theme, string> = {
  light: "#FFFFFF",
  dark: "#171A20",
};

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

const applyPwaChrome = (theme: Theme) => {
  const root = window.document.documentElement;
  const computedPureWhite = window.getComputedStyle(root).getPropertyValue("--pure-white").trim();
  const statusBarColor = computedPureWhite || FALLBACK_STATUS_BAR_COLOR[theme];

  document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]').forEach((meta) => {
    meta.setAttribute("content", statusBarColor);
  });

  const tileColorMeta = document.querySelector<HTMLMetaElement>('meta[name="msapplication-TileColor"]');
  if (tileColorMeta) {
    tileColorMeta.setAttribute("content", statusBarColor);
  }

  const statusBarStyleMeta = document.querySelector<HTMLMetaElement>('meta[name="apple-mobile-web-app-status-bar-style"]');
  if (statusBarStyleMeta) {
    statusBarStyleMeta.setAttribute("content", theme === "dark" ? "black" : "default");
  }

  const themeIconPath = theme === "dark" ? "/icon-192x192-dark.png" : "/icon-192x192.png";
  const themeAppleIconPath = theme === "dark" ? "/apple-touch-icon-dark.png" : "/apple-touch-icon.png";

  document.querySelectorAll<HTMLLinkElement>('link[data-theme-favicon="true"]').forEach((link) => {
    link.setAttribute("href", themeIconPath);
  });

  document.querySelectorAll<HTMLLinkElement>('link[data-theme-apple-icon="true"]').forEach((link) => {
    link.setAttribute("href", themeAppleIconPath);
  });

  const tileImageMeta = document.querySelector<HTMLMetaElement>('meta[name="msapplication-TileImage"]');
  if (tileImageMeta) {
    tileImageMeta.setAttribute("content", themeIconPath);
  }

  const manifestLink = document.querySelector<HTMLLinkElement>("#app-manifest") ??
    document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
  if (manifestLink) {
    const nextManifest = THEME_MANIFEST_BY_MODE[theme];
    if (manifestLink.getAttribute("href") !== nextManifest) {
      manifestLink.setAttribute("href", nextManifest);
    }
  }
};

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
    applyPwaChrome(theme);
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
