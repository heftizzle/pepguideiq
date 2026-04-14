import { API_WORKER_URL, isApiWorkerConfigured } from "./config.js";
import { getSessionAccessToken } from "./supabase.js";

/**
 * @typedef {Object} StripeSubscriptionInfo
 * @property {number} current_period_end — Unix seconds (0 if none)
 * @property {boolean} cancel_at_period_end
 * @property {string} status
 * @property {"entry"|"pro"|"elite"|"goat"} plan — from Stripe subscription/price metadata
 * @property {string | null} pending_plan — from Supabase profiles.pending_plan
 */

/**
 * GET /stripe/subscription (Bearer = Supabase access token).
 * @returns {Promise<{ data: StripeSubscriptionInfo | null, error: Error | null }>}
 */
export async function fetchStripeSubscription() {
  if (!isApiWorkerConfigured()) {
    return { data: null, error: new Error("Worker URL not configured") };
  }
  const token = await getSessionAccessToken();
  if (!token) {
    return { data: null, error: new Error("Not signed in") };
  }
  const res = await fetch(`${API_WORKER_URL}/stripe/subscription`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = typeof body.error === "string" ? body.error : `Worker ${res.status}`;
    return { data: null, error: new Error(msg) };
  }
  return { data: body, error: null };
}

/**
 * POST /stripe/subscription/schedule-downgrade — sets profiles.pending_plan + pending_plan_date from Stripe period end.
 * @param {"entry"|"pro"|"elite"|"goat"} targetPlan
 */
export async function scheduleDowngrade(targetPlan) {
  if (!isApiWorkerConfigured()) {
    return { ok: false, error: new Error("Worker not configured") };
  }
  const token = await getSessionAccessToken();
  if (!token) {
    return { ok: false, error: new Error("Not signed in") };
  }
  const res = await fetch(`${API_WORKER_URL}/stripe/subscription/schedule-downgrade`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ target_plan: targetPlan }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = typeof body.error === "string" ? body.error : `Worker ${res.status}`;
    return { ok: false, error: new Error(msg) };
  }
  return { ok: true, error: null };
}

/**
 * POST /stripe/create-subscription — returns PaymentIntent client_secret for Elements, or no_payment_needed when already charged.
 * @param {"pro"|"elite"|"goat"} plan
 * @returns {Promise<{ data: { client_secret: string | null, subscription_id: string | null, status: string, no_payment_needed?: boolean } | null, error: Error | null }>}
 */
export async function createStripeSubscription(plan) {
  if (!isApiWorkerConfigured()) {
    return { data: null, error: new Error("Worker URL not configured") };
  }
  const token = await getSessionAccessToken();
  if (!token) {
    return { data: null, error: new Error("Not signed in") };
  }
  const res = await fetch(`${API_WORKER_URL}/stripe/create-subscription`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ plan }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = typeof body.error === "string" ? body.error : `Worker ${res.status}`;
    return { data: null, error: new Error(msg) };
  }
  return { data: body, error: null };
}

/**
 * POST /stripe/create-portal-session
 * @param {string} returnUrl — full URL after leaving the portal
 * @returns {Promise<{ url: string | null, error: Error | null }>}
 */
export async function createStripePortalSession(returnUrl) {
  if (!isApiWorkerConfigured()) {
    return { url: null, error: new Error("Worker URL not configured") };
  }
  const token = await getSessionAccessToken();
  if (!token) {
    return { url: null, error: new Error("Not signed in") };
  }
  const res = await fetch(`${API_WORKER_URL}/stripe/create-portal-session`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ return_url: returnUrl }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = typeof body.error === "string" ? body.error : `Worker ${res.status}`;
    return { url: null, error: new Error(msg) };
  }
  const url = typeof body.url === "string" ? body.url : null;
  if (!url) {
    return { url: null, error: new Error("Portal URL missing") };
  }
  return { url, error: null };
}
