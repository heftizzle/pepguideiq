import {
  ALL_TIERS_INCLUDE_LINES,
  formatProgressPhotoSetsLabel,
  TIERS,
  TIER_ORDER,
} from "../lib/tiers.js";

/** Single bold hook per tier (marketing line). */
const HEADLINES = {
  entry: "Start free — AI Guide + Stack Advisor included",
  pro: "InBody / DEXA uploads + more AI capacity",
  elite: "Claude Sonnet — vision OCR + shift-aware scheduling",
  goat: "Founding member perks + max capacity",
};

const PREV_LABEL = { pro: "Entry", elite: "Pro", goat: "Elite" };

function modelLabel(id) {
  const t = TIERS[id];
  return t.ai_guide_model === "sonnet" ? "Claude Sonnet" : "Claude Haiku";
}

/** Tier-specific limit lines (upgrade modal). */
function tierLimitBullets(id) {
  const t = TIERS[id];
  const lines = [
    `AI Guide: ${t.ai_guide_calls_per_day}/day (${modelLabel(id)})`,
    `Stack Advisor: ${t.stack_advisor_calls_per_day}/day`,
    `Progress photos: ${formatProgressPhotoSetsLabel(t.progress_photo_sets)}`,
    `${t.profiles} profile${t.profiles === 1 ? "" : "s"}`,
  ];
  if (t.inbody_dexa_upload) lines.push("InBody / DEXA scan upload");
  if (t.claude_vision_ocr) lines.push("Claude Vision OCR (scans)");
  if (t.shift_schedule) lines.push("Shift schedule + wake time");
  if (t.founding_member) lines.push("Founding member");
  if (t.early_access) lines.push("Early access to new features");
  return lines;
}

function deltaVersusPrevious(id) {
  const cur = TIERS[id];
  const label = PREV_LABEL[id];
  if (id === "pro") {
    return `Everything in ${label}, plus higher daily caps, ${formatProgressPhotoSetsLabel(cur.progress_photo_sets)} progress photos, and InBody / DEXA upload.`;
  }
  if (id === "elite") {
    return `Everything in ${label}, plus ${modelLabel(id)} for AI Guide, unlimited progress photo sets, 2 profiles, Vision OCR, and shift scheduling.`;
  }
  return `Everything in ${label}, plus more daily calls, 4 profiles, founding member status, and early access.`;
}

function entrySubline() {
  const e = TIERS.entry;
  return `AI Guide ${e.ai_guide_calls_per_day}/day (${modelLabel("entry")}) · Stack Advisor ${e.stack_advisor_calls_per_day}/day · ${formatProgressPhotoSetsLabel(e.progress_photo_sets)} progress photos`;
}

/**
 * @typedef {{ id: string; name: string; emoji: string; priceLabel: string; headline: string; subline: string; color: string; limitBullets: string[]; allTiersInclude: string[] }} UpgradeTierRow
 * @returns {UpgradeTierRow[]}
 */
export function getUpgradeTierRows() {
  const colors = {
    entry: "#4a6080",
    pro: "#00d4aa",
    elite: "#f59e0b",
    goat: "#a855f7",
  };
  return TIER_ORDER.map((id) => {
    const t = TIERS[id];
    const priceLabel = t.price === 0 ? "Free" : t.label;
    return {
      id,
      name: t.name,
      emoji: t.emoji,
      priceLabel,
      headline: HEADLINES[id],
      subline: id === "entry" ? entrySubline() : deltaVersusPrevious(id),
      color: colors[id],
      limitBullets: tierLimitBullets(id),
      allTiersInclude: ALL_TIERS_INCLUDE_LINES,
    };
  });
}
