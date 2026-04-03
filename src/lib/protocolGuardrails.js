export const TIMING_WARNINGS = {
  "nad-plus": {
    avoid: ["night"],
    message: "// Best taken before 2pm — stimulating effect may disrupt sleep.",
  },
  bromantane: {
    avoid: ["afternoon", "night"],
    message: "// Morning only — dopaminergic stimulation will affect sleep if taken late.",
  },
  "methylene-blue": {
    avoid: ["afternoon", "night"],
    message: "// Before noon only — MAO inhibition disrupts sleep architecture.",
  },
  semax: {
    avoid: ["night"],
    message: "// Morning preferred — nootropic/stimulating effect.",
  },
  "n-acetyl-semax-amidate": {
    avoid: ["night"],
    message: "// Morning preferred — nootropic/stimulating effect.",
  },
  "mots-c": {
    avoid: ["night"],
    message: "// Morning fasted preferred — exercise-mimetic metabolic activation.",
  },
  "ss-31": {
    avoid: [],
    message: null,
  },
  dsip: {
    avoid: ["morning", "afternoon"],
    message: "// Night only — sleep signal peptide, counterproductive earlier in the day.",
  },
  epithalon: {
    avoid: ["morning"],
    message: "// Night preferred — works with pineal/melatonin axis.",
  },
  selank: {
    avoid: [],
    message: null,
  },
  "n-acetyl-selank-amidate": {
    avoid: [],
    message: null,
  },
  pinealon: {
    avoid: ["morning"],
    message: "// Night preferred — pineal peptide, supports circadian rhythm.",
  },
  "cjc-1295-dac": {
    avoid: ["morning"],
    message: "// Night preferred — GH pulse amplification aligns with natural sleep-phase GH release.",
  },
  ipamorelin: {
    avoid: [],
    message: null,
  },
  sermorelin: {
    avoid: ["morning", "afternoon"],
    message: "// Best taken at bedtime — mimics natural GH release during sleep.",
  },
  "ghrp-2": {
    avoid: [],
    message: null,
  },
  "ghrp-6": {
    avoid: [],
    message: null,
  },
  hexarelin: {
    avoid: [],
    message: null,
  },
  "hgh-fragment-176-191": {
    avoid: ["afternoon", "night"],
    message: "// Morning fasted preferred — lipolytic effect is blunted post-meal and at night.",
  },
  "bpc-157": {
    avoid: [],
    message: null,
  },
  "tb-500": {
    avoid: [],
    message: null,
  },
  "nad-plus-subq": {
    avoid: ["night"],
    message: "// Best taken before 2pm — NAD+ is energizing and may disrupt sleep.",
  },
  "5-amino-1mq": {
    avoid: ["night"],
    message: "// Morning preferred — NNMT inhibition has stimulating metabolic effect.",
  },
  retatrutide: {
    avoid: [],
    message: null,
  },
  tirzepatide: {
    avoid: [],
    message: null,
  },
  semaglutide: {
    avoid: [],
    message: null,
  },
};

/**
 * Returns a timing warning string for a compound in a given session,
 * or null if no conflict exists.
 *
 * @param {string} compoundId - peptide id from catalog
 * @param {"morning"|"afternoon"|"night"} session
 * @returns {string|null}
 */
export function getTimingWarning(compoundId, session) {
  const rule = TIMING_WARNINGS[compoundId];
  if (!rule || !rule.avoid || !rule.avoid.includes(session)) return null;
  return rule.message ?? null;
}

/**
 * Returns true if any compound in the array has a timing conflict
 * with the given session.
 *
 * @param {string[]} compoundIds
 * @param {"morning"|"afternoon"|"night"} session
 * @returns {boolean}
 */
export function hasAnyTimingConflict(compoundIds, session) {
  return compoundIds.some((id) => getTimingWarning(id, session) !== null);
}
