import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./lib/supabase.js";
import App from "./App.jsx";
import { PublicStackView } from "./components/PublicStackView.jsx";

const rootEl = document.getElementById("root");
const path = (window.location.pathname || "/").replace(/\/$/, "") || "/";
const stackMatch = path.match(/^\/stack\/([^/]+)$/);
const shareIdFromPath = stackMatch ? decodeURIComponent(stackMatch[1]) : null;

const app =
  shareIdFromPath != null && shareIdFromPath !== "" ? (
    <PublicStackView shareId={shareIdFromPath} />
  ) : (
    <App />
  );

createRoot(rootEl).render(<StrictMode>{app}</StrictMode>);
