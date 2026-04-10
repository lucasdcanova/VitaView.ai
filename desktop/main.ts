import path from "path";
import { URL } from "url";
import { app, BrowserWindow, Menu, shell, ipcMain } from "electron";

const APP_NAME = "VitaView";
const APP_ID = "br.com.lucascanova.vitaview.desktop";
const DEFAULT_PRODUCTION_URL = "https://vitaview.ai/auth";
const DEFAULT_DEVELOPMENT_URL = "http://localhost:3000/auth";

// Detect Mac App Store build: MAS builds set process.mas = true.
// Also check for sandbox indicators as fallback since process.mas can be
// unreliable across Electron versions and macOS updates.
const isMAS =
  process.platform === "darwin" &&
  app.isPackaged &&
  ((process as NodeJS.Process & { mas?: boolean }).mas === true ||
   (process as NodeJS.Process & { sandboxed?: boolean }).sandboxed === true ||
   process.execPath.includes("/Wrapper/"));

// Note: --jitless was previously applied here for MAS builds to work around
// macOS 26 W^X enforcement. Removed because it crashes V8 initialization
// on Electron 41 + ARM64 (EXC_BREAKPOINT in v8::Isolate::Initialize).
// The allow-jit entitlement in entitlements.mas.plist handles this instead.

let mainWindow: BrowserWindow | null = null;

function getStartUrl() {
  if (process.env.VITAVIEW_DESKTOP_START_URL) {
    return process.env.VITAVIEW_DESKTOP_START_URL;
  }

  return app.isPackaged ? DEFAULT_PRODUCTION_URL : DEFAULT_DEVELOPMENT_URL;
}

function getAllowedOrigins() {
  const startUrl = getStartUrl();
  const allowedOrigins = new Set<string>([
    "https://vitaview.ai",
    "https://www.vitaview.ai",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
  ]);

  try {
    allowedOrigins.add(new URL(startUrl).origin);
  } catch {
    // Ignore invalid override URLs and rely on the defaults above.
  }

  return allowedOrigins;
}

function isAllowedInAppNavigation(targetUrl: string) {
  try {
    const parsedUrl = new URL(targetUrl);
    return getAllowedOrigins().has(parsedUrl.origin);
  } catch {
    return false;
  }
}

async function openExternalUrl(targetUrl: string) {
  try {
    await shell.openExternal(targetUrl);
  } catch (error) {
    console.error("Failed to open external URL:", error);
  }
}

function createFallbackPage(targetUrl: string, errorDescription: string) {
  const safeTargetUrl = targetUrl.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const safeError = errorDescription.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  return `<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <title>${APP_NAME}</title>
    <style>
      :root {
        color-scheme: light;
      }
      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        background: linear-gradient(180deg, #f5f9ff 0%, #ffffff 100%);
        color: #17324f;
        font-family: "Segoe UI", Arial, sans-serif;
      }
      main {
        width: min(560px, calc(100vw - 48px));
        padding: 32px;
        border-radius: 24px;
        background: rgba(255, 255, 255, 0.92);
        box-shadow: 0 24px 80px rgba(23, 50, 79, 0.14);
      }
      h1 {
        margin: 0 0 12px;
        font-size: 28px;
      }
      p {
        margin: 0 0 14px;
        line-height: 1.5;
      }
      code {
        display: block;
        margin: 16px 0 0;
        padding: 14px 16px;
        border-radius: 16px;
        background: #eef5ff;
        color: #17324f;
        word-break: break-word;
      }
    </style>
  </head>
  <body>
    <main>
      <h1>VitaView indisponivel</h1>
      <p>O app desktop conseguiu abrir, mas nao carregou a pagina inicial agora.</p>
      <p>Verifique sua conexao e se o endpoint abaixo esta acessivel. Ao reabrir o app, ele tentara novamente.</p>
      <p><strong>Erro:</strong> ${safeError}</p>
      <code>${safeTargetUrl}</code>
    </main>
  </body>
</html>`;
}

function wireNavigationGuards(window: BrowserWindow) {
  window.webContents.setWindowOpenHandler(({ url }) => {
    void openExternalUrl(url);
    return { action: "deny" };
  });

  window.webContents.on("will-navigate", (event, navigationUrl) => {
    if (isAllowedInAppNavigation(navigationUrl)) {
      return;
    }

    event.preventDefault();
    void openExternalUrl(navigationUrl);
  });
}

function wireLoadFallback(window: BrowserWindow, startUrl: string) {
  window.webContents.on("did-fail-load", (_event, errorCode, errorDescription, validatedUrl, isMainFrame) => {
    if (!isMainFrame) {
      return;
    }

    // -3 is ERR_ABORTED, commonly emitted during legitimate redirects.
    if (errorCode === -3) {
      return;
    }

    const failedUrl = validatedUrl || startUrl;
    const fallbackHtml = createFallbackPage(failedUrl, errorDescription);
    void window.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(fallbackHtml)}`);
  });
}

async function createMainWindow() {
  const preloadPath = path.join(__dirname, "preload.js");
  const startUrl = getStartUrl();

  const window = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1100,
    minHeight: 720,
    autoHideMenuBar: true,
    show: false,
    title: APP_NAME,
    backgroundColor: "#FFFFFF",
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
      spellcheck: false,
    },
  });

  wireNavigationGuards(window);
  wireLoadFallback(window, startUrl);

  window.once("ready-to-show", () => {
    window.show();
  });

  await window.loadURL(startUrl);
  return window;
}

// ----------------------------------------------------------------------------
// Auto-update
// ----------------------------------------------------------------------------
// O updater roda em background e expõe seu estado ao renderer via IPC.
// Não usamos `checkForUpdatesAndNotify` porque ele dispara um diálogo nativo
// do Windows que atrapalha a experiência do usuário. Em vez disso, o frontend
// React mostra um banner sutil quando há uma atualização pronta.

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
  progress?: number; // 0..100
  error?: string;
  checkedAt?: number;
}

interface ElectronAutoUpdater {
  autoDownload: boolean;
  autoInstallOnAppQuit: boolean;
  disableWebInstaller: boolean;
  on(event: string, cb: (...args: any[]) => void): void;
  checkForUpdates(): Promise<unknown>;
  quitAndInstall(isSilent?: boolean, isForceRunAfter?: boolean): void;
}

let autoUpdaterInstance: ElectronAutoUpdater | null = null;
let updateStatus: UpdateStatus = {
  kind: "idle",
  currentVersion: app.getVersion(),
};
// Re-check a cada 6 horas para apps abertos por longos períodos.
const UPDATE_CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000;
let updateCheckTimer: NodeJS.Timeout | null = null;

function broadcastUpdateStatus() {
  for (const win of BrowserWindow.getAllWindows()) {
    if (!win.isDestroyed()) {
      win.webContents.send("vitaview:update-status", updateStatus);
    }
  }
}

function setUpdateStatus(patch: Partial<UpdateStatus>) {
  updateStatus = {
    ...updateStatus,
    ...patch,
    currentVersion: app.getVersion(),
  };
  broadcastUpdateStatus();
}

function setupAutoUpdates() {
  // MAS builds são atualizadas pela App Store — electron-updater não roda.
  if (!app.isPackaged || isMAS) {
    setUpdateStatus({ kind: "unsupported" });
    return;
  }

  if (!["win32", "darwin"].includes(process.platform)) {
    setUpdateStatus({ kind: "unsupported" });
    return;
  }

  // Lazy-import para que MAS builds nunca carreguem electron-updater.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { autoUpdater } = require("electron-updater") as {
    autoUpdater: ElectronAutoUpdater;
  };

  autoUpdaterInstance = autoUpdater;
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  if (process.platform === "win32") {
    autoUpdater.disableWebInstaller = false;
  }

  autoUpdater.on("checking-for-update", () => {
    setUpdateStatus({ kind: "checking", checkedAt: Date.now() });
  });

  autoUpdater.on("update-available", (info: { version: string }) => {
    console.log(`[Updater] Update available: ${info.version}`);
    setUpdateStatus({ kind: "available", version: info.version });
  });

  autoUpdater.on("update-not-available", (info: { version: string }) => {
    console.log(`[Updater] No updates (current ${info.version})`);
    setUpdateStatus({ kind: "not-available", version: info.version });
  });

  autoUpdater.on("download-progress", (progress: { percent: number }) => {
    setUpdateStatus({ kind: "downloading", progress: Math.round(progress.percent) });
  });

  autoUpdater.on("update-downloaded", (info: { version: string }) => {
    console.log(`[Updater] Update downloaded: ${info.version}`);
    setUpdateStatus({ kind: "downloaded", version: info.version, progress: 100 });
  });

  autoUpdater.on("error", (error: Error) => {
    console.error("[Updater] Auto-update failed:", error);
    setUpdateStatus({ kind: "error", error: error.message });
  });

  // Check inicial + recheck periódico para sessões longas.
  void autoUpdater.checkForUpdates().catch((err) => {
    console.error("[Updater] Initial check failed:", err);
  });

  if (updateCheckTimer) {
    clearInterval(updateCheckTimer);
  }
  updateCheckTimer = setInterval(() => {
    if (!autoUpdaterInstance) return;
    void autoUpdaterInstance.checkForUpdates().catch((err) => {
      console.error("[Updater] Periodic check failed:", err);
    });
  }, UPDATE_CHECK_INTERVAL_MS);
}

function registerUpdateIpc() {
  ipcMain.handle("vitaview:get-update-status", () => updateStatus);
  ipcMain.handle("vitaview:get-app-version", () => app.getVersion());

  ipcMain.handle("vitaview:check-for-updates", async () => {
    if (!autoUpdaterInstance) {
      return { ok: false, reason: "unsupported" as const };
    }
    try {
      await autoUpdaterInstance.checkForUpdates();
      return { ok: true as const };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setUpdateStatus({ kind: "error", error: message });
      return { ok: false, reason: "error" as const, message };
    }
  });

  ipcMain.handle("vitaview:install-update-now", () => {
    if (!autoUpdaterInstance || updateStatus.kind !== "downloaded") {
      return { ok: false, reason: "not-ready" as const };
    }
    // isSilent=true (Windows): sem prompt; isForceRunAfter=true: reabre o app.
    autoUpdaterInstance.quitAndInstall(true, true);
    return { ok: true as const };
  });
}

const singleInstanceLock = app.requestSingleInstanceLock();

if (!singleInstanceLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (!mainWindow) {
      return;
    }

    if (mainWindow.isMinimized()) {
      mainWindow.restore();
    }

    mainWindow.focus();
  });
}

app.setName(APP_NAME);
app.setAppUserModelId(APP_ID);

app.whenReady().then(async () => {
  Menu.setApplicationMenu(null);
  registerUpdateIpc();
  mainWindow = await createMainWindow();
  setupAutoUpdates();

  app.on("activate", async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      mainWindow = await createMainWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
