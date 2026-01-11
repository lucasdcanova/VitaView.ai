import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Minimal startup - all heavy scripts are loaded lazily after authentication
createRoot(document.getElementById("root")!).render(<App />);
