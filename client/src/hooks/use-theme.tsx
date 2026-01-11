import { createContext, useContext } from 'react';

// Dark mode disabled - always use light theme
interface ThemeContextType {
    theme: 'light';
    resolvedTheme: 'light';
    setTheme: (theme: string) => void;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    // Always light mode - dark mode is disabled
    const theme = 'light' as const;
    const resolvedTheme = 'light' as const;

    // Remove any dark class that might be present
    if (typeof document !== 'undefined') {
        document.documentElement.classList.remove('dark');
        document.documentElement.classList.add('light');
    }

    const setTheme = () => {
        // Dark mode disabled - do nothing
    };

    const toggleTheme = () => {
        // Dark mode disabled - do nothing
    };

    return (
        <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        // Return default light theme if used outside provider
        return {
            theme: 'light' as const,
            resolvedTheme: 'light' as const,
            setTheme: () => { },
            toggleTheme: () => { },
        };
    }
    return context;
}
