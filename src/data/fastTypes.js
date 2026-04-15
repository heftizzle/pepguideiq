/** @type {{ id: string, label: string }[]} */
export const FAST_TYPES = [
  { id: "water_fast", label: "Water Fast" },
  { id: "liquid_fast", label: "Liquid Fast" },
  { id: "labs_fast", label: "Labs Fast" },
  { id: "intermittent_fasting", label: "Intermittent Fasting" },
  { id: "evoo_fast", label: "EVOO Fast" },
  { id: "sardine_fast", label: "Sardine Fast" },
];

const FAST_TYPE_SET = new Set(FAST_TYPES.map((t) => t.id));

/**
 * @param {unknown} id
 * @returns {string}
 */
export function fastTypeLabel(id) {
  const s = typeof id === "string" ? id : "";
  const row = FAST_TYPES.find((t) => t.id === s);
  return row ? row.label : s || "Fast";
}

/**
 * @param {unknown} id
 * @returns {boolean}
 */
export function isValidFastTypeId(id) {
  return typeof id === "string" && FAST_TYPE_SET.has(id);
}
