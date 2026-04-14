import { loadStripe } from "@stripe/stripe-js";
import { STRIPE_PUBLISHABLE_KEY } from "./config.js";

/** @type {import("@stripe/stripe-js").Stripe | Promise<import("@stripe/stripe-js").Stripe | null> | null} */
let stripePromise = null;

/** Lazy singleton for Stripe.js (Elements). */
export function getStripeBrowser() {
  if (!STRIPE_PUBLISHABLE_KEY) return null;
  if (!stripePromise) {
    stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);
  }
  return stripePromise;
}
