import { StrictMode, useCallback, useState } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "./lib/supabase.js";
import App from "./App.jsx";
import { AppErrorBoundary } from "./components/AppErrorBoundary.jsx";
import { AgeGate } from "./components/AgeGate.jsx";
import { PublicStackView } from "./components/PublicStackView.jsx";
import { PublicMemberProfilePage } from "./components/PublicMemberProfilePage.jsx";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import { GlobalStyles } from "./components/GlobalStyles.jsx";
import PricingPage from "./pages/PricingPage.jsx";
import { readAgeVerifiedFromStorage } from "./lib/ageVerification.js";
import { normalizeHandleInput } from "./lib/memberProfileHandle.js";
import { HashtagFeedPage } from "./components/HashtagFeedPage.jsx";
import { HASHTAG_TAG_RE } from "./lib/hashtagConstants.js";

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

const hashtagMatch = path.match(/^\/explore\/hashtag\/([^/]+)$/i);
const hashtagRawSeg = hashtagMatch ? decodeURIComponent(hashtagMatch[1] ?? "") : "";
const hashtagSlug =
  typeof hashtagRawSeg === "string"
    ? hashtagRawSeg.toLowerCase().replace(/^#+/, "").replace(/[^a-z0-9_]/g, "")
    : "";
const hashtagOk = hashtagSlug.length > 0 && HASHTAG_TAG_RE.test(hashtagSlug);

const app =
  path === "/pricing" ? (
    <>
      <GlobalStyles />
      <PricingPage />
    </>
  ) : shareIdFromPath != null && shareIdFromPath !== "" ? (
    <PublicStackViewWithAgeGate shareId={shareIdFromPath} />
  ) : profileHandleFromPath.length >= 3 ? (
    <ThemeProvider>
      <PublicMemberProfileWithAgeGate handle={profileHandleFromPath} />
    </ThemeProvider>
  ) : hashtagOk ? (
    <ThemeProvider>
      <HashtagFeedPage tag={hashtagSlug} />
    </ThemeProvider>
  ) : (
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  );

createRoot(rootEl).render(<StrictMode>{app}</StrictMode>);
