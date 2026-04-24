import { useEffect, useRef } from "react";
import { useTutorial, TUTORIAL_TARGET } from "../context/TutorialContext.jsx";

const PENDING_KEY = "pepv_pending_core_tutorial";
const NAV_LIBRARY_SEL = `[data-tutorial-target="${TUTORIAL_TARGET.nav_library}"]`;
const POLL_MS = 100;
const MAX_ATTEMPTS = 10;
const EXISTING_USER_START_DELAY_MS = 800;

/**
 * Starts the forced core tutorial when the member has a handle and has not finished the core
 * walkthrough, once the Library nav target exists (DOM polling).
 *
 * Two paths:
 * - **Post-handle save:** `sessionStorage` pending flag set by HandleSetup → poll immediately (shell
 *   appears after HandleSetup’s own delay).
 * - **Existing users:** no pending flag, `tutorial_completed === false` on the profile row → wait
 *   {@link EXISTING_USER_START_DELAY_MS}ms then the same DOM poll + `startFlow`.
 *
 * @param {{
 *   needsHandleOnboarding: boolean;
 *   activeProfileHandle?: string | null;
 *   activeProfileId?: string | null;
 *   activeProfileTutorialCompleted?: boolean | null;
 *   activeProfileTutorialExplicitlyIncomplete?: boolean;
 * }} props
 */
export function DeferredCoreTutorialLauncher({
  needsHandleOnboarding,
  activeProfileHandle,
  activeProfileId,
  activeProfileTutorialCompleted,
  activeProfileTutorialExplicitlyIncomplete = false,
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

    const pending =
      typeof sessionStorage !== "undefined" && sessionStorage.getItem(PENDING_KEY) === "1";
    const existingUserPath =
      !pending && activeProfileTutorialExplicitlyIncomplete === true;

    if (!pending && !existingUserPath) return;

    const pid = typeof activeProfileId === "string" ? activeProfileId.trim() : "";
    if (pid && launchedForProfileRef.current === pid) return;

    let delayTimer = 0;
    let pollTimer = 0;
    let attempts = 0;

    const tryStart = () => {
      if (document.querySelector(NAV_LIBRARY_SEL)) {
        if (pending) {
          try {
            if (typeof sessionStorage !== "undefined") sessionStorage.removeItem(PENDING_KEY);
          } catch {
            /* ignore */
          }
        }
        if (pid) launchedForProfileRef.current = pid;
        startFlow("core", { forced: true });
        return true;
      }
      return false;
    };

    const tick = () => {
      attempts += 1;
      if (tryStart()) return true;
      if (attempts >= MAX_ATTEMPTS) {
        if (pending) {
          try {
            if (typeof sessionStorage !== "undefined") sessionStorage.removeItem(PENDING_KEY);
          } catch {
            /* ignore */
          }
        }
        return true;
      }
      return false;
    };

    const startPolling = () => {
      if (tick()) return;
      pollTimer = window.setInterval(() => {
        if (tick()) window.clearInterval(pollTimer);
      }, POLL_MS);
    };

    if (pending) {
      startPolling();
    } else {
      delayTimer = window.setTimeout(startPolling, EXISTING_USER_START_DELAY_MS);
    }

    return () => {
      if (delayTimer) window.clearTimeout(delayTimer);
      if (pollTimer) window.clearInterval(pollTimer);
    };
  }, [
    needsHandleOnboarding,
    activeProfileHandle,
    activeProfileId,
    activeProfileTutorialCompleted,
    activeProfileTutorialExplicitlyIncomplete,
    startFlow,
  ]);

  return null;
}
