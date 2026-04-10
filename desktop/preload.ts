import { contextBridge, ipcRenderer } from "electron";

type UpdateStatusKind =
  | "idle"
  | "checking"
  | "available"
  | "not-available"
  | "downloading"
  | "downloaded"
  | "error"
  | "unsupported";

interface UpdateStatus {
  kind: UpdateStatusKind;
  version?: string;
  currentVersion: string;
  progress?: number;
  error?: string;
  checkedAt?: number;
}

contextBridge.exposeInMainWorld("vitaViewDesktop", {
  isDesktop: true,
  platform: process.platform,
  electronVersion: process.versions.electron,
  updates: {
    getStatus(): Promise<UpdateStatus> {
      return ipcRenderer.invoke("vitaview:get-update-status");
    },
    getAppVersion(): Promise<string> {
      return ipcRenderer.invoke("vitaview:get-app-version");
    },
    checkForUpdates(): Promise<{ ok: boolean; reason?: string; message?: string }> {
      return ipcRenderer.invoke("vitaview:check-for-updates");
    },
    installNow(): Promise<{ ok: boolean; reason?: string }> {
      return ipcRenderer.invoke("vitaview:install-update-now");
    },
    onStatus(callback: (status: UpdateStatus) => void): () => void {
      const listener = (_event: unknown, status: UpdateStatus) => callback(status);
      ipcRenderer.on("vitaview:update-status", listener);
      return () => {
        ipcRenderer.removeListener("vitaview:update-status", listener);
      };
    },
  },
});
