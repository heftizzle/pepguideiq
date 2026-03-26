import { TIERS, TIER_ORDER } from "../lib/tiers.js";

/** Single bold hook per tier (marketing line). */
const HEADLINES = {
  entry: "The full catalog — one AI query per day",
  pro: "Build protocols with room to grow",
  elite: "Claude Sonnet — serious protocol depth",
  goat: "The whole household — max capacity",
};

const PREV_LABEL = { pro: "Entry", elite: "Pro", goat: "Elite" };

function deltaVersusPrevious(id) {
  const cur = TIERS[id];
  const label = PREV_LABEL[id];
  if (id === "pro") {
    return `Everything in ${label}, plus: ${cur.aiQueriesPerDay} AI queries/day, ${cur.stackLimit} Saved Stacks, ${cur.reconLimit} reconstitution saves`;
  }
  if (id === "elite") {
    return `Everything in ${label}, plus: ${cur.aiQueriesPerDay} AI queries on Claude Sonnet, ${cur.stackLimit} Saved Stacks, ${cur.reconLimit} reconstitution saves, multi-profile (${cur.profiles} profiles)`;
  }
  return `Everything in ${label}, plus: ${cur.aiQueriesPerDay} Sonnet queries/day, ${cur.stackLimit} Saved Stacks, ${cur.profiles} family profiles`;
}

function entrySubline() {
  const e = TIERS.entry;
  return `Full catalog · ${e.aiQueriesPerDay} AI query/day · ${e.stackLimit} Saved Stacks · ${e.reconLimit} reconstitution saves`;
}

/**
 * @typedef {{ id: string; name: string; emoji: string; priceLabel: string; headline: string; subline: string; color: string }} UpgradeTierRow
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
    };
  });
}
