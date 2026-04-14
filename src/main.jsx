import { StrictMode, useCallback, useState } from "react";
import { createRoot } from "react-dom/client";
import "./lib/supabase.js";
import App from "./App.jsx";
import { AgeGate } from "./components/AgeGate.jsx";
import { PublicStackView } from "./components/PublicStackView.jsx";
import { GlobalStyles } from "./components/GlobalStyles.jsx";
import PricingPage from "./pages/PricingPage.jsx";
import { readAgeVerifiedFromStorage, setAgeVerifiedInStorage } from "./lib/ageVerification.js";

function PublicStackViewWithAgeGate({ shareId }) {
  const [ageVerified, setAgeVerified] = useState(readAgeVerifiedFromStorage);
  const onConfirm = useCallback(() => {
    setAgeVerifiedInStorage();
    setAgeVerified(true);
  }, []);
  const onExit = useCallback(() => {
    window.location.href = "https://www.google.com";
  }, []);
  return (
    <>
      {!ageVerified && <AgeGate onConfirm={onConfirm} onExit={onExit} />}
      <PublicStackView shareId={shareId} />
    </>
  );
}

const rootEl = document.getElementById("root");
const path = (window.location.pathname || "/").replace(/\/$/, "") || "/";
const stackMatch = path.match(/^\/stack\/([^/]+)$/);
const shareIdFromPath = stackMatch ? decodeURIComponent(stackMatch[1]) : null;

const app =
  path === "/pricing" ? (
    <>
      <GlobalStyles />
      <PricingPage />
    </>
  ) : shareIdFromPath != null && shareIdFromPath !== "" ? (
    <PublicStackViewWithAgeGate shareId={shareIdFromPath} />
  ) : (
    <App />
  );

createRoot(rootEl).render(<StrictMode>{app}</StrictMode>);
