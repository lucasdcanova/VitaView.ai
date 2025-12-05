import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { setupSecurity } from "./middleware/security";
import { advancedCompression } from "./middleware/compression";
import { httpsConfig } from "./security/https-config";
import { webApplicationFirewall } from "./security/waf";
import logger, { logError, logInfo, stream } from "./logger";
import morgan from "morgan";

const app = express();

// Setup compression middleware first for better performance (temporarily disabled)
// advancedCompression.applyCompression(app);

// Setup WAF middleware before other security layers
app.use(webApplicationFirewall.middleware());

// Parse CSP reports before security middleware handles them
app.use(
  "/api/csp-violation-report",
  express.json({
    limit: "100kb",
    type: ["application/json", "application/csp-report"],
  }),
);

// Setup security middleware
setupSecurity(app);

// Setup HTTP request logging
app.use(morgan('combined', { stream }));
// Aumentar limite de tamanho para permitir uploads maiores (50MB)
// Adicionar middleware CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

  // Responder às requisições OPTIONS do preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  next();
});

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      const meta = {
        method: req.method,
        path,
        statusCode: res.statusCode,
        duration,
        response: capturedJsonResponse
      };

      if (res.statusCode >= 400) {
        logger.error(`${req.method} ${path} ${res.statusCode} in ${duration}ms`, meta);
      } else {
        logger.info(`${req.method} ${path} ${res.statusCode} in ${duration}ms`, meta);
      }
    }
  });

  next();
});

(async () => {
  // First register all routes
  await registerRoutes(app);

  // Run database migration for dosage_unit column
  try {
    const { pool } = await import("./db");
    await pool.query(`
      ALTER TABLE medications 
      ADD COLUMN IF NOT EXISTS dosage_unit TEXT DEFAULT 'mg'
    `);
    logInfo("✅ Database migration: dosage_unit column verified/added");
  } catch (error) {
    logError("⚠️ Database migration warning (non-critical):", error);
  }


  // Then setup HTTPS server with the configured app
  const server = await httpsConfig.setupHTTPSServer(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 3000 (changed from 5000 due to macOS AirPlay conflict)
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = process.env.PORT || 3000;
  server.listen(port, () => {
    logInfo(`Server started on port ${port}`);
    log(`serving on port ${port}`);
  });
})();
