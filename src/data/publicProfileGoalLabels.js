/**
 * Goal ids stored on `member_profiles.goals` (CSV). Keep ids aligned with `ProfileTab.jsx` GOAL_OPTIONS.
 */
export const PUBLIC_PROFILE_GOAL_CHIPS = [
  { id: "shred", label: "🔥 Shred" },
  { id: "bulk", label: "💪 Bulk" },
  { id: "recomp", label: "⚖️ Recomp" },
  { id: "longevity", label: "🧬 Longevity" },
  { id: "performance", label: "🏆 Performance" },
  { id: "optimize", label: "🎯 Optimize" },
  { id: "cognitive", label: "🧠 Cognitive" },
  { id: "sleep_recovery", label: "🌙 Sleep & Recovery" },
  { id: "juiced", label: "💉 Juiced" },
  { id: "general_health", label: "💚 General Health" },
];

/** Older stored ids → current chip keys (same as ProfileTab legacy map). */
const LEGACY_GOAL_ID_TO_CANONICAL = {
  mental_elevate: "cognitive",
  mental: "cognitive",
};

/** @param {string} id */
export function publicProfileGoalLabel(id) {
  const raw = String(id ?? "").trim().toLowerCase();
  const key = LEGACY_GOAL_ID_TO_CANONICAL[raw] ?? raw;
  const row = PUBLIC_PROFILE_GOAL_CHIPS.find((g) => g.id === key);
  return row?.label ?? id;
}
