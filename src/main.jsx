import { StrictMode, useCallback, useState } from "react";
import { createRoot } from "react-dom/client";
import "./lib/supabase.js";
import App from "./App.jsx";
import { AppErrorBoundary } from "./components/AppErrorBoundary.jsx";
import { AgeGate } from "./components/AgeGate.jsx";
import { PublicStackView } from "./components/PublicStackView.jsx";
import { PublicMemberProfilePage } from "./components/PublicMemberProfilePage.jsx";
import { GlobalStyles } from "./components/GlobalStyles.jsx";
import PricingPage from "./pages/PricingPage.jsx";
import { readAgeVerifiedFromStorage } from "./lib/ageVerification.js";
import { normalizeHandleInput } from "./lib/memberProfileHandle.js";

function PublicStackViewWithAgeGate({ shareId }) {
  const [ageVerified, setAgeVerified] = useState(readAgeVerifiedFromStorage);
  const onConfirm = useCallback(() => {
    setAgeVerified(true);
  }, []);
  const onExit = useCallback(() => {
    window.location.href = "https://www.google.com";
  }, []);
  return (
    <>
      {!ageVerified ? (
        <>
          <GlobalStyles />
          <AgeGate onConfirm={onConfirm} onExit={onExit} />
        </>
      ) : (
        <PublicStackView shareId={shareId} />
      )}
    </>
  );
}

function PublicMemberProfileWithAgeGate({ handle }) {
  const [ageVerified, setAgeVerified] = useState(readAgeVerifiedFromStorage);
  const onConfirm = useCallback(() => {
    setAgeVerified(true);
  }, []);
  const onExit = useCallback(() => {
    window.location.href = "https://www.google.com";
  }, []);
  const onClose = useCallback(() => {
    try {
      window.history.replaceState({}, "", "/");
    } catch {
      /* ignore */
    }
    window.location.assign("/");
  }, []);
  return (
    <>
      {!ageVerified ? (
        <>
          <GlobalStyles />
          <AgeGate onConfirm={onConfirm} onExit={onExit} />
        </>
      ) : (
        <PublicMemberProfilePage handle={handle} onClose={onClose} includeGlobalStyles />
      )}
    </>
  );
}

const rootEl = document.getElementById("root");
const path = (window.location.pathname || "/").replace(/\/$/, "") || "/";
const stackMatch = path.match(/^\/stack\/([^/]+)$/);
const shareIdFromPath = stackMatch ? decodeURIComponent(stackMatch[1]) : null;
const profileMatch = path.match(/^\/profile\/([^/]+)$/i);
const rawProfileHandle = profileMatch ? decodeURIComponent(profileMatch[1] ?? "") : "";
const profileHandleFromPath = rawProfileHandle ? normalizeHandleInput(rawProfileHandle) : "";

const app =
  path === "/pricing" ? (
    <>
      <GlobalStyles />
      <PricingPage />
    </>
  ) : shareIdFromPath != null && shareIdFromPath !== "" ? (
    <PublicStackViewWithAgeGate shareId={shareIdFromPath} />
  ) : profileHandleFromPath.length >= 3 ? (
    <PublicMemberProfileWithAgeGate handle={profileHandleFromPath} />
  ) : (
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  );

createRoot(rootEl).render(<StrictMode>{app}</StrictMode>);
