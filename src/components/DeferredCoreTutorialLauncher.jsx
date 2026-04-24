import { useEffect, useRef } from "react";
import { useTutorial, TUTORIAL_TARGET } from "../context/TutorialContext.jsx";

const NAV_LIBRARY_SEL = `[data-tutorial-target="${TUTORIAL_TARGET.nav_library}"]`;
const POLL_MS = 100;
const MAX_ATTEMPTS = 10;

/**
 * Starts the forced core tutorial when the member has a handle and has not finished the core
 * walkthrough (`tutorial_completed`), once the Library nav target exists (DOM polling).
 * @param {{
 *   needsHandleOnboarding: boolean;
 *   activeProfileHandle?: string | null;
 *   activeProfileId?: string | null;
 *   activeProfileTutorialCompleted?: boolean | null;
 * }} props
 */
export function DeferredCoreTutorialLauncher({
  needsHandleOnboarding,
  activeProfileHandle,
  activeProfileId,
  activeProfileTutorialCompleted,
}) {
  const { startFlow } = useTutorial();
  const launchedForProfileRef = useRef(/** @type {string | null} */ (null));

  useEffect(() => {
    if (needsHandleOnboarding) {
      launchedForProfileRef.current = null;
      return;
    }
    if (typeof document === "undefined") return;
    const h = typeof activeProfileHandle === "string" ? activeProfileHandle.trim() : "";
    if (!h) return;
    if (activeProfileTutorialCompleted === true) return;
    const pid = typeof activeProfileId === "string" ? activeProfileId.trim() : "";
    if (pid && launchedForProfileRef.current === pid) return;

    const tryStart = () => {
      if (document.querySelector(NAV_LIBRARY_SEL)) {
        if (pid) launchedForProfileRef.current = pid;
        startFlow("core", { forced: true });
        return true;
      }
      return false;
    };

    let attempts = 0;
    const tick = () => {
      attempts += 1;
      if (tryStart()) return true;
      if (attempts >= MAX_ATTEMPTS) {
        return true;
      }
      return false;
    };

    if (tick()) return;

    const id = window.setInterval(() => {
      if (tick()) window.clearInterval(id);
    }, POLL_MS);

    return () => window.clearInterval(id);
  }, [needsHandleOnboarding, activeProfileHandle, activeProfileId, activeProfileTutorialCompleted, startFlow]);

  return null;
}
