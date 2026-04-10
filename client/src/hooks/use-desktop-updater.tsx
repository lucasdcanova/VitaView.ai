import { useCallback, useEffect, useState } from "react";

export type DesktopUpdateKind =
  | "idle"
  | "checking"
  | "available"
  | "not-available"
  | "downloading"
  | "downloaded"
  | "error"
  | "unsupported";

export interface DesktopUpdateStatus {
  kind: DesktopUpdateKind;
  version?: string;
  currentVersion: string;
  progress?: number;
  error?: string;
  checkedAt?: number;
}

interface DesktopUpdaterApi {
  isDesktop: boolean;
  platform: string;
  status: DesktopUpdateStatus | null;
  appVersion: string | null;
  checkForUpdates: () => Promise<void>;
  installNow: () => Promise<void>;
  isChecking: boolean;
}

interface DesktopBridgeUpdates {
  getStatus(): Promise<DesktopUpdateStatus>;
  getAppVersion(): Promise<string>;
  checkForUpdates(): Promise<{ ok: boolean; reason?: string; message?: string }>;
  installNow(): Promise<{ ok: boolean; reason?: string }>;
  onStatus(callback: (status: DesktopUpdateStatus) => void): () => void;
}

interface DesktopBridge {
  isDesktop: boolean;
  platform: string;
  electronVersion: string;
  updates?: DesktopBridgeUpdates;
}

declare global {
  interface Window {
    vitaViewDesktop?: DesktopBridge;
  }
}

export function useDesktopUpdater(): DesktopUpdaterApi {
  const bridge = typeof window !== "undefined" ? window.vitaViewDesktop : undefined;
  const isDesktop = !!bridge?.isDesktop;
  const updates = bridge?.updates;

  const [status, setStatus] = useState<DesktopUpdateStatus | null>(null);
  const [appVersion, setAppVersion] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  // Estado inicial + escuta de eventos do main process.
  useEffect(() => {
    if (!updates) return;

    let cancelled = false;

    void updates
      .getStatus()
      .then((s) => {
        if (!cancelled) setStatus(s);
      })
      .catch(() => undefined);

    void updates
      .getAppVersion()
      .then((v) => {
        if (!cancelled) setAppVersion(v);
      })
      .catch(() => undefined);

    const off = updates.onStatus((next) => {
      if (cancelled) return;
      setStatus(next);
      if (next.kind !== "checking") {
        setIsChecking(false);
      }
    });

    return () => {
      cancelled = true;
      off();
    };
  }, [updates]);

  const checkForUpdates = useCallback(async () => {
    if (!updates) return;
    setIsChecking(true);
    try {
      await updates.checkForUpdates();
    } finally {
      // O setIsChecking(false) também é coberto pelo evento "checking" → próximo estado.
      setTimeout(() => setIsChecking(false), 4000);
    }
  }, [updates]);

  const installNow = useCallback(async () => {
    if (!updates) return;
    await updates.installNow();
  }, [updates]);

  return {
    isDesktop,
    platform: bridge?.platform ?? "web",
    status,
    appVersion,
    checkForUpdates,
    installNow,
    isChecking,
  };
}
