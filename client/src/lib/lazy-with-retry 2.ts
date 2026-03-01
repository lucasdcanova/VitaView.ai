import { lazy, type ComponentType, type LazyExoticComponent } from "react";

const LAZY_RETRY_PREFIX = "lazy-module-retry";

const isDynamicImportFailure = (message: string) =>
  /Failed to fetch dynamically imported module|Importing a module script failed|Outdated Optimize Dep/i.test(
    message
  );

const getRetryKey = (id: string) => `${LAZY_RETRY_PREFIX}:${id}`;

export function lazyWithRetry<T extends ComponentType<any>>(
  importer: () => Promise<{ default: T }>,
  moduleId: string
): LazyExoticComponent<T> {
  return lazy(async () => {
    try {
      const module = await importer();
      if (typeof window !== "undefined") {
        sessionStorage.removeItem(getRetryKey(moduleId));
      }
      return module;
    } catch (error) {
      if (typeof window !== "undefined") {
        const message = error instanceof Error ? error.message : String(error);
        const retryKey = getRetryKey(moduleId);
        const hasRetried = sessionStorage.getItem(retryKey) === "1";

        if (isDynamicImportFailure(message) && !hasRetried) {
          sessionStorage.setItem(retryKey, "1");
          window.location.reload();
        } else {
          sessionStorage.removeItem(retryKey);
        }
      }

      throw error;
    }
  });
}
