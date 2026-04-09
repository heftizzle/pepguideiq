/** @typedef {"haiku" | "sonnet"} AiGuideModelId */

/**
 * Canonical plan limits (source of truth for client copy + helpers).
 * Keep `aiQueriesPerDay` in sync with `ai_guide_calls_per_day` (AI Guide / Worker daily cap).
 */
export const TIERS = {
  entry: {
    name: "Entry",
    emoji: "💸",
    price: 0,
    label: "Free",
    ai_guide_calls_per_day: 2,
    stack_advisor_calls_per_day: 5,
    /** One front/side/back cycle; numeric cap for messaging (not historical versioning). */
    progress_photo_sets: 1,
    profiles: 1,
    ai_guide_model: /** @type {AiGuideModelId} */ ("haiku"),
    inbody_dexa_upload: false,
    claude_vision_ocr: false,
    shift_schedule: false,
    founding_member: false,
    early_access: false,
    /** Saved-stack rows: unlimited for all tiers (marketing: included in every plan). */
    stackLimit: Number.POSITIVE_INFINITY,
    reconLimit: Number.POSITIVE_INFINITY,
    aiQueriesPerDay: 2,
  },
  pro: {
    name: "Pro",
    emoji: "🔬",
    price: 8.99,
    label: "$8.99/mo",
    ai_guide_calls_per_day: 4,
    stack_advisor_calls_per_day: 20,
    progress_photo_sets: 4,
    profiles: 1,
    ai_guide_model: /** @type {AiGuideModelId} */ ("haiku"),
    inbody_dexa_upload: true,
    claude_vision_ocr: false,
    shift_schedule: false,
    founding_member: false,
    early_access: false,
    stackLimit: Number.POSITIVE_INFINITY,
    reconLimit: Number.POSITIVE_INFINITY,
    aiQueriesPerDay: 4,
  },
  elite: {
    name: "Elite",
    emoji: "⚡",
    price: 16.99,
    label: "$16.99/mo",
    ai_guide_calls_per_day: 8,
    stack_advisor_calls_per_day: 30,
    progress_photo_sets: Number.POSITIVE_INFINITY,
    profiles: 2,
    ai_guide_model: /** @type {AiGuideModelId} */ ("sonnet"),
    inbody_dexa_upload: true,
    claude_vision_ocr: true,
    shift_schedule: true,
    founding_member: false,
    early_access: false,
    stackLimit: Number.POSITIVE_INFINITY,
    reconLimit: Number.POSITIVE_INFINITY,
    aiQueriesPerDay: 8,
  },
  goat: {
    name: "GOAT",
    emoji: "🐐",
    price: 22.99,
    label: "$22.99/mo",
    ai_guide_calls_per_day: 16,
    stack_advisor_calls_per_day: 40,
    progress_photo_sets: Number.POSITIVE_INFINITY,
    profiles: 4,
    ai_guide_model: /** @type {AiGuideModelId} */ ("sonnet"),
    inbody_dexa_upload: true,
    claude_vision_ocr: true,
    shift_schedule: true,
    founding_member: true,
    early_access: true,
    stackLimit: Number.POSITIVE_INFINITY,
    reconLimit: Number.POSITIVE_INFINITY,
    aiQueriesPerDay: 16,
  },
};

export const TIER_ORDER = ["entry", "pro", "elite", "goat"];

/** Shown under tier columns in the upgrade modal. */
export const ALL_TIERS_INCLUDE_LINES = [
  "Full 153-compound library",
  "Stack builder + cycle calculator",
  "Dose logging + vial tracking",
  "Complete profile",
];

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
