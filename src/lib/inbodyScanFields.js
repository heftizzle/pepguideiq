/** @typedef {{ key: string, label: string, type: "iso" | "number" }} InbodyFieldDef */

/** Ordered fields matching `public.inbody_scan_history` + extraction JSON (excluding ids). */
export const INBODY_SCAN_FIELD_DEFS = /** @type {const} */ ([
  { key: "scan_date", label: "Scan date / time (ISO 8601)", type: "iso" },
  { key: "weight_lbs", label: "Weight (lb)", type: "number" },
  { key: "lean_mass_lbs", label: "Lean body mass (lb)", type: "number" },
  { key: "smm_lbs", label: "Skeletal muscle mass (lb)", type: "number" },
  { key: "pbf_pct", label: "Percent body fat (%)", type: "number" },
  { key: "fat_mass_lbs", label: "Body fat mass (lb)", type: "number" },
  { key: "inbody_score", label: "InBody score", type: "number" },
  { key: "bmi", label: "BMI", type: "number" },
  { key: "bmr_kcal", label: "BMR (kcal)", type: "number" },
  { key: "visceral_fat_level", label: "Visceral fat level", type: "number" },
  { key: "tbw_l", label: "Total body water (L)", type: "number" },
  { key: "icw_l", label: "Intracellular water (L)", type: "number" },
  { key: "ecw_l", label: "Extracellular water (L)", type: "number" },
  { key: "ecw_tbw_ratio", label: "ECW / TBW ratio", type: "number" },
  { key: "seg_lean_r_arm_lbs", label: "Segmental lean — right arm (lb)", type: "number" },
  { key: "seg_lean_l_arm_lbs", label: "Segmental lean — left arm (lb)", type: "number" },
  { key: "seg_lean_trunk_lbs", label: "Segmental lean — trunk (lb)", type: "number" },
  { key: "seg_lean_r_leg_lbs", label: "Segmental lean — right leg (lb)", type: "number" },
  { key: "seg_lean_l_leg_lbs", label: "Segmental lean — left leg (lb)", type: "number" },
  { key: "seg_fat_r_arm_pct", label: "Segmental fat — right arm (%)", type: "number" },
  { key: "seg_fat_l_arm_pct", label: "Segmental fat — left arm (%)", type: "number" },
  { key: "seg_fat_trunk_pct", label: "Segmental fat — trunk (%)", type: "number" },
  { key: "seg_fat_r_leg_pct", label: "Segmental fat — right leg (%)", type: "number" },
  { key: "seg_fat_l_leg_pct", label: "Segmental fat — left leg (%)", type: "number" },
]);

const WAIVER_STORAGE_KEY = "pepv.inbody_scan_waiver.v1";

export function hasAcceptedInbodyScanWaiver() {
  try {
    return typeof localStorage !== "undefined" && localStorage.getItem(WAIVER_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function setInbodyScanWaiverAccepted() {
  try {
    localStorage.setItem(WAIVER_STORAGE_KEY, "1");
  } catch {
    /* ignore */
  }
}

/** @param {Record<string, unknown>} values @param {Record<string, unknown>} confidence */
export function buildRawJsonPayload(values, confidence) {
  return { values, confidence, schemaVersion: 1 };
}

/**
 * @param {Record<string, string>} stringFields — edited display strings per key
 * @param {string} r2Key
 * @param {string} userId
 * @param {string} profileId
 * @param {unknown} rawJson — stored verbatim in `raw_json` (e.g. extraction + edits metadata)
 */
export function buildInbodyScanHistoryInsertRow(stringFields, r2Key, userId, profileId, rawJson) {
  /** @param {string} k */
  const num = (k) => {
    const s = String(stringFields[k] ?? "").trim();
    if (!s) return null;
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
  };
  const scanRaw = String(stringFields.scan_date ?? "").trim();
  let scan_date = null;
  if (scanRaw) {
    const t = Date.parse(scanRaw);
    scan_date = Number.isFinite(t) ? new Date(t).toISOString() : null;
  }
  return {
    user_id: userId,
    profile_id: profileId,
    r2_key: r2Key,
    raw_json: rawJson,
    scan_date,
    weight_lbs: num("weight_lbs"),
    lean_mass_lbs: num("lean_mass_lbs"),
    smm_lbs: num("smm_lbs"),
    pbf_pct: num("pbf_pct"),
    fat_mass_lbs: num("fat_mass_lbs"),
    inbody_score: num("inbody_score"),
    bmi: num("bmi"),
    bmr_kcal: num("bmr_kcal"),
    visceral_fat_level: num("visceral_fat_level"),
    tbw_l: num("tbw_l"),
    icw_l: num("icw_l"),
    ecw_l: num("ecw_l"),
    ecw_tbw_ratio: num("ecw_tbw_ratio"),
    seg_lean_r_arm_lbs: num("seg_lean_r_arm_lbs"),
    seg_lean_l_arm_lbs: num("seg_lean_l_arm_lbs"),
    seg_lean_trunk_lbs: num("seg_lean_trunk_lbs"),
    seg_lean_r_leg_lbs: num("seg_lean_r_leg_lbs"),
    seg_lean_l_leg_lbs: num("seg_lean_l_leg_lbs"),
    seg_fat_r_arm_pct: num("seg_fat_r_arm_pct"),
    seg_fat_l_arm_pct: num("seg_fat_l_arm_pct"),
    seg_fat_trunk_pct: num("seg_fat_trunk_pct"),
    seg_fat_r_leg_pct: num("seg_fat_r_leg_pct"),
    seg_fat_l_leg_pct: num("seg_fat_l_leg_pct"),
  };
}
