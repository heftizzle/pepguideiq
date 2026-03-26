/**
 * Stripe Payment Links or Checkout URLs per paid tier (set in `.env.local`).
 * When unset, upgrades fall back to `updateUserPlan` for local dev.
 */
const STRIPE_CHECKOUT = {
  pro: import.meta.env.VITE_STRIPE_CHECKOUT_PRO ?? "",
  elite: import.meta.env.VITE_STRIPE_CHECKOUT_ELITE ?? "",
  goat: import.meta.env.VITE_STRIPE_CHECKOUT_GOAT ?? "",
};

/** @param {"pro"|"elite"|"goat"} planId */
export function getStripeCheckoutUrl(planId) {
  return typeof STRIPE_CHECKOUT[planId] === "string" ? STRIPE_CHECKOUT[planId].trim() : "";
}

export function hasStripeCheckout(planId) {
  return Boolean(getStripeCheckoutUrl(planId));
}
