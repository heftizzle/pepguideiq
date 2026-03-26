export const TIERS = {
  entry: {
    name: "Entry",
    price: 0,
    label: "Free",
  },
  pro: {
    name: "Pro",
    price: 8.99,
    label: "$8.99/mo",
  },
  elite: {
    name: "Elite",
    price: 16.99,
    label: "$16.99/mo",
  },
  goat: {
    name: "GOAT",
    price: 21.99,
    label: "$21.99/mo",
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

export function hasAccess(userPlan, requiredPlan) {
  const userIdx = TIER_ORDER.indexOf(userPlan);
  const requiredIdx = TIER_ORDER.indexOf(requiredPlan);
  const safeUserIdx = userIdx === -1 ? 0 : userIdx;
  const safeRequiredIdx = requiredIdx === -1 ? 0 : requiredIdx;
  return safeUserIdx >= safeRequiredIdx;
}
