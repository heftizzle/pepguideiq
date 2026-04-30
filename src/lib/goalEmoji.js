/**
 * Goal emoji mapping — single source of truth.
 *
 * Keys match canonical `GOAL_OPTIONS` ids in `ProfileTab.jsx` (`cognitive`,
 * `sleep_recovery`, `juiced`, …). Legacy CSV tokens are normalized before lookup.
 *
 * Used by:
 *   - `NotificationsBell.jsx` — fallback emoji for notification rows
 *   - `LikeButton.jsx` — picks the primary goal emoji as the like icon
 *   - Any future tribe-based social-proof surface
 */

const LEGACY_GOAL_ID_TO_CANONICAL = {
  mental_elevate: "cognitive",
  mental: "cognitive",
};

export const GOAL_PRIMARY_EMOJI = {
  general_health:   "💚",
  longevity:        "🧬",
  performance:      "🏆",
  shred:            "🔥",
  bulk:             "💪",
  recomp:           "⚖️",
  optimize:         "🎯",
  cognitive:        "🧠",
  sleep_recovery:   "🌙",
  juiced:           "💉",
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
    const lower = raw.toLowerCase();
    const key = LEGACY_GOAL_ID_TO_CANONICAL[lower] ?? lower;
    if (GOAL_PRIMARY_EMOJI[key]) return GOAL_PRIMARY_EMOJI[key];
  }
  return fallback;
}
