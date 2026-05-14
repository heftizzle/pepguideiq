import { getTierPlanCardBullets, TIERS, TIER_ORDER } from "../lib/tiers.js";
import { CATALOG_COUNT } from "./catalog.js";

/** Single bold hook per tier (marketing line). */
const HEADLINES = {
  entry: "Start free — explore the full compound library",
  pro: "Serious about your protocol",
  elite: "Full protocol intelligence",
  goat: "The complete arsenal",
};

const SUBLINES = {
  entry: "Track up to 2 compounds, AI Atfeh + Pep Guide, one profile — full library and core tools on us.",
  pro: "Ten compounds, higher AI limits, body scans, and four progress photo sets.",
  elite: "Deep Intel AI, 20 compounds, two profiles, unlimited progress photos, and a personalized dosing schedule.",
  goat: "Max compounds and AI, four profiles, early access to new features — the full stack.",
};

/**
 * @typedef {{ id: string; name: string; emoji: string; priceLabel: string; headline: string; subline: string; color: string; limitBullets: string[] }} UpgradeTierRow
 * @returns {UpgradeTierRow[]}
 */
export function getUpgradeTierRows() {
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
      color: t.cardAccent,
      limitBullets: getTierPlanCardBullets(id, CATALOG_COUNT),
    };
  });
}
