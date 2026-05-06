/** Dispatched from TutorialContext when forced core tutorial marks tutorial_completed. Mirrors pepguide:open-network-tab. */
export const POST_TUTORIAL_COMPLETE_EVENT = "pepguide:post-tutorial-complete";

/** Session gate: after user completes or skips the post-tutorial profile prompt once this browser session. */
export const POST_TUTORIAL_SHOWN_KEY = "post_tutorial_shown";

/** One toast per session after landing on Stack Builder from this flow. */
export const POST_TUTORIAL_STACK_TOAST_KEY = "post_tutorial_stack_toast_shown";

/**
 * @param {Record<string, unknown> | null | undefined} profile
 * @returns {boolean}
 */
export function isPostTutorialProfileComplete(profile) {
  if (!profile || typeof profile !== "object") return false;
  const key = typeof profile.avatar_r2_key === "string" ? profile.avatar_r2_key.trim() : "";
  const url = typeof profile.avatar_url === "string" ? profile.avatar_url.trim() : "";
  const hasAvatar = Boolean(key || url);
  const bio = typeof profile.bio === "string" ? profile.bio.trim() : "";
  const hasBio = bio.length > 0;
  const el = typeof profile.experience_level === "string" ? profile.experience_level.trim() : "";
  const hasExp = el.length > 0;
  return hasAvatar && hasBio && hasExp;
}

export function getPostTutorialShown() {
  try {
    if (typeof sessionStorage === "undefined") return false;
    return sessionStorage.getItem(POST_TUTORIAL_SHOWN_KEY) === "1";
  } catch {
    return false;
  }
}

export function setPostTutorialShown() {
  try {
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.setItem(POST_TUTORIAL_SHOWN_KEY, "1");
    }
  } catch {
    /* ignore */
  }
}

export function getStackBuilderToastShown() {
  try {
    if (typeof sessionStorage === "undefined") return false;
    return sessionStorage.getItem(POST_TUTORIAL_STACK_TOAST_KEY) === "1";
  } catch {
    return false;
  }
}

export function setStackBuilderToastShown() {
  try {
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.setItem(POST_TUTORIAL_STACK_TOAST_KEY, "1");
    }
  } catch {
    /* ignore */
  }
}

export const POST_TUTORIAL_TOAST_MESSAGE = "Stack saved. Now add your first compound. 💉";
