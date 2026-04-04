export const TIERS = {
  entry: {
    name: "Entry",
    emoji: "💸",
    price: 0,
    label: "Free",
    stackLimit: 2,
    reconLimit: 2,
    aiQueriesPerDay: 1,
    profiles: 1,
  },
  pro: {
    name: "Pro",
    emoji: "🔬",
    price: 8.99,
    label: "$8.99/mo",
    stackLimit: 15,
    reconLimit: 10,
    aiQueriesPerDay: 4,
    profiles: 1,
  },
  elite: {
    name: "Elite",
    emoji: "⚡",
    price: 16.99,
    label: "$16.99/mo",
    stackLimit: 30,
    reconLimit: 30,
    aiQueriesPerDay: 8,
    profiles: 2,
  },
  goat: {
    name: "GOAT",
    emoji: "🐐",
    price: 22.99,
    label: "$22.99/mo",
    stackLimit: 60,
    reconLimit: 60,
    aiQueriesPerDay: 16,
    profiles: 4,
  },
};

export const TIER_ORDER = ["entry", "pro", "elite", "goat"];

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
