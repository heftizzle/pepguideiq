/**
 * Stripe Payment Links or Checkout URLs per paid tier (set in `.env.local` / hosting env).
 * Upgrades sync plan via Worker webhook → `update_user_plan` RPC (see README).
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

/**
 * Appends `client_reference_id` so the Worker Stripe webhook can map Checkout to `auth.users` (migration 008+).
 * @param {"pro"|"elite"|"goat"} planId
 * @param {string} [userId] Supabase user UUID
 */
export function getStripeCheckoutUrlWithClientRef(planId, userId) {
  const base = getStripeCheckoutUrl(planId);
  if (!base) return "";
  try {
    const u = new URL(base);
    if (userId) u.searchParams.set("client_reference_id", userId);
    return u.toString();
  } catch {
    return base;
  }
}

export function hasStripeCheckout(planId) {
  return Boolean(getStripeCheckoutUrl(planId));
}
