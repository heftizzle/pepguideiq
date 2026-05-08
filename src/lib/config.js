/** @type {string} */
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? "";

/** @type {string} */
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY ?? "";

/** Local-only e2e helper: short-circuits auth/data flows without a real Supabase project. */
export const E2E_MOCK_SUPABASE = String(import.meta.env.VITE_E2E_MOCK_SUPABASE ?? "").trim() === "1";

/** Base URL for API worker (no trailing slash). */
export const API_WORKER_URL = String(import.meta.env.VITE_API_WORKER_URL ?? "").replace(/\/$/, "");

/** Stripe publishable key (pk_…) for Elements — safe in the client; never put secret keys here. */
export const STRIPE_PUBLISHABLE_KEY = String(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ?? "").trim();

export function isSupabaseConfigured() {
  return E2E_MOCK_SUPABASE || Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

export function isApiWorkerConfigured() {
  return Boolean(API_WORKER_URL);
}

export function isStripePublishableConfigured() {
  return Boolean(STRIPE_PUBLISHABLE_KEY);
}

export function isE2EMockSupabaseEnabled() {
  return E2E_MOCK_SUPABASE;
}
