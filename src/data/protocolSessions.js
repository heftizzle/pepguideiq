/** Time-of-day sessions: protocol nav, Protocol tab, profile default, saved-stack toggles. */

export const PROTOCOL_SESSION_IDS = ["morning", "afternoon", "evening", "night"];

/** @type {Record<string, { emoji: string; navLabel: string; pillLabel: string }>} */
export const PROTOCOL_SESSION_UI = {
  morning: { emoji: "🌞", navLabel: "MORNING", pillLabel: "Morning" },
  afternoon: { emoji: "🌅", navLabel: "AFTERNOON", pillLabel: "Afternoon" },
  evening: { emoji: "🌙", navLabel: "EVENING", pillLabel: "Evening" },
  night: { emoji: "🌑", navLabel: "NIGHT", pillLabel: "Night" },
};

/** @returns {{ id: string; emoji: string; navLabel: string; pillLabel: string }[]} */
export function getProtocolSessionsOrdered() {
  return PROTOCOL_SESSION_IDS.map((id) => {
    const u = PROTOCOL_SESSION_UI[id];
    return { id, emoji: u.emoji, navLabel: u.navLabel, pillLabel: u.pillLabel };
  });
}

/** @param {unknown} id */
export function isProtocolSessionId(id) {
  return typeof id === "string" && PROTOCOL_SESSION_IDS.includes(id);
}
