import path from "path";
import { URL } from "url";
import { app, BrowserWindow, Menu, shell } from "electron";
import electronUpdater from "electron-updater";

const { autoUpdater } = electronUpdater;

const APP_NAME = "VitaView";
const APP_ID = "br.com.lucascanova.vitaview.desktop";
const DEFAULT_PRODUCTION_URL = "https://vitaview.ai/auth";
const DEFAULT_DEVELOPMENT_URL = "http://localhost:3000/auth";

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

function setupAutoUpdates() {
  if (!app.isPackaged || !["win32", "darwin"].includes(process.platform)) {
    return;
  }

  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  if (process.platform === "win32") {
    autoUpdater.disableWebInstaller = false;
  }

  autoUpdater.on("error", (error) => {
    console.error("Auto-update failed:", error);
  });

  autoUpdater.on("update-available", (info) => {
    console.log(`Update available: ${info.version}`);
  });

  autoUpdater.on("update-downloaded", (info) => {
    console.log(`Update downloaded: ${info.version}. It will be installed when the app closes.`);
  });

  void autoUpdater.checkForUpdatesAndNotify();
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
