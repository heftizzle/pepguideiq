/**
 * Reconstituted-vial stability for Vial Lifecycle Tracker.
 * Every catalog row gets `stabilityDays` + `stabilityNote` via `resolveStability` (or explicit raw overrides).
 */

export const STABILITY_NOTE_7 =
  "Use within 7 days — degrades rapidly after reconstitution.";
export const STABILITY_NOTE_14 = "Use within 14 days refrigerated.";
export const STABILITY_NOTE_21 = "Use within 21 days refrigerated.";
export const STABILITY_NOTE_28 =
  "Use within 28 days of reconstitution. Refrigerate at 2-8°C. Never freeze once reconstituted.";
export const STABILITY_NOTE_RETATRUTIDE_28 =
  "Use within 28 days refrigerated. Conservative recommendation — some sources cite up to 60 days.";
export const STABILITY_NOTE_IGF1_DES_14 =
  "Use within 14 days. Less stable than IGF-1 LR3 due to absent IGFBP binding. Refrigerate at 2-8°C.";
export const STABILITY_NOTE_IGF1_LR3_30 =
  "Use within 30 days of reconstitution. Refrigerate at 2-8°C. Avoid freeze-thaw cycles.";
export const STABILITY_NOTE_GLP3_RC_28 = "Use within 28 days. Refrigerate at 2-8°C.";
export const STABILITY_NOTE_30_KLOW =
  "Use within 30 days. Stability limited by KPV component. Refrigerate at 2-8°C. Avoid freeze-thaw cycles.";
export const STABILITY_NOTE_60 = "Use within 60 days of reconstitution. Refrigerate at 2-8°C.";
export const STABILITY_NOTE_90 = "Stable up to 90 days refrigerated. Refrigerate at 2-8°C.";
export const STABILITY_NOTE_30_DEFAULT = "Use within 30 days refrigerated.";

function catalogCategories(entry) {
  if (Array.isArray(entry.categories) && entry.categories.length) return entry.categories.map(String);
  if (Array.isArray(entry.category)) return entry.category.map(String);
  if (typeof entry.category === "string" && entry.category) return [entry.category];
  return [];
}

/** Oral / topical / non-peptide — no reconstituted vial tracking. */
const NULL_IDS = new Set([
  "orforglipron",
  "5-amino-1mq",
  "l-carnitine",
  "lipo-c",
  "clenbuterol",
  "albuterol",
  "finasteride",
  "cabergoline",
  "tadalafil",
  "sildenafil",
  "argireline",
  "matrixyl",
  "snap-8",
  "ru58841",
  "os-01",
  "testosterone-topical",
]);

const DAYS_7 = new Set([]);

const DAYS_14 = new Set(["glp-1-cs"]);

const DAYS_21 = new Set([
  "tirzepatide",
  "tesamorelin",
  "sermorelin",
  "thymosin-alpha-1",
  "liraglutide",
  "mazdutide",
]);

const DAYS_28 = new Set([
  "semaglutide",
  "cagrilintide",
  "cjc-1295-dac",
  "cjc-1295-no-dac",
  "cjc-ipa-combo",
  "ghrp-2",
  "ghrp-6",
  "ipamorelin",
  "hexarelin",
  "aod9604",
  "kpv",
  "n-acetyl-selank-amidate",
  "n-acetyl-semax-amidate",
  "dsip",
  "kisspeptin",
  "vip",
  "thymalin",
  "epitalon",
  "n-acetyl-epitalon-amidate",
  "cerebrolysin",
  "ll37",
  "ara-290",
  "pt-141",
  "gonadorelin",
  "tesofensine-ipamorelin",
  "triple-gh-cjc-ipa-ghrp",
  "ss-31",
  "mots-c",
  "humanin",
  "pinealon",
  "testosterone-cypionate",
  "testosterone-enanthate",
  "testosterone-propionate",
  "testosterone-undecanoate",
  "nandrolone-decanoate",
]);

const DAYS_60 = new Set(["ghk-cu", "ghk-cu-skin", "glow"]);

const DAYS_90 = new Set(["bpc-157", "bpc-157-arginine", "tb-500", "wolverine-blend"]);

function noteForAutoDays(days, id) {
  if (days === 30 && id === "klow") return STABILITY_NOTE_30_KLOW;
  switch (days) {
    case 7:
      return STABILITY_NOTE_7;
    case 14:
      return STABILITY_NOTE_14;
    case 21:
      return STABILITY_NOTE_21;
    case 28:
      return STABILITY_NOTE_28;
    case 60:
      return STABILITY_NOTE_60;
    case 90:
      return STABILITY_NOTE_90;
    default:
      return STABILITY_NOTE_30_DEFAULT;
  }
}

/**
 * @param {Record<string, unknown>} entry
 * @returns {{ stabilityDays: number | null, stabilityNote: string | null }}
 */
export function resolveStability(entry) {
  const id = String(entry.id ?? "");

  if (Object.prototype.hasOwnProperty.call(entry, "stabilityDays")) {
    const days = entry.stabilityDays;
    if (days === null) return { stabilityDays: null, stabilityNote: null };
    if (typeof days === "number" && Number.isFinite(days)) {
      const note =
        Object.prototype.hasOwnProperty.call(entry, "stabilityNote") &&
        typeof entry.stabilityNote === "string" &&
        entry.stabilityNote.trim()
          ? String(entry.stabilityNote)
          : noteForAutoDays(days, id);
      return { stabilityDays: days, stabilityNote: note };
    }
    return { stabilityDays: null, stabilityNote: null };
  }

  const cats = catalogCategories(entry);
  const catSet = new Set(cats);
  const tags = Array.isArray(entry.tags) ? entry.tags.map((t) => String(t).toLowerCase()) : [];

  if (NULL_IDS.has(id)) return { stabilityDays: null, stabilityNote: null };
  if (catSet.has("SARMs") || catSet.has("Estrogen Control") || catSet.has("Thyroid Support")) {
    return { stabilityDays: null, stabilityNote: null };
  }

  if (DAYS_90.has(id)) return { stabilityDays: 90, stabilityNote: STABILITY_NOTE_90 };
  if (DAYS_60.has(id)) return { stabilityDays: 60, stabilityNote: STABILITY_NOTE_60 };
  if (id === "klow") return { stabilityDays: 30, stabilityNote: STABILITY_NOTE_30_KLOW };
  if (id === "igf-1-lr3")
    return { stabilityDays: 30, stabilityNote: STABILITY_NOTE_IGF1_LR3_30 };
  if (id === "igf-1-des")
    return { stabilityDays: 14, stabilityNote: STABILITY_NOTE_IGF1_DES_14 };
  if (id === "retatrutide")
    return { stabilityDays: 28, stabilityNote: STABILITY_NOTE_RETATRUTIDE_28 };
  if (id === "glp3-rc") return { stabilityDays: 28, stabilityNote: STABILITY_NOTE_GLP3_RC_28 };
  if (DAYS_28.has(id)) return { stabilityDays: 28, stabilityNote: STABILITY_NOTE_28 };
  if (catSet.has("Khavinson Bioregulators") || tags.some((t) => t.includes("khavinson"))) {
    return { stabilityDays: 28, stabilityNote: STABILITY_NOTE_28 };
  }
  if (DAYS_21.has(id)) return { stabilityDays: 21, stabilityNote: STABILITY_NOTE_21 };
  if (DAYS_14.has(id)) return { stabilityDays: 14, stabilityNote: STABILITY_NOTE_14 };
  if (DAYS_7.has(id)) return { stabilityDays: 7, stabilityNote: STABILITY_NOTE_7 };

  return { stabilityDays: 30, stabilityNote: STABILITY_NOTE_30_DEFAULT };
}

/** @deprecated Prefer `resolveStability` for `stabilityNote`. */
export function resolveStabilityDays(entry) {
  return resolveStability(entry).stabilityDays;
}
