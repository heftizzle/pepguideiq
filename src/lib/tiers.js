export const TIERS = {
  entry: {
    name: "Entry",
    price: 0,
    label: "Free",
    stackLimit: 2,
    reconLimit: 2,
    aiQueriesPerDay: 1,
    profiles: 1,
  },
  pro: {
    name: "Pro",
    price: 8.99,
    label: "$8.99/mo",
    stackLimit: 15,
    reconLimit: 10,
    aiQueriesPerDay: 4,
    profiles: 1,
  },
  elite: {
    name: "Elite",
    price: 16.99,
    label: "$16.99/mo",
    stackLimit: 30,
    reconLimit: 30,
    aiQueriesPerDay: 8,
    profiles: 2,
  },
  goat: {
    name: "GOAT",
    price: 21.99,
    label: "$21.99/mo",
    stackLimit: 60,
    reconLimit: 60,
    aiQueriesPerDay: 16,
    profiles: 4,
  },
};

export const TIER_ORDER = ["entry", "pro", "elite", "goat"];

export function getTier(plan) {
  return TIERS[plan] ?? TIERS.entry;
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
