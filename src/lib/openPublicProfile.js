import { normalizeHandleInput } from "./memberProfileHandle.js";

/**
 * SPA navigation: set `/profile/{handle}` and notify `PepGuideIQApp` to show the public profile overlay.
 * @param {unknown} rawHandle — canonical or display form; `@` optional
 */
export function openPublicMemberProfile(rawHandle) {
  const h = normalizeHandleInput(rawHandle);
  if (!h || typeof window === "undefined") return;
  try {
    window.history.pushState({ pepguidePublicProfile: true }, "", `/profile/${encodeURIComponent(h)}`);
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new CustomEvent("pepguide:open-public-profile", { detail: { handle: h } }));
}
