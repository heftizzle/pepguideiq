import { getNextTierId, TIER_ORDER } from "./tiers.js";

/** @typedef {"stack_full" | "profile_slots" | "ai_guide" | null} UpgradeGateReason */

/**
 * First paid tier that adds more than one member profile (Entry/Pro = 1 each).
 * @param {string} plan
 * @returns {"elite" | "goat" | null}
 */
function suggestedTierForMoreProfiles(plan) {
  const p = typeof plan === "string" && TIER_ORDER.includes(plan) ? plan : "entry";
  if (p === "goat") return null;
  if (p === "elite") return "goat";
  return "elite";
}

/**
 * Stripe checkout tier to highlight for this gate (never "entry").
 * @param {UpgradeGateReason} gateReason
 * @param {string} planForTier
 * @returns {string | null}
 */
export function getSuggestedUpgradeTier(gateReason, planForTier) {
  const p = typeof planForTier === "string" && TIER_ORDER.includes(planForTier) ? planForTier : "entry";
  if (gateReason === "profile_slots") {
    return suggestedTierForMoreProfiles(p);
  }
  if (gateReason === "stack_full" || gateReason === "ai_guide") {
    return getNextTierId(p);
  }
  return getNextTierId(p);
}

/**
 * Friendly copy when the user hits a hard tier limit (shown above pricing cards).
 * @param {UpgradeGateReason} gateReason
 */
export function getUpgradeGateCopy(gateReason) {
  switch (gateReason) {
    case "stack_full":
      return {
        title: "Stack full",
        body: "You've hit your compound limit on this plan. Upgrade to unlock a much bigger saved stack — room to experiment without playing favorites.",
        ctaLabel: "Upgrade & add more compounds",
      };
    case "profile_slots":
      return {
        title: "You're out of profile slots",
        body: "Extra profiles (partner, coach, protocol B) unlock on Elite and above. One account, more seats — no judgment on how many alter egos you run.",
        ctaLabel: "See Elite plans",
      };
    case "ai_guide":
      return {
        title: "AI Guide is a Pro feature",
        body: "Upgrade to unlock smarter answers and higher daily limits. Firm on science, soft on vibes — you bring the peptides, we bring the receipts.",
        ctaLabel: "Unlock AI Guide",
      };
    default:
      return {
        title: "Go further with pepguideIQ",
        body: "Pick a plan that matches how seriously you're tracking. Upgrade anytime — cancel anytime.",
        ctaLabel: "Compare plans",
      };
  }
}
