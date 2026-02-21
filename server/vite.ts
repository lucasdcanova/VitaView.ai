import express, { type Express, type Request } from "express";
import fs from "fs";
import path from "path";
import { createServer as createViteServer, createLogger } from "vite";
import { type Server } from "http";
import viteConfig from "../vite.config";
import { nanoid } from "nanoid";

const viteLogger = createLogger();

function stripQuery(url: string): string {
  return url.split("?")[0];
}

function isAssetRequest(url: string): boolean {
  const pathname = stripQuery(url);

  // Any file extension should be treated as a direct asset request.
  if (path.extname(pathname) !== "") return true;

  return (
    pathname.startsWith("/assets/") ||
    pathname.startsWith("/@vite") ||
    pathname.startsWith("/@fs/") ||
    pathname.startsWith("/@id/") ||
    pathname.startsWith("/node_modules/") ||
    pathname === "/favicon.ico" ||
    pathname === "/sw.js" ||
    pathname === "/manifest.webmanifest"
  );
}

function shouldServeSpaHtml(req: Request): boolean {
  if (req.method !== "GET" && req.method !== "HEAD") return false;

  const url = req.originalUrl || req.url || "/";
  const pathname = stripQuery(url);
  const accept = req.headers.accept || "";

  if (pathname.startsWith("/api")) return false;
  if (isAssetRequest(url)) return false;

  // Only serve index.html for real document navigations.
  return accept.includes("text/html");
}

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: serverOptions,
    appType: "custom",
  });

  // Prevent stale production chunk requests from being answered with Vite HTML 404 pages.
  app.use((req, res, next) => {
    const url = req.originalUrl || req.url || "";
    const pathname = stripQuery(url);
    const isStaleBuildAsset =
      req.method === "GET" &&
      pathname.startsWith("/assets/") &&
      /\.(js|mjs|css)$/i.test(pathname);

    if (isStaleBuildAsset) {
      return res.status(404).type("text/plain").send("Not Found");
    }

    return next();
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    if (!shouldServeSpaHtml(req)) {
      return next();
    }

    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html",
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`,
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(import.meta.dirname, "public");
  const landingPath = path.resolve(import.meta.dirname, "landing");

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  // Servir landing pages como HTML estático pré-renderizado (sem React)
  const landingRoutes: Record<string, string> = {
    '/termos': 'termos.html',
    '/privacidade': 'privacidade.html',
  };

  if (fs.existsSync(landingPath)) {
    for (const [route, fileName] of Object.entries(landingRoutes)) {
      const filePath = path.resolve(landingPath, fileName);
      if (fs.existsSync(filePath)) {
        app.get(route, (_req, res) => {
          res.sendFile(filePath);
        });
        log(`Landing page estática registrada: ${route} -> ${fileName}`);
      }
    }
  }

  app.use(express.static(distPath));

  // SPA fallback only for HTML navigation requests.
  app.use("*", (req, res, next) => {
    if (!shouldServeSpaHtml(req)) {
      if (isAssetRequest(req.originalUrl || req.url || "")) {
        return res.status(404).type("text/plain").send("Not Found");
      }
      return next();
    }

    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
