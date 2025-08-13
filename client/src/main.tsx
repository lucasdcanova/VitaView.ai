import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Load CSP utilities
import CSPManager from "./utils/csp";

// Load CSP debugger in development
if (process.env.NODE_ENV === 'development') {
  import("./utils/csp-debug");
}

createRoot(document.getElementById("root")!).render(<App />);
