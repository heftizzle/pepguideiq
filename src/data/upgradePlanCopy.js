import {
  buildAllTiersIncludeLines,
  formatProgressPhotoSetsLabel,
  TIERS,
  TIER_ORDER,
} from "../lib/tiers.js";
import { CATALOG_COUNT } from "./catalog.js";

/** Single bold hook per tier (marketing line). */
const HEADLINES = {
  entry: "Start free — explore the full compound library",
  pro: "Serious about your protocol",
  elite: "Full protocol intelligence",
  goat: "The complete arsenal",
};

const SUBLINES = {
  entry: "Track 2 compounds, ask the AI Guide twice a day, and build your first stack.",
  pro: "Track up to 10 compounds, more AI queries, and upload your body scan results.",
  elite:
    "Everything in Pro, plus Deep Intel AI, up to 25 compounds, unlimited progress photos, 2 profiles, and Vision OCR.",
  goat:
    "Everything in Elite, plus up to 50 compounds, max AI capacity, 4 profiles, and early access to every new feature.",
};

function modelLabel(id) {
  const t = TIERS[id];
  return t.ai_guide_model === "sonnet" ? "Deep Intel AI" : "Standard AI";
}

/** First bullet: compounds tracked (copy matches tier caps). */
function compoundsTrackedLine(id) {
  const t = TIERS[id];
  const n = t.stackLimit;
  if (id === "entry") return `Track ${n} compounds`;
  return `Track up to ${n} compounds`;
}

/** Tier-specific limit lines (upgrade modal). */
function tierLimitBullets(id) {
  const t = TIERS[id];
  const lines = [
    compoundsTrackedLine(id),
    `AI Guide: ${t.ai_guide_calls_per_day} a day (${modelLabel(id)})`,
    `Stack Advisor: ${t.stack_advisor_calls_per_day} a day`,
  ];
  if (Number.isFinite(t.progress_photo_sets)) {
    lines.push(`Progress photos: ${formatProgressPhotoSetsLabel(t.progress_photo_sets)}`);
  }
  lines.push(`${t.profiles} profile${t.profiles === 1 ? "" : "s"}`);
  if (t.inbody_dexa_upload) lines.push("InBody / DEXA scan upload");
  if (t.shift_schedule) lines.push("Personalized dosing schedule");
  if (t.early_access) lines.push("Early access to new features");
  return lines;
}

/**
 * @typedef {{ id: string; name: string; emoji: string; priceLabel: string; headline: string; subline: string; color: string; limitBullets: string[]; allTiersInclude: string[] }} UpgradeTierRow
 * @returns {UpgradeTierRow[]}
 */
export function getUpgradeTierRows() {
  const colors = {
    entry: "#b0bec5",
    pro: "var(--color-accent)",
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
      subline: SUBLINES[id],
      color: colors[id],
      limitBullets: tierLimitBullets(id),
      allTiersInclude: buildAllTiersIncludeLines(CATALOG_COUNT),
    };
  });
}
