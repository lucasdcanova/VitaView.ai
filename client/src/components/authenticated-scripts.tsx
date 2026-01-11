import { useEffect, useRef } from "react";

/**
 * Component that loads heavy scripts only after user is authenticated.
 * This includes PWA manager, CSP utilities, and other system scripts
 * that are not needed for the landing page.
 */
export function AuthenticatedScripts() {
  const initialized = useRef(false);

  useEffect(() => {
    // Prevent double initialization in strict mode
    if (initialized.current) return;
    initialized.current = true;

    // Load scripts asynchronously to not block rendering
    const loadScripts = async () => {
      try {
        // Load PWA manager (handles service worker, offline, install prompts)
        await import("@/utils/pwa-manager");

        // Load CSP manager
        await import("@/utils/csp");

        // Load connection monitor
        await import("@/utils/connection-monitor");

        // Load development tools only in dev mode
        if (import.meta.env.DEV) {
          await import("@/utils/csp-debug");
          await import("@/utils/csp-stripe-fix");
        }
      } catch (error) {
        console.warn("[AuthenticatedScripts] Error loading scripts:", error);
      }
    };

    // Delay loading slightly to prioritize UI rendering
    const timer = setTimeout(loadScripts, 100);
    return () => clearTimeout(timer);
  }, []);

  // This component doesn't render anything
  return null;
}

export default AuthenticatedScripts;
