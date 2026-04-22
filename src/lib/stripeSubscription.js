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
 * POST /stripe/create-subscription — returns Stripe Checkout or Billing Portal `url` to redirect,
 * or `no_payment_needed` when the profile already matches the selected price.
 * @param {"pro"|"elite"|"goat"} plan
 * @returns {Promise<{ data: { url?: string, no_payment_needed?: boolean, subscription_id?: string, status?: string } | null, error: Error | null }>}
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
/**
 * POST /api/cancel-subscription — schedules cancellation at end of billing period (`cancel_at_period_end: true`).
 * @returns {Promise<{ ok: boolean, error: Error | null, success?: boolean, already_scheduled?: boolean, current_period_end?: number, plan?: string }>}
 */
export async function cancelStripeSubscriptionAtPeriodEnd() {
  if (!isApiWorkerConfigured()) {
    return { ok: false, error: new Error("Worker URL not configured") };
  }
  const token = await getSessionAccessToken();
  if (!token) {
    return { ok: false, error: new Error("Not signed in") };
  }
  const res = await fetch(`${API_WORKER_URL}/api/cancel-subscription`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = typeof body.error === "string" ? body.error : `Worker ${res.status}`;
    return { ok: false, error: new Error(msg) };
  }
  return {
    ok: true,
    error: null,
    success: body.success === true,
    already_scheduled: body.already_scheduled === true,
    current_period_end: typeof body.current_period_end === "number" ? body.current_period_end : undefined,
    plan: typeof body.plan === "string" ? body.plan : undefined,
  };
}

/**
 * POST /api/reactivate-subscription — clears scheduled cancellation (`cancel_at_period_end: false`).
 * @returns {Promise<{ ok: boolean, error: Error | null, success?: boolean, already_active?: boolean, current_period_end?: number, plan?: string }>}
 */
export async function reactivateStripeSubscription() {
  if (!isApiWorkerConfigured()) {
    return { ok: false, error: new Error("Worker URL not configured") };
  }
  const token = await getSessionAccessToken();
  if (!token) {
    return { ok: false, error: new Error("Not signed in") };
  }
  const res = await fetch(`${API_WORKER_URL}/api/reactivate-subscription`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = typeof body.error === "string" ? body.error : `Worker ${res.status}`;
    return { ok: false, error: new Error(msg) };
  }
  return {
    ok: true,
    error: null,
    success: body.success === true,
    already_active: body.already_active === true,
    current_period_end: typeof body.current_period_end === "number" ? body.current_period_end : undefined,
    plan: typeof body.plan === "string" ? body.plan : undefined,
  };
}

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
