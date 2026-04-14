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
  { id: "mental_elevate", label: "🧠 Mental Elevate" },
  { id: "mental", label: "🧠 Mental" },
  { id: "general_health", label: "💚 General Health" },
];

/** @param {string} id */
export function publicProfileGoalLabel(id) {
  const key = String(id ?? "").trim().toLowerCase();
  const row = PUBLIC_PROFILE_GOAL_CHIPS.find((g) => g.id === key);
  return row?.label ?? id;
}
