/**
 * Goal emoji mapping — single source of truth.
 *
 * Mirrors `GOAL_OPTIONS` in `src/components/ProfileTab.jsx` plus the
 * `mental` alias that existed in NotificationsBell's local helper.
 *
 * Used by:
 *   - `NotificationsBell.jsx` — fallback emoji for notification rows
 *   - `LikeButton.jsx` — picks the primary goal emoji as the like icon
 *   - Any future tribe-based social-proof surface
 */

export const GOAL_PRIMARY_EMOJI = {
  general_health: "💚",
  longevity: "🧬",
  performance: "🏆",
  shred: "🔥",
  bulk: "💪",
  recomp: "⚖️",
  optimize: "🎯",
  mental_elevate: "🧠",
  mental: "🧠",
};

/** Fallback used by `LikeButton` when the viewer has no goals set. */
export const DEFAULT_LIKE_EMOJI = "🎯";

/**
 * Normalize `member_profiles.goals` (CSV TEXT in DB, but callers
 * sometimes pass arrays or JSON).
 *
 * @param {unknown} userGoals — string (CSV), string[], or null
 * @returns {string[]}
 */
export function normalizeGoalIdList(userGoals) {
  if (Array.isArray(userGoals)) {
    return userGoals.map((x) => String(x ?? "").trim()).filter(Boolean);
  }
  if (typeof userGoals === "string") {
    return userGoals.split(",").map((s) => s.trim()).filter(Boolean);
  }
  return [];
}

/**
 * First selected goal → emoji; otherwise `fallback`.
 *
 * @param {unknown} userGoals — CSV string or string[] from `member_profiles.goals`
 * @param {string} [fallback=DEFAULT_LIKE_EMOJI]
 * @returns {string}
 */
export function primaryGoalEmoji(userGoals, fallback = DEFAULT_LIKE_EMOJI) {
  for (const raw of normalizeGoalIdList(userGoals)) {
    const key = raw.toLowerCase();
    if (GOAL_PRIMARY_EMOJI[key]) return GOAL_PRIMARY_EMOJI[key];
  }
  return fallback;
}
