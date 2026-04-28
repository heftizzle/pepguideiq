/** @typedef {"haiku" | "sonnet"} AiGuideModelId */

/**
 * Canonical plan limits (source of truth for client copy + helpers).
 * Keep `aiQueriesPerDay` in sync with `ai_guide_calls_per_day` (AI Atlas / Worker daily cap).
 */
export const TIERS = {
  entry: {
    name: "Entry",
    emoji: "💸",
    /** Plan card border on Pricing / signup (`PLANS`). */
    cardAccent: "#b0bec5",
    /** Solid hex for Upgrade modal RGB glows + CTAs (`hexToRgbTriple`). */
    modalGlowHex: "#22c55e",
    price: 0,
    label: "Free",
    ai_guide_calls_per_day: 2,
    stack_advisor_calls_per_day: 3,
    /** One front/side/back cycle; numeric cap for messaging (not historical versioning). */
    progress_photo_sets: 1,
    profiles: 1,
    ai_guide_model: /** @type {AiGuideModelId} */ ("haiku"),
    inbody_dexa_upload: false,
    claude_vision_ocr: false,
    shift_schedule: false,
    founding_member: false,
    early_access: false,
    /** Max compounds in Saved Stack / builder rows for this tier. */
    stackLimit: 2,
    reconLimit: Number.POSITIVE_INFINITY,
    aiQueriesPerDay: 2,
  },
  pro: {
    name: "Pro",
    emoji: "🔬",
    cardAccent: "var(--color-accent)",
    modalGlowHex: "#06b6d4",
    price: 8.99,
    label: "$8.99/mo",
    ai_guide_calls_per_day: 4,
    stack_advisor_calls_per_day: 10,
    progress_photo_sets: 4,
    profiles: 1,
    ai_guide_model: /** @type {AiGuideModelId} */ ("haiku"),
    inbody_dexa_upload: true,
    claude_vision_ocr: false,
    shift_schedule: false,
    founding_member: false,
    early_access: false,
    stackLimit: 10,
    reconLimit: Number.POSITIVE_INFINITY,
    aiQueriesPerDay: 4,
  },
  elite: {
    name: "Elite",
    emoji: "⚡",
    /** Elite = amber / gold (matches `--tier-elite` in themes). */
    cardAccent: "#f59e0b",
    modalGlowHex: "#f59e0b",
    price: 16.99,
    label: "$16.99/mo",
    ai_guide_calls_per_day: 8,
    stack_advisor_calls_per_day: 20,
    progress_photo_sets: Number.POSITIVE_INFINITY,
    profiles: 2,
    ai_guide_model: /** @type {AiGuideModelId} */ ("sonnet"),
    inbody_dexa_upload: true,
    claude_vision_ocr: true,
    shift_schedule: true,
    founding_member: false,
    early_access: false,
    stackLimit: 20,
    reconLimit: Number.POSITIVE_INFINITY,
    aiQueriesPerDay: 8,
  },
  goat: {
    name: "GOAT",
    emoji: "🐐",
    /** GOAT = purple (matches `--tier-goat` in themes). */
    cardAccent: "#a855f7",
    modalGlowHex: "#a855f7",
    price: 23.99,
    label: "$23.99/mo",
    ai_guide_calls_per_day: 16,
    stack_advisor_calls_per_day: 30,
    progress_photo_sets: Number.POSITIVE_INFINITY,
    profiles: 4,
    ai_guide_model: /** @type {AiGuideModelId} */ ("sonnet"),
    inbody_dexa_upload: true,
    claude_vision_ocr: true,
    shift_schedule: true,
    founding_member: true,
    early_access: true,
    stackLimit: 40,
    reconLimit: Number.POSITIVE_INFINITY,
    aiQueriesPerDay: 16,
  },
};

export const TIER_ORDER = ["entry", "pro", "elite", "goat"];

/**
 * Theme tier token for inline `color` / `borderColor` (see `themes.css` `--tier-*`).
 * @param {string | null | undefined} plan
 */
export function tierAccentCssVar(plan) {
  const p = String(plan ?? "entry").trim().toLowerCase();
  if (p === "pro") return "var(--tier-pro)";
  if (p === "elite") return "var(--tier-elite)";
  if (p === "goat") return "var(--tier-goat)";
  return "var(--tier-entry)";
}

/**
 * Entry-tier-only lines (full library + core tools). Shown on Entry cards only — paid tiers list differentiators on top of this baseline.
 * @param {number} catalogCount — merged library size, e.g. `CATALOG_COUNT` from `catalog.js`
 * @returns {string[]}
 */
export function buildEntryTierBaseFeatureLines(catalogCount) {
  const n = typeof catalogCount === "number" && Number.isFinite(catalogCount) ? Math.max(0, Math.floor(catalogCount)) : 0;
  return [`Full ${n}-compound library`, "Stack builder + dose logging", "Vial tracker"];
}

function aiModelDisplayNameForPlanCard(id) {
  return (TIERS[id] ?? TIERS.entry).ai_guide_model === "sonnet" ? "Deep Intel AI" : "Standard AI";
}

function profileLineForPlanCard(id) {
  const n = TIERS[id]?.profiles ?? 1;
  return n === 1 ? "1 profile" : `${n} profiles`;
}

/** @returns {string | null} `null` when omitted from card (GOAT list in product copy). */
function progressPhotosLineForPlanCard(id) {
  if (id === "goat") return null;
  const p = TIERS[id]?.progress_photo_sets;
  if (typeof p === "number" && Number.isFinite(p)) {
    return p === 1 ? "Progress photos: 1 set" : `Progress photos: ${p} sets`;
  }
  return "Progress photos: unlimited";
}

/**
 * Feature bullets for pricing, upgrade modal, and signup plan cards.
 * Entry appends {@link buildEntryTierBaseFeatureLines}; Pro / Elite / GOAT list differentiators only (stacked on top of Entry in UX).
 * @param {string} id
 * @param {number} catalogCount
 * @returns {string[]}
 */
export function getTierPlanCardBullets(id, catalogCount) {
  const t = TIERS[id] ?? TIERS.entry;
  const lim = typeof t.stackLimit === "number" && Number.isFinite(t.stackLimit) ? t.stackLimit : 2;
  const track = `Track up to ${lim} compounds`;
  const ai = `AI Atlas: ${t.ai_guide_calls_per_day}/day (${aiModelDisplayNameForPlanCard(id)})`;
  const sa = `AI Atlas Pep Guide: ${t.stack_advisor_calls_per_day}/day`;
  const prof = profileLineForPlanCard(id);
  const photo = progressPhotosLineForPlanCard(id);

  if (id === "entry") {
    const out = [track, ai, sa, prof];
    if (photo) out.push(photo);
    out.push(...buildEntryTierBaseFeatureLines(catalogCount));
    return out;
  }
  if (id === "pro") {
    const out = [track, ai, sa, prof];
    if (photo) out.push(photo);
    out.push("InBody / DEXA scan upload");
    return out;
  }
  if (id === "elite") {
    const out = [track, ai, sa, prof];
    if (photo) out.push(photo);
    out.push("InBody / DEXA scan upload", "Personalized dosing schedule");
    return out;
  }
  if (id === "goat") {
    return [track, ai, sa, prof, "InBody / DEXA scan upload", "Personalized dosing schedule", "Early access to new features"];
  }
  const out = [track, ai, sa, prof];
  if (photo) out.push(photo);
  out.push(...buildEntryTierBaseFeatureLines(catalogCount));
  return out;
}

/** For upgrade / downgrade comparisons (Stripe tier vs selected tier). */
export const TIER_RANK = { entry: 0, pro: 1, elite: 2, goat: 3 };

/** Next tier above `plan`, or `null` if already at GOAT. */
export function getNextTierId(plan) {
  const p = plan ?? "entry";
  const i = TIER_ORDER.indexOf(p);
  if (i === -1 || i >= TIER_ORDER.length - 1) return null;
  return TIER_ORDER[i + 1];
}

export function getTier(plan) {
  return TIERS[plan] ?? TIERS.entry;
}

/** Sub-profiles (Netflix-style) allowed for this plan tier. */
export function getMemberProfileSlotLimit(plan) {
  const n = getTier(plan).profiles;
  return typeof n === "number" && n > 0 ? n : 1;
}

/** @param {number} n */
export function formatProgressPhotoSetsLabel(n) {
  if (typeof n !== "number" || !Number.isFinite(n)) return "—";
  if (n >= Number.MAX_SAFE_INTEGER / 2) return "Unlimited";
  return n === 1 ? "1 set" : `${n} sets`;
}

export function formatPrice(plan) {
  const tier = getTier(plan);
  return `$${tier.price.toFixed(2)}`;
}

export function formatPlan(plan) {
  // Plan "name" is the display value (e.g. entry -> "Entry", goat -> "GOAT").
  // Using TIERS directly keeps plan display consistent across the app.
  return (TIERS[plan] ?? TIERS.entry).name;
}

export function hasAccess(userPlan, requiredPlan) {
  const userIdx = TIER_ORDER.indexOf(userPlan);
  const requiredIdx = TIER_ORDER.indexOf(requiredPlan);
  const safeUserIdx = userIdx === -1 ? 0 : userIdx;
  const safeRequiredIdx = requiredIdx === -1 ? 0 : requiredIdx;
  return safeUserIdx >= safeRequiredIdx;
}

/**
 * Max Saved Stack rows for `plan` (Infinity = no cap).
 * @param {string | undefined} plan
 */
export function getSavedStackRowLimit(plan) {
  const lim = getTier(plan).stackLimit;
  return typeof lim === "number" && lim > 0 ? lim : Number.POSITIVE_INFINITY;
}

export function canAddStackRow(plan, currentRowCount) {
  const lim = getSavedStackRowLimit(plan);
  if (!Number.isFinite(lim)) return true;
  return currentRowCount < lim;
}
