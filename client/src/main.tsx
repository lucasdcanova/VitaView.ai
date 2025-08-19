import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Load CSP utilities
import CSPManager from "./utils/csp";
import ExternalScriptLoader from "./utils/load-external-scripts";
import ConnectionMonitor from "./utils/connection-monitor";

// Load CSP debugger and Stripe helper in development
if (process.env.NODE_ENV === 'development') {
  import("./utils/csp-debug");
  import("./utils/csp-stripe-fix");
}

// Initialize PWA manager
import("./utils/pwa-manager");

createRoot(document.getElementById("root")!).render(<App />);
