/**
 * Cloudflare Worker: Anthropic proxy, Stripe billing helpers, R2 stack photos.
 *
 * Secrets: wrangler secret put ANTHROPIC_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 * Optional: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
 * Vars: ALLOWED_ORIGIN (exact origin, e.g. https://pepguideiq.com; omit or * for dev),
 *       ENVIRONMENT=production (strict: require Supabase + KV for /v1/chat, fail closed on rate limit)
 */

const VALID_PLAN_TIERS = new Set(["entry", "pro", "elite", "goat"]);
const TIER_RANK = { entry: 0, pro: 1, elite: 2, goat: 3 };

/** Max Netflix-style member_profiles per account (Free/Pro: 1, Elite: 2, GOAT: 4). */
function memberProfileSlotLimit(plan) {
  const p = normalizePlanTier(plan);
  if (p === "goat") return 4;
  if (p === "elite") return 2;
  return 1;
}

const DAILY_QUERY_LIMIT = {
  entry: 1,
  pro: 4,
  elite: 8,
  goat: 16,
};

const MODEL_ENTRY_PRO = "claude-haiku-4-5-20251001";
const MODEL_ELITE_GOAT = "claude-sonnet-4-6";

const STACK_PHOTO_MAX_BYTES = 5 * 1024 * 1024;
const STACK_PHOTO_TYPES = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";

const CORS_BASE = {
  "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
};

/** @param {Record<string, string | undefined>} env */
function isProduction(env) {
  return String(env.ENVIRONMENT ?? "").toLowerCase() === "production";
}

/**
 * @param {Record<string, string | undefined>} env
 * @param {Request} request
 * @returns {Record<string, string> | null} null = reject request (wrong Origin)
 */
function corsHeaders(env, request) {
  const allowed = (env.ALLOWED_ORIGIN ?? "*").trim();
  const origin = request.headers.get("Origin");
  if (allowed === "*") {
    return { ...CORS_BASE, "Access-Control-Allow-Origin": "*" };
  }
  if (origin && origin === allowed) {
    return { ...CORS_BASE, "Access-Control-Allow-Origin": origin, Vary: "Origin" };
  }
  if (!origin) {
    return { ...CORS_BASE, "Access-Control-Allow-Origin": allowed, Vary: "Origin" };
  }
  return null;
}

/** @param {Record<string, string | undefined>} env */
function log(env, level, msg, extra = {}) {
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    level,
    msg,
    service: "pepguideiq-api-proxy",
    ...extra,
  });
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

/**
 * Stripe webhook signature verification (raw body + Stripe-Signature header).
 * @see https://stripe.com/docs/webhooks/signatures
 */
async function verifyStripeWebhookSignature(rawBody, sigHeader, secret) {
  if (!sigHeader || !secret) return false;
  const items = sigHeader.split(",").map((s) => s.trim());
  let t = "";
  const v1list = [];
  for (const item of items) {
    const i = item.indexOf("=");
    if (i === -1) continue;
    const k = item.slice(0, i);
    const v = item.slice(i + 1);
    if (k === "t") t = v;
    if (k === "v1") v1list.push(v);
  }
  if (!t || v1list.length === 0) return false;
  const tsMs = Number(t) * 1000;
  if (Number.isFinite(tsMs)) {
    const maxSkew = 5 * 60 * 1000;
    if (Math.abs(Date.now() - tsMs) > maxSkew) return false;
  }
  const signedPayload = `${t}.${rawBody}`;
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const mac = new Uint8Array(
    await crypto.subtle.sign("HMAC", key, enc.encode(signedPayload))
  );
  const expectedHex = [...mac].map((b) => b.toString(16).padStart(2, "0")).join("");
  for (const v1 of v1list) {
    if (v1.length !== expectedHex.length) continue;
    let diff = 0;
    for (let j = 0; j < v1.length; j++) {
      diff |= v1.charCodeAt(j) ^ expectedHex.charCodeAt(j);
    }
    if (diff === 0) return true;
  }
  return false;
}

async function fetchStripeSubscriptionExpanded(stripeKey, subscriptionId) {
  const qs = new URLSearchParams();
  qs.append("expand[]", "items.data.price");
  const r = await fetch(
    `https://api.stripe.com/v1/subscriptions/${encodeURIComponent(subscriptionId)}?${qs}`,
    { headers: { Authorization: `Bearer ${stripeKey}` } }
  );
  if (!r.ok) return null;
  return r.json();
}

function jsonResponse(body, status = 200, cors) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

function normalizeMessages(messages) {
  if (!Array.isArray(messages)) return [];
  return messages.map((m) => ({
    role: m.role === "assistant" ? "assistant" : "user",
    content:
      typeof m.content === "string"
        ? m.content
        : Array.isArray(m.content)
          ? m.content
          : String(m.content ?? ""),
  }));
}

function modelForPlan(plan) {
  const p = typeof plan === "string" ? plan.trim().toLowerCase() : "";
  if (p === "elite" || p === "goat") return MODEL_ELITE_GOAT;
  return MODEL_ENTRY_PRO;
}

/**
 * @param {import("@cloudflare/workers-types").KVNamespace | undefined} kv
 * @param {string | null} userId
 * @param {string} plan
 */
async function checkRateLimit(env, kv, userId, plan) {
  const production = isProduction(env);
  if (!kv) {
    const msg = "RATE_LIMIT_KV not bound — rate limiting disabled";
    if (production) {
      log(env, "error", "rate_limit_kv_required", {});
      return { allowed: false, count: 0, limit: 0, error: "Rate limiting unavailable" };
    }
    console.warn(msg);
    return { allowed: true, count: 0, limit: 99 };
  }

  if (!userId) {
    return { allowed: false, count: 0, limit: 0, error: "Missing user" };
  }

  const limit = DAILY_QUERY_LIMIT[plan] ?? DAILY_QUERY_LIMIT.entry;
  const today = new Date().toISOString().slice(0, 10);
  const key = `rl:${userId}:${today}`;

  const raw = await kv.get(key);
  let current = { count: 0 };
  if (raw) {
    try { current = JSON.parse(raw); } catch { /* corrupted KV entry — reset */ }
  }

  if (current.count >= limit) {
    return { allowed: false, count: current.count, limit };
  }

  const next = { count: current.count + 1 };
  await kv.put(key, JSON.stringify(next), { expirationTtl: 90000 });
  return { allowed: true, count: next.count, limit };
}

function logUsage(env, userId, plan, model, tokenCount) {
  const supabaseUrl = (env.SUPABASE_URL ?? "").replace(/\/$/, "");
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  if (!supabaseUrl || !serviceKey || !userId) return;

  fetch(`${supabaseUrl}/rest/v1/query_log`, {
    method: "POST",
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({
      user_id: userId,
      plan,
      model,
      token_count: tokenCount ?? 0,
      queried_at: new Date().toISOString(),
    }),
  }).catch(() => {});
}

async function getSessionUser(env, authorization) {
  const supabaseUrl = (env.SUPABASE_URL ?? "").replace(/\/$/, "");
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  const raw = authorization?.replace(/^Bearer\s+/i, "")?.trim();
  if (!supabaseUrl || !serviceKey) {
    return { data: null, error: new Error("Supabase not configured on the Worker") };
  }
  if (!raw) {
    return { data: null, error: new Error("Missing Authorization Bearer token") };
  }
  const res = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      Authorization: `Bearer ${raw}`,
      apikey: serviceKey,
    },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { data: null, error: new Error("Unauthorized") };
  }
  const user =
    body && typeof body === "object" && typeof body.id === "string"
      ? body
      : body && typeof body === "object" && body.user && typeof body.user.id === "string"
        ? body.user
        : null;
  if (!user) {
    return { data: null, error: new Error("Unauthorized") };
  }
  const sub = typeof user.id === "string" ? user.id : null;
  return { data: { sub }, error: null };
}

function supabaseAuthReady(env) {
  return Boolean((env.SUPABASE_URL ?? "").trim() && (env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim());
}

function normalizePlanTier(p) {
  const x = typeof p === "string" ? p.trim().toLowerCase() : "";
  return VALID_PLAN_TIERS.has(x) ? x : "entry";
}

async function fetchProfilePlan(supabaseUrl, serviceKey, userId) {
  const res = await fetch(
    `${supabaseUrl}/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}&select=plan`,
    {
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
      },
    }
  );
  const rows = await res.json().catch(() => []);
  const row = Array.isArray(rows) ? rows[0] : null;
  return normalizePlanTier(row?.plan);
}

function buildSystem(body) {
  const extra = typeof body?.system === "string" ? body.system.trim() : "";
  const base =
    "You are an expert peptide research advisor with deep knowledge of peptide pharmacology, biohacking protocols, dosing strategies, and interactions. Be direct, technical, and practical. Always include safety notes — these are research chemicals requiring physician oversight.";
  return extra ? `${base}\n\n${extra}` : base;
}

function tierPlanFromStripeSubscription(subscr) {
  if (!subscr || typeof subscr !== "object") return "entry";
  const st = typeof subscr.status === "string" ? subscr.status : "";
  if (st === "canceled" || st === "unpaid" || st === "incomplete_expired") return "entry";
  const m =
    (typeof subscr.metadata?.plan === "string" && subscr.metadata.plan.trim().toLowerCase()) ||
    (typeof subscr.items?.data?.[0]?.price?.metadata?.plan === "string" &&
      subscr.items.data[0].price.metadata.plan.trim().toLowerCase()) ||
    "";
  return VALID_PLAN_TIERS.has(m) ? m : "entry";
}

async function supabasePatchProfile(supabaseUrl, serviceKey, userId, patch) {
  const res = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}`, {
    method: "PATCH",
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(patch),
  });
  return res.ok;
}

async function supabasePatchUserVial(supabaseUrl, serviceKey, userId, vialId, patch, profileId) {
  let qs = `${supabaseUrl}/rest/v1/user_vials?id=eq.${encodeURIComponent(vialId)}&user_id=eq.${encodeURIComponent(userId)}`;
  if (profileId) qs += `&profile_id=eq.${encodeURIComponent(profileId)}`;
  const res = await fetch(
    qs,
    {
      method: "PATCH",
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify(patch),
    }
  );
  return res.ok;
}

/**
 * PATCH member_profiles row; requires exactly one row updated (avoids silent 0-row "success").
 * @returns {Promise<{ ok: true } | { ok: false, status: number, parsed: unknown, bodyText: string }>}
 */
async function supabasePatchMemberProfile(supabaseUrl, serviceKey, userId, memberProfileId, patch) {
  const res = await fetch(
    `${supabaseUrl}/rest/v1/member_profiles?id=eq.${encodeURIComponent(memberProfileId)}&user_id=eq.${encodeURIComponent(userId)}&select=id`,
    {
      method: "PATCH",
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify(patch),
    }
  );
  const bodyText = await res.text().catch(() => "");
  let parsed = null;
  try {
    parsed = bodyText ? JSON.parse(bodyText) : null;
  } catch {
    parsed = null;
  }
  if (!res.ok) {
    return { ok: false, status: res.status, parsed, bodyText };
  }
  if (!Array.isArray(parsed) || parsed.length !== 1) {
    return { ok: false, status: res.status, parsed, bodyText };
  }
  return { ok: true };
}

/**
 * @param {{ ok: false, status: number, parsed: unknown, bodyText: string }} result
 * @param {Record<string, unknown>} patch
 */
function memberProfilePatchFailureMessage(result, patch) {
  const p = result.parsed;
  if (p && typeof p === "object" && !Array.isArray(p)) {
    const code = "code" in p ? String(p.code) : "";
    const message = "message" in p && typeof p.message === "string" ? p.message : "";
    const details = "details" in p && typeof p.details === "string" ? p.details : "";
    const combined = `${message} ${details}`;
    if (
      code === "23505" ||
      /duplicate key|unique constraint/i.test(message) ||
      /already exists/i.test(details)
    ) {
      if (Object.prototype.hasOwnProperty.call(patch, "handle")) {
        return { msg: "This handle is already taken", status: 409 };
      }
      return { msg: "This update conflicts with existing data", status: 409 };
    }
    if (code === "23514" || /violates check constraint/i.test(message)) {
      if (Object.prototype.hasOwnProperty.call(patch, "handle")) {
        return {
          msg: "Handle must be 3–20 characters: lowercase letters, numbers, and underscores only",
          status: 400,
        };
      }
    }
  }
  if (Array.isArray(result.parsed) && result.parsed.length === 0) {
    return { msg: "Member profile not found", status: 404 };
  }
  return { msg: "Could not update profile", status: 502 };
}

/**
 * Authenticated POST — delete the signed-in user via Supabase Auth Admin API (service role).
 */
async function handleDeleteAccount(request, env, cors) {
  if (!supabaseAuthReady(env)) {
    return jsonResponse({ error: "Supabase not configured" }, 503, cors);
  }
  const { data: sessionUser, error: authErr } = await getSessionUser(env, request.headers.get("Authorization"));
  if (authErr || !sessionUser?.sub) {
    return jsonResponse({ error: "Unauthorized" }, 401, cors);
  }
  const userId = sessionUser.sub;
  const supabaseUrl = (env.SUPABASE_URL ?? "").replace(/\/$/, "");
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  const delUrl = `${supabaseUrl}/auth/v1/admin/users/${encodeURIComponent(userId)}`;
  const res = await fetch(delUrl, {
    method: "DELETE",
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
    },
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    log(env, "error", "admin_delete_user_failed", { status: res.status, body: String(t).slice(0, 240) });
    return jsonResponse({ error: "Could not delete account" }, 502, cors);
  }
  return jsonResponse({ ok: true }, 200, cors);
}

/**
 * Authenticated POST — create a member profile + empty user_stacks row; tier slot limit enforced.
 * Body: { "display_name": "string" }
 */
async function handleCreateMemberProfile(request, env, cors) {
  if (!supabaseAuthReady(env)) {
    return jsonResponse({ error: "Supabase not configured" }, 503, cors);
  }
  const { data: sessionUser, error: authErr } = await getSessionUser(env, request.headers.get("Authorization"));
  if (authErr || !sessionUser?.sub) {
    return jsonResponse({ error: "Unauthorized" }, 401, cors);
  }
  const userId = sessionUser.sub;
  let body = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  const displayName =
    typeof body.display_name === "string" ? body.display_name.trim().slice(0, 120) : "";
  if (!displayName) {
    return jsonResponse({ error: "display_name is required" }, 400, cors);
  }

  const supabaseUrl = (env.SUPABASE_URL ?? "").replace(/\/$/, "");
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY ?? "";

  const plan = await fetchProfilePlan(supabaseUrl, serviceKey, userId);
  const limit = memberProfileSlotLimit(plan);

  const countRes = await fetch(
    `${supabaseUrl}/rest/v1/member_profiles?user_id=eq.${encodeURIComponent(userId)}&select=id`,
    {
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
      },
    }
  );
  const countRows = await countRes.json().catch(() => []);
  const total = Array.isArray(countRows) ? countRows.length : 0;
  if (!countRes.ok) {
    log(env, "warn", "member_profile_list_failed", { userId, status: countRes.status });
    return jsonResponse({ error: "Could not verify profile limit" }, 502, cors);
  }
  if (total >= limit) {
    return jsonResponse({ error: "Upgrade your plan to add more profiles" }, 403, cors);
  }

  const insMp = await fetch(`${supabaseUrl}/rest/v1/member_profiles`, {
    method: "POST",
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify({
      user_id: userId,
      display_name: displayName,
      is_default: false,
      language: "en",
      shift_schedule: "days",
    }),
  });
  const mpRows = await insMp.json().catch(() => []);
  const mp = Array.isArray(mpRows) ? mpRows[0] : null;
  const profileId = mp && mp.id != null ? String(mp.id) : null;
  if (!insMp.ok || !profileId) {
    const t = await (async () => {
      try {
        return JSON.stringify(mpRows);
      } catch {
        return "";
      }
    })();
    log(env, "error", "member_profile_insert_failed", { status: insMp.status, body: String(t).slice(0, 400) });
    return jsonResponse({ error: "Could not create profile" }, 502, cors);
  }

  const insStack = await fetch(`${supabaseUrl}/rest/v1/user_stacks`, {
    method: "POST",
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({
      user_id: userId,
      profile_id: profileId,
    }),
  });
  if (!insStack.ok) {
    const errText = await insStack.text().catch(() => "");
    let errDetail = errText.slice(0, 500);
    try {
      const j = JSON.parse(errText);
      if (j && typeof j.message === "string") errDetail = j.message;
      if (j && typeof j.details === "string" && j.details) errDetail = `${errDetail} — ${j.details}`.slice(0, 500);
    } catch {
      /* keep errDetail */
    }
    log(env, "error", "member_profile_stack_insert_failed", {
      userId,
      profileId,
      status: insStack.status,
      body: errDetail,
    });
    await fetch(
      `${supabaseUrl}/rest/v1/member_profiles?id=eq.${encodeURIComponent(profileId)}`,
      {
        method: "DELETE",
        headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
      }
    ).catch(() => {});
    let hint = "";
    if (insStack.status === 409 || /unique|duplicate/i.test(errDetail)) {
      if (/user_stacks_pkey/i.test(errDetail) && /\(user_id\)/i.test(errDetail)) {
        hint =
          " Run supabase/migrations/015_user_stacks_pkey_on_id.sql — PRIMARY KEY is on user_id; it must be on id, with UNIQUE (user_id, profile_id).";
      } else {
        hint =
          " Ensure 014_user_stacks_profile_unique_fix.sql ran (drop legacy UNIQUE user_id only). If needed, also run 015_user_stacks_pkey_on_id.sql.";
      }
    }
    return jsonResponse(
      {
        error: "Could not create stack for profile" + (hint ? ` —${hint}` : ""),
      },
      502,
      cors
    );
  }

  return jsonResponse({ profile: mp }, 200, cors);
}

/**
 * Updates plan in profiles + auth user metadata via trusted RPC (see migration 008).
 * Optionally sets Stripe customer id (service role only).
 */
async function supabaseSyncUserPlanAndCustomer(env, supabaseUrl, serviceKey, userId, plan, stripeCustomerId) {
  const rpc = await fetch(`${supabaseUrl}/rest/v1/rpc/update_user_plan`, {
    method: "POST",
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({ p_user_id: userId, p_plan: plan }),
  });
  if (!rpc.ok) {
    const t = await rpc.text().catch(() => "");
    log(env, "error", "update_user_plan_rpc_failed", { status: rpc.status, body: t.slice(0, 500) });
    return false;
  }
  if (stripeCustomerId) {
    return supabasePatchProfile(supabaseUrl, serviceKey, userId, {
      stripe_customer_id: stripeCustomerId,
    });
  }
  return true;
}

async function handleStripeSubscription(request, env, cors) {
  if (!supabaseAuthReady(env)) {
    return jsonResponse({ error: "SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set on the Worker" }, 503, cors);
  }

  const { data: user, error } = await getSessionUser(env, request.headers.get("Authorization"));
  if (error || !user?.sub) {
    return jsonResponse({ error: "Unauthorized" }, 401, cors);
  }
  const userId = user.sub;

  const supabaseUrl = (env.SUPABASE_URL ?? "").replace(/\/$/, "");
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY ?? "";

  const pr = await fetch(
    `${supabaseUrl}/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}&select=stripe_customer_id,pending_plan,pending_plan_date`,
    {
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
      },
    }
  );
  const profileRows = await pr.json().catch(() => []);
  const profile = Array.isArray(profileRows) ? profileRows[0] : null;
  const customerId =
    profile && typeof profile.stripe_customer_id === "string" ? profile.stripe_customer_id.trim() : "";

  const emptyResponse = () =>
    jsonResponse({
      current_period_end: 0,
      cancel_at_period_end: false,
      status: "none",
      plan: "entry",
      pending_plan: profile?.pending_plan != null ? String(profile.pending_plan) : null,
    }, 200, cors);

  if (!customerId) {
    return emptyResponse();
  }

  const stripeKey = env.STRIPE_SECRET_KEY ?? "";
  if (!stripeKey) {
    return jsonResponse({ error: "STRIPE_SECRET_KEY is not set on the Worker" }, 503, cors);
  }

  const qs = new URLSearchParams({
    customer: customerId,
    limit: "1",
    status: "all",
  });
  qs.append("expand[]", "data.default_payment_method");
  const sr = await fetch(`https://api.stripe.com/v1/subscriptions?${qs}`, {
    headers: { Authorization: `Bearer ${stripeKey}` },
  });
  const sdata = await sr.json().catch(() => ({}));
  if (!sr.ok) {
    return jsonResponse(
      { error: sdata.error?.message || sdata.error || `Stripe error (${sr.status})` },
      sr.status >= 400 && sr.status < 600 ? sr.status : 502,
      cors
    );
  }

  const list = Array.isArray(sdata.data) ? sdata.data : [];
  const subscr = list[0];
  if (!subscr) {
    return emptyResponse();
  }

  const cpe = subscr.current_period_end;
  const cpeNum = typeof cpe === "number" ? cpe : 0;

  return jsonResponse({
    current_period_end: cpeNum,
    cancel_at_period_end: Boolean(subscr.cancel_at_period_end),
    status: typeof subscr.status === "string" ? subscr.status : "unknown",
    plan: tierPlanFromStripeSubscription(subscr),
    pending_plan: profile?.pending_plan != null ? String(profile.pending_plan) : null,
  }, 200, cors);
}

async function handleScheduleDowngrade(request, env, cors) {
  if (!supabaseAuthReady(env)) {
    return jsonResponse({ error: "SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set on the Worker" }, 503, cors);
  }

  const { data: user, error } = await getSessionUser(env, request.headers.get("Authorization"));
  if (error || !user?.sub) {
    return jsonResponse({ error: "Unauthorized" }, 401, cors);
  }
  const userId = user.sub;

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400, cors);
  }
  const target = typeof body?.target_plan === "string" ? body.target_plan.trim().toLowerCase() : "";
  if (!VALID_PLAN_TIERS.has(target)) {
    return jsonResponse({ error: "Invalid target_plan" }, 400, cors);
  }

  const supabaseUrl = (env.SUPABASE_URL ?? "").replace(/\/$/, "");
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  if (!supabaseUrl || !serviceKey) {
    return jsonResponse({ error: "SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set on the Worker" }, 503, cors);
  }

  const pr = await fetch(
    `${supabaseUrl}/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}&select=stripe_customer_id`,
    {
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
      },
    }
  );
  const profileRows = await pr.json().catch(() => []);
  const profile = Array.isArray(profileRows) ? profileRows[0] : null;
  const customerId =
    profile && typeof profile.stripe_customer_id === "string" ? profile.stripe_customer_id.trim() : "";
  if (!customerId) {
    return jsonResponse({ error: "No Stripe customer on file" }, 400, cors);
  }

  const stripeKey = env.STRIPE_SECRET_KEY ?? "";
  if (!stripeKey) {
    return jsonResponse({ error: "STRIPE_SECRET_KEY is not set on the Worker" }, 503, cors);
  }

  const qs = new URLSearchParams({ customer: customerId, limit: "1", status: "all" });
  qs.append("expand[]", "data.default_payment_method");
  const sr = await fetch(`https://api.stripe.com/v1/subscriptions?${qs}`, {
    headers: { Authorization: `Bearer ${stripeKey}` },
  });
  const sdata = await sr.json().catch(() => ({}));
  if (!sr.ok) {
    return jsonResponse(
      { error: sdata.error?.message || sdata.error || `Stripe error (${sr.status})` },
      502,
      cors
    );
  }
  const list = Array.isArray(sdata.data) ? sdata.data : [];
  const subscr = list[0];
  if (!subscr || typeof subscr.current_period_end !== "number") {
    return jsonResponse({ error: "No active subscription to schedule against" }, 400, cors);
  }

  const currentTier = tierPlanFromStripeSubscription(subscr);
  const activeLike = ["active", "trialing", "past_due"].includes(subscr.status);
  if (!activeLike) {
    return jsonResponse({ error: "Subscription is not in a state that allows scheduling" }, 400, cors);
  }
  if (TIER_RANK[target] >= TIER_RANK[currentTier]) {
    return jsonResponse({ error: "target_plan must be lower than current plan" }, 400, cors);
  }

  const ok = await supabasePatchProfile(supabaseUrl, serviceKey, userId, {
    pending_plan: target,
    pending_plan_date: new Date(subscr.current_period_end * 1000).toISOString(),
  });
  if (!ok) {
    return jsonResponse({ error: "Failed to update profile" }, 502, cors);
  }

  return jsonResponse({ ok: true }, 200, cors);
}

async function handleUploadStackPhoto(request, env, cors) {
  if (!supabaseAuthReady(env)) {
    return jsonResponse({ error: "SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set on the Worker" }, 503, cors);
  }

  const bucket = env.STACK_PHOTOS;
  if (!bucket) {
    return jsonResponse({ error: "R2 bucket STACK_PHOTOS is not bound on the Worker" }, 503, cors);
  }

  const { data: sessionUser, error: authErr } = await getSessionUser(env, request.headers.get("Authorization"));
  if (authErr || !sessionUser?.sub) {
    return jsonResponse({ error: "Unauthorized" }, 401, cors);
  }
  const userId = sessionUser.sub;

  const supabaseUrl = (env.SUPABASE_URL ?? "").replace(/\/$/, "");
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  const profilePlan = await fetchProfilePlan(supabaseUrl, serviceKey, userId);
  if (TIER_RANK[profilePlan] < TIER_RANK.pro) {
    return jsonResponse({ error: "Pro plan or higher required to upload stack photos" }, 403, cors);
  }

  let formData;
  try {
    formData = await request.formData();
  } catch {
    return jsonResponse({ error: "Invalid multipart body" }, 400, cors);
  }

  const file = formData.get("file");
  if (!file || typeof file === "string" || typeof file.arrayBuffer !== "function") {
    return jsonResponse({ error: 'Expected multipart field "file"' }, 400, cors);
  }

  const size = typeof file.size === "number" ? file.size : 0;
  if (size <= 0 || size > STACK_PHOTO_MAX_BYTES) {
    return jsonResponse({ error: "File must be between 1 byte and 5MB" }, 400, cors);
  }

  const mime = typeof file.type === "string" ? file.type.trim().toLowerCase() : "";
  const ext = STACK_PHOTO_TYPES.get(mime);
  if (!ext) {
    return jsonResponse({ error: "Allowed types: image/jpeg, image/png, image/webp" }, 400, cors);
  }

  const key = `${userId}/stack.${ext}`;
  let bytes;
  try {
    bytes = await file.arrayBuffer();
  } catch {
    return jsonResponse({ error: "Could not read file" }, 400, cors);
  }
  if (bytes.byteLength > STACK_PHOTO_MAX_BYTES) {
    return jsonResponse({ error: "File must be between 1 byte and 5MB" }, 400, cors);
  }

  try {
    await bucket.put(key, bytes, {
      httpMetadata: { contentType: mime },
    });
  } catch (e) {
    log(env, "error", "r2_put_failed", { message: String(e) });
    return jsonResponse({ error: "Storage upload failed" }, 502, cors);
  }

  const patched = await supabasePatchProfile(supabaseUrl, serviceKey, userId, {
    stack_photo_r2_key: key,
    stack_photo_url: null,
  });
  if (!patched) {
    return jsonResponse({ error: "Failed to update profile" }, 502, cors);
  }

  return jsonResponse({ key, private: true }, 200, cors);
}

/**
 * Authenticated GET — streams the user's stack photo from R2 (not publicly enumerable).
 */
async function handleGetStackPhoto(request, env, cors) {
  if (!supabaseAuthReady(env)) {
    return new Response("Service unavailable", { status: 503, headers: cors });
  }
  const bucket = env.STACK_PHOTOS;
  if (!bucket) {
    return new Response("Not configured", { status: 503, headers: cors });
  }

  const { data: sessionUser, error: authErr } = await getSessionUser(env, request.headers.get("Authorization"));
  if (authErr || !sessionUser?.sub) {
    return new Response("Unauthorized", { status: 401, headers: cors });
  }
  const userId = sessionUser.sub;

  const supabaseUrl = (env.SUPABASE_URL ?? "").replace(/\/$/, "");
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  const reqUrl = new URL(request.url);
  const keyParam = reqUrl.searchParams.get("key");
  let key = "";

  if (keyParam != null && String(keyParam).trim() !== "") {
    const trimmed = String(keyParam).trim();
    const prefix = `${userId}/`;
    if (!trimmed.startsWith(prefix) || trimmed.includes("..")) {
      return new Response("Forbidden", { status: 403, headers: cors });
    }
    key = trimmed;
  } else {
    const pr = await fetch(
      `${supabaseUrl}/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}&select=stack_photo_r2_key`,
      {
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
        },
      }
    );
    const rows = await pr.json().catch(() => []);
    const row = Array.isArray(rows) ? rows[0] : null;
    key = row && typeof row.stack_photo_r2_key === "string" ? row.stack_photo_r2_key.trim() : "";
  }

  if (!key) {
    return new Response("Not found", { status: 404, headers: cors });
  }

  try {
    const obj = await bucket.get(key);
    if (!obj) {
      return new Response("Not found", { status: 404, headers: cors });
    }
    const ct = obj.httpMetadata?.contentType ?? "application/octet-stream";
    return new Response(obj.body, {
      status: 200,
      headers: {
        ...cors,
        "Content-Type": ct,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (e) {
    log(env, "error", "r2_get_failed", { message: String(e) });
    return new Response("Storage error", { status: 502, headers: cors });
  }
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const MEMBER_PROFILE_ALLOWED_LANGUAGES = new Set(["en", "es", "pt-BR", "fr", "de", "ja", "zh-Hans"]);

const MEMBER_PROFILE_SHIFT_SCHEDULES = new Set(["days", "swings", "mids", "nights", "rotating"]);

const MEMBER_HANDLE_RE = /^[a-z0-9_]{3,20}$/;

/** @param {string} v */
function normalizeHandleForPatch(v) {
  let t = String(v).trim().toLowerCase();
  if (t.startsWith("@")) t = t.slice(1);
  return t;
}

/**
 * @param {string} supabaseUrl
 * @param {string} serviceKey
 * @param {string} handle
 * @param {string} excludeProfileId
 */
async function isHandleTakenElsewhere(supabaseUrl, serviceKey, handle, excludeProfileId) {
  const url = `${supabaseUrl}/rest/v1/member_profiles?handle=eq.${encodeURIComponent(handle)}&select=id`;
  const res = await fetch(url, {
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
    },
  });
  const rows = await res.json().catch(() => []);
  if (!Array.isArray(rows) || rows.length === 0) return false;
  const id = rows[0].id != null ? String(rows[0].id) : "";
  if (excludeProfileId && id === String(excludeProfileId)) return false;
  return true;
}

/**
 * GET /member-profiles/handle-available?handle=foo&exclude=uuid — authenticated.
 */
async function handleCheckHandleAvailability(request, env, cors) {
  if (!supabaseAuthReady(env)) {
    return jsonResponse({ error: "Supabase not configured" }, 503, cors);
  }
  const { data: sessionUser, error: authErr } = await getSessionUser(env, request.headers.get("Authorization"));
  if (authErr || !sessionUser?.sub) {
    return jsonResponse({ error: "Unauthorized" }, 401, cors);
  }
  const url = new URL(request.url);
  const raw = url.searchParams.get("handle") ?? url.searchParams.get("h") ?? "";
  let h = normalizeHandleForPatch(raw);
  const excludeRaw = url.searchParams.get("exclude") ?? "";
  const excludeProfileId = UUID_RE.test(excludeRaw) ? excludeRaw : undefined;
  if (!h) {
    return jsonResponse({ available: false, reason: "empty" }, 200, cors);
  }
  if (!MEMBER_HANDLE_RE.test(h)) {
    return jsonResponse({ available: false, reason: "invalid_format" }, 200, cors);
  }
  const supabaseUrl = (env.SUPABASE_URL ?? "").replace(/\/$/, "");
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  const taken = await isHandleTakenElsewhere(supabaseUrl, serviceKey, h, excludeProfileId ?? "");
  if (taken) {
    return jsonResponse({ available: false, reason: "taken" }, 200, cors);
  }
  return jsonResponse({ available: true }, 200, cors);
}

/** @param {string} s */
function normalizeWakeTimeForPatch(s) {
  const m = String(s).trim().match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  const sec = m[3] != null ? Number(m[3]) : 0;
  if (!Number.isFinite(h) || !Number.isFinite(min) || !Number.isFinite(sec)) return null;
  if (h < 0 || h > 23 || min < 0 || min > 59 || sec < 0 || sec > 59) return null;
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

/**
 * GET /member-profiles — list signed-in user's member_profiles (includes locale fields).
 */
async function handleGetMemberProfiles(request, env, cors) {
  if (!supabaseAuthReady(env)) {
    return jsonResponse({ error: "Supabase not configured" }, 503, cors);
  }
  const { data: sessionUser, error: authErr } = await getSessionUser(env, request.headers.get("Authorization"));
  if (authErr || !sessionUser?.sub) {
    return jsonResponse({ error: "Unauthorized" }, 401, cors);
  }
  const userId = sessionUser.sub;
  const supabaseUrl = (env.SUPABASE_URL ?? "").replace(/\/$/, "");
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  const sel = `${supabaseUrl}/rest/v1/member_profiles?user_id=eq.${encodeURIComponent(
    userId
  )}&select=id,user_id,display_name,avatar_url,is_default,created_at,city,state,country,language,shift_schedule,wake_time,handle,demo_sessions_shown&order=created_at.asc`;
  const res = await fetch(sel, {
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
    },
  });
  const rows = await res.json().catch(() => []);
  if (!res.ok || !Array.isArray(rows)) {
    log(env, "warn", "member_profile_get_list_failed", { userId, status: res.status });
    return jsonResponse({ error: "Could not load profiles" }, 502, cors);
  }
  return jsonResponse({ profiles: rows }, 200, cors);
}

/**
 * Build PATCH payload for member_profiles from JSON body.
 * At least one supported field must be present (display_name, locale, shift_schedule, wake_time, …).
 * @returns {{ patch?: Record<string, unknown>, error?: string }}
 */
function parseMemberProfilePatchBody(body) {
  if (body == null || typeof body !== "object" || Array.isArray(body)) {
    return { error: "Invalid body" };
  }
  /** @type {Record<string, unknown>} */
  const patch = {};
  let hasKey = false;

  if (Object.prototype.hasOwnProperty.call(body, "display_name")) {
    hasKey = true;
    const displayName =
      typeof body.display_name === "string" ? body.display_name.trim().slice(0, 120) : "";
    if (!displayName) {
      return { error: "display_name cannot be empty" };
    }
    patch.display_name = displayName;
  }

  const setNullableText = (key, maxLen) => {
    if (!Object.prototype.hasOwnProperty.call(body, key)) return null;
    hasKey = true;
    const v = body[key];
    if (v === null) {
      patch[key] = null;
      return null;
    }
    if (typeof v !== "string") {
      return `${key} must be a string or null`;
    }
    const t = v.trim().slice(0, maxLen);
    patch[key] = t === "" ? null : t;
    return null;
  };

  let err = setNullableText("city", 120);
  if (err) return { error: err };
  err = setNullableText("state", 120);
  if (err) return { error: err };

  if (Object.prototype.hasOwnProperty.call(body, "country")) {
    hasKey = true;
    const v = body.country;
    if (v === null) {
      patch.country = null;
    } else if (typeof v === "string") {
      const u = v.trim().toUpperCase();
      if (u === "") {
        patch.country = null;
      } else if (!/^[A-Z]{2}$/.test(u)) {
        return { error: "country must be ISO 3166-1 alpha-2 (e.g. US)" };
      } else {
        patch.country = u;
      }
    } else {
      return { error: "country must be a string or null" };
    }
  }

  if (Object.prototype.hasOwnProperty.call(body, "language")) {
    hasKey = true;
    const v = body.language;
    if (v === null) {
      patch.language = null;
    } else if (typeof v === "string") {
      const t = v.trim();
      if (t === "") {
        patch.language = null;
      } else if (!MEMBER_PROFILE_ALLOWED_LANGUAGES.has(t)) {
        return { error: "language is not an allowed BCP 47 tag" };
      } else {
        patch.language = t;
      }
    } else {
      return { error: "language must be a string or null" };
    }
  }

  if (Object.prototype.hasOwnProperty.call(body, "shift_schedule")) {
    hasKey = true;
    const v = body.shift_schedule;
    if (v === null) {
      patch.shift_schedule = null;
    } else if (typeof v === "string") {
      const t = v.trim();
      if (t === "") {
        patch.shift_schedule = null;
      } else if (!MEMBER_PROFILE_SHIFT_SCHEDULES.has(t)) {
        return { error: "shift_schedule must be days, swings, mids, nights, or rotating" };
      } else {
        patch.shift_schedule = t;
      }
    } else {
      return { error: "shift_schedule must be a string or null" };
    }
  }

  if (Object.prototype.hasOwnProperty.call(body, "wake_time")) {
    hasKey = true;
    const v = body.wake_time;
    if (v === null) {
      patch.wake_time = null;
    } else if (typeof v === "string") {
      const t = v.trim();
      if (t === "") {
        patch.wake_time = null;
      } else {
        const norm = normalizeWakeTimeForPatch(t);
        if (!norm) {
          return { error: "wake_time must be a valid time (HH:MM or HH:MM:SS)" };
        }
        patch.wake_time = norm;
      }
    } else {
      return { error: "wake_time must be a string or null" };
    }
  }

  if (Object.prototype.hasOwnProperty.call(body, "handle")) {
    hasKey = true;
    const v = body.handle;
    if (v === null) {
      patch.handle = null;
    } else if (typeof v === "string") {
      const t = normalizeHandleForPatch(v);
      if (t === "") {
        patch.handle = null;
      } else if (!MEMBER_HANDLE_RE.test(t)) {
        return {
          error: "handle must be 3–20 characters: lowercase letters, numbers, and underscores only",
        };
      } else {
        patch.handle = t;
      }
    } else {
      return { error: "handle must be a string or null" };
    }
  }

  if (!hasKey) {
    return { error: "No supported fields to update" };
  }
  return { patch };
}

/**
 * PATCH /member-profiles/:profileId — display_name and/or city, state, country, language.
 */
async function handlePatchMemberProfile(request, env, cors, profileIdRaw) {
  if (!supabaseAuthReady(env)) {
    return jsonResponse({ error: "Supabase not configured" }, 503, cors);
  }
  const { data: sessionUser, error: authErr } = await getSessionUser(env, request.headers.get("Authorization"));
  if (authErr || !sessionUser?.sub) {
    return jsonResponse({ error: "Unauthorized" }, 401, cors);
  }
  const userId = sessionUser.sub;
  const profileId = typeof profileIdRaw === "string" ? profileIdRaw.trim() : "";
  if (!UUID_RE.test(profileId)) {
    return jsonResponse({ error: "Invalid profile id" }, 400, cors);
  }
  let body = {};
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400, cors);
  }
  const parsed = parseMemberProfilePatchBody(body);
  if (parsed.error || !parsed.patch) {
    return jsonResponse({ error: parsed.error ?? "Invalid body" }, 400, cors);
  }
  const supabaseUrl = (env.SUPABASE_URL ?? "").replace(/\/$/, "");
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  if (parsed.patch.handle != null && typeof parsed.patch.handle === "string") {
    const taken = await isHandleTakenElsewhere(supabaseUrl, serviceKey, parsed.patch.handle, profileId);
    if (taken) {
      return jsonResponse({ error: "This handle is already taken" }, 409, cors);
    }
  }
  const patchResult = await supabasePatchMemberProfile(supabaseUrl, serviceKey, userId, profileId, parsed.patch);
  if (!patchResult.ok) {
    const { msg, status } = memberProfilePatchFailureMessage(patchResult, parsed.patch);
    log(env, "warn", "member_profile_patch_failed", {
      profileId,
      status: patchResult.status,
      httpStatus: status,
      snippet: String(patchResult.bodyText ?? "").slice(0, 200),
    });
    return jsonResponse({ error: msg }, status, cors);
  }
  return jsonResponse({ ok: true }, 200, cors);
}

/**
 * DELETE /member-profiles/:profileId — forbidden when is_default is true.
 */
async function handleDeleteMemberProfile(request, env, cors, profileIdRaw) {
  if (!supabaseAuthReady(env)) {
    return jsonResponse({ error: "Supabase not configured" }, 503, cors);
  }
  const { data: sessionUser, error: authErr } = await getSessionUser(env, request.headers.get("Authorization"));
  if (authErr || !sessionUser?.sub) {
    return jsonResponse({ error: "Unauthorized" }, 401, cors);
  }
  const userId = sessionUser.sub;
  const profileId = typeof profileIdRaw === "string" ? profileIdRaw.trim() : "";
  if (!UUID_RE.test(profileId)) {
    return jsonResponse({ error: "Invalid profile id" }, 400, cors);
  }
  const supabaseUrl = (env.SUPABASE_URL ?? "").replace(/\/$/, "");
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  const sel = await fetch(
    `${supabaseUrl}/rest/v1/member_profiles?id=eq.${encodeURIComponent(profileId)}&user_id=eq.${encodeURIComponent(userId)}&select=id,is_default`,
    {
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
      },
    }
  );
  const rows = await sel.json().catch(() => []);
  const row = Array.isArray(rows) ? rows[0] : null;
  if (!row) {
    return jsonResponse({ error: "Profile not found" }, 404, cors);
  }
  if (row.is_default === true) {
    return jsonResponse({ error: "Cannot delete the default profile" }, 403, cors);
  }
  const del = await fetch(
    `${supabaseUrl}/rest/v1/member_profiles?id=eq.${encodeURIComponent(profileId)}&user_id=eq.${encodeURIComponent(userId)}`,
    {
      method: "DELETE",
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        Prefer: "return=minimal",
      },
    }
  );
  if (!del.ok) {
    const t = await del.text().catch(() => "");
    log(env, "error", "member_profile_delete_failed", {
      userId,
      profileId,
      status: del.status,
      body: String(t).slice(0, 300),
    });
    return jsonResponse({ error: "Could not delete profile" }, 502, cors);
  }
  return jsonResponse({ ok: true }, 200, cors);
}

/**
 * Authenticated POST — multipart: file + kind (stack_shot_1 | stack_shot_2 | vial).
 * Vials tab hero shots and per-vial photos; Saved Stacks keep using POST /upload-stack-photo.
 */
async function handlePostStackPhoto(request, env, cors) {
  if (!supabaseAuthReady(env)) {
    return jsonResponse({ error: "SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set on the Worker" }, 503, cors);
  }

  const bucket = env.STACK_PHOTOS;
  if (!bucket) {
    return jsonResponse({ error: "R2 bucket STACK_PHOTOS is not bound on the Worker" }, 503, cors);
  }

  const { data: sessionUser, error: authErr } = await getSessionUser(env, request.headers.get("Authorization"));
  if (authErr || !sessionUser?.sub) {
    return jsonResponse({ error: "Unauthorized" }, 401, cors);
  }
  const userId = sessionUser.sub;

  const supabaseUrl = (env.SUPABASE_URL ?? "").replace(/\/$/, "");
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY ?? "";

  let formData;
  try {
    formData = await request.formData();
  } catch {
    return jsonResponse({ error: "Invalid multipart body" }, 400, cors);
  }

  const kindRaw = formData.get("kind");
  const kind = typeof kindRaw === "string" ? kindRaw.trim().toLowerCase() : "";
  const vialIdRaw = formData.get("vial_id");
  const vialId = typeof vialIdRaw === "string" ? vialIdRaw.trim() : "";
  const profileIdRaw = formData.get("profile_id");
  const profileId = typeof profileIdRaw === "string" ? profileIdRaw.trim() : "";
  const memberProfileIdRaw = formData.get("member_profile_id");
  const memberProfileId =
    typeof memberProfileIdRaw === "string" ? memberProfileIdRaw.trim() : "";

  if (kind !== "avatar") {
    const profilePlan = await fetchProfilePlan(supabaseUrl, serviceKey, userId);
    if (TIER_RANK[profilePlan] < TIER_RANK.pro) {
      return jsonResponse({ error: "Pro plan or higher required to upload stack photos" }, 403, cors);
    }
  }

  if (!["stack_shot_1", "stack_shot_2", "vial", "avatar"].includes(kind)) {
    return jsonResponse({ error: 'kind must be stack_shot_1, stack_shot_2, vial, or avatar' }, 400, cors);
  }
  if (kind === "vial") {
    if (!UUID_RE.test(vialId)) {
      return jsonResponse({ error: "Valid vial_id (UUID) required" }, 400, cors);
    }
  }

  const file = formData.get("file");
  if (!file || typeof file === "string" || typeof file.arrayBuffer !== "function") {
    return jsonResponse({ error: 'Expected multipart field "file"' }, 400, cors);
  }

  const size = typeof file.size === "number" ? file.size : 0;
  if (size <= 0 || size > STACK_PHOTO_MAX_BYTES) {
    return jsonResponse({ error: "File must be between 1 byte and 5MB" }, 400, cors);
  }

  const mime = typeof file.type === "string" ? file.type.trim().toLowerCase() : "";
  if (!STACK_PHOTO_TYPES.has(mime)) {
    return jsonResponse({ error: "Allowed types: image/jpeg, image/png, image/webp" }, 400, cors);
  }

  let key;
  /** When set, avatar upload updates `member_profiles.avatar_url` (R2 key) instead of account `profiles.avatar_r2_key`. */
  let avatarMemberProfileId = null;
  if (kind === "stack_shot_1") key = `${userId}/stack-shot-1.jpg`;
  else if (kind === "stack_shot_2") key = `${userId}/stack-shot-2.jpg`;
  else if (kind === "avatar") {
    if (memberProfileId && UUID_RE.test(memberProfileId)) {
      const mr = await fetch(
        `${supabaseUrl}/rest/v1/member_profiles?id=eq.${encodeURIComponent(memberProfileId)}&user_id=eq.${encodeURIComponent(userId)}&select=id`,
        {
          headers: {
            apikey: serviceKey,
            Authorization: `Bearer ${serviceKey}`,
          },
        }
      );
      const mrows = await mr.json().catch(() => []);
      if (!Array.isArray(mrows) || mrows.length === 0) {
        return jsonResponse({ error: "Member profile not found" }, 404, cors);
      }
      avatarMemberProfileId = memberProfileId;
      key = `${userId}/member-profiles/${memberProfileId}/avatar.jpg`;
    } else {
      key = `${userId}/avatar.jpg`;
    }
  } else key = `${userId}/vials/${vialId}.jpg`;

  let bytes;
  try {
    bytes = await file.arrayBuffer();
  } catch {
    return jsonResponse({ error: "Could not read file" }, 400, cors);
  }
  if (bytes.byteLength > STACK_PHOTO_MAX_BYTES) {
    return jsonResponse({ error: "File must be between 1 byte and 5MB" }, 400, cors);
  }

  if (kind === "vial") {
    let vialQs = `${supabaseUrl}/rest/v1/user_vials?id=eq.${encodeURIComponent(vialId)}&user_id=eq.${encodeURIComponent(userId)}&select=id`;
    if (profileId) vialQs += `&profile_id=eq.${encodeURIComponent(profileId)}`;
    const vr = await fetch(
      vialQs,
      {
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
        },
      }
    );
    const vrows = await vr.json().catch(() => []);
    if (!Array.isArray(vrows) || vrows.length === 0) {
      return jsonResponse({ error: "Vial not found" }, 404, cors);
    }
  }

  try {
    await bucket.put(key, bytes, {
      httpMetadata: { contentType: mime },
    });
  } catch (e) {
    log(env, "error", "r2_put_failed", { message: String(e) });
    return jsonResponse({ error: "Storage upload failed" }, 502, cors);
  }

  let patched = false;
  if (kind === "stack_shot_1") {
    patched = await supabasePatchProfile(supabaseUrl, serviceKey, userId, { stack_shot_1_r2_key: key });
  } else if (kind === "stack_shot_2") {
    patched = await supabasePatchProfile(supabaseUrl, serviceKey, userId, { stack_shot_2_r2_key: key });
  } else if (kind === "avatar") {
    if (avatarMemberProfileId) {
      const avatarPatch = await supabasePatchMemberProfile(supabaseUrl, serviceKey, userId, avatarMemberProfileId, {
        avatar_url: key,
      });
      patched = avatarPatch.ok;
    } else {
      patched = await supabasePatchProfile(supabaseUrl, serviceKey, userId, { avatar_r2_key: key });
    }
  } else {
    patched = await supabasePatchUserVial(supabaseUrl, serviceKey, userId, vialId, { vial_photo_r2_key: key }, profileId);
  }

  if (!patched) {
    return jsonResponse({ error: "Failed to update database" }, 502, cors);
  }

  return jsonResponse({ key, private: true }, 200, cors);
}

/**
 * Stripe → Supabase sync. Configure Payment Links / Checkout with client_reference_id = Supabase user UUID
 * and subscription or price metadata `plan` = entry|pro|elite|goat.
 */
async function handleStripeWebhook(request, env) {
  const whSecret = env.STRIPE_WEBHOOK_SECRET;
  const stripeKey = env.STRIPE_SECRET_KEY;
  if (!whSecret || !stripeKey) {
    log(env, "warn", "stripe_webhook_not_configured", {});
    return new Response("Webhook not configured", { status: 503 });
  }

  const sig = request.headers.get("stripe-signature");
  if (!sig) {
    return new Response("Missing signature", { status: 400 });
  }

  const body = await request.text();
  const verified = await verifyStripeWebhookSignature(body, sig, whSecret);
  if (!verified) {
    log(env, "warn", "stripe_webhook_verify_failed", {});
    return new Response("Bad signature", { status: 400 });
  }

  let event;
  try {
    event = JSON.parse(body);
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const supabaseUrl = (env.SUPABASE_URL ?? "").replace(/\/$/, "");
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  if (!supabaseUrl || !serviceKey) {
    return new Response("Supabase not configured", { status: 503 });
  }

  const eventId = typeof event.id === "string" ? event.id : "";

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data?.object ?? {};
        const userId =
          (typeof session.client_reference_id === "string" && session.client_reference_id) ||
          (typeof session.metadata?.supabase_user_id === "string" && session.metadata.supabase_user_id) ||
          "";
        const customerId =
          typeof session.customer === "string"
            ? session.customer
            : session.customer && typeof session.customer === "object"
              ? session.customer.id
              : "";
        let plan =
          (typeof session.metadata?.plan === "string" && normalizePlanTier(session.metadata.plan)) ||
          "entry";
        if (userId && customerId) {
          const subId =
            typeof session.subscription === "string"
              ? session.subscription
              : session.subscription && typeof session.subscription === "object"
                ? session.subscription.id
                : "";
          if ((plan === "entry" || !VALID_PLAN_TIERS.has(plan)) && subId) {
            const sub = await fetchStripeSubscriptionExpanded(stripeKey, subId);
            if (sub) plan = tierPlanFromStripeSubscription(sub);
          }
          const ok = await supabaseSyncUserPlanAndCustomer(env, supabaseUrl, serviceKey, userId, plan, customerId);
          if (!ok) {
            log(env, "error", "stripe_webhook_profile_sync_failed", { userId, eventId });
            return new Response("Profile sync failed", { status: 502 });
          }
          log(env, "info", "stripe_checkout_completed", { userId, plan, customerId });
        }
        break;
      }
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data?.object ?? {};
        const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer?.id;
        if (!customerId) break;

        const pr = await fetch(
          `${supabaseUrl}/rest/v1/profiles?stripe_customer_id=eq.${encodeURIComponent(customerId)}&select=id`,
          {
            headers: {
              apikey: serviceKey,
              Authorization: `Bearer ${serviceKey}`,
            },
          }
        );
        const rows = await pr.json().catch(() => []);
        const profile = Array.isArray(rows) ? rows[0] : null;
        const userId = profile && typeof profile.id === "string" ? profile.id : null;
        if (!userId) {
          log(env, "warn", "stripe_subscription_no_profile", { customerId });
          break;
        }

        const plan =
          event.type === "customer.subscription.deleted"
            ? "entry"
            : tierPlanFromStripeSubscription(sub);
        const ok = await supabaseSyncUserPlanAndCustomer(env, supabaseUrl, serviceKey, userId, plan, customerId);
        if (!ok) {
          log(env, "error", "stripe_webhook_subscription_sync_failed", { userId, eventId });
          return new Response("Sync failed", { status: 502 });
        }
        log(env, "info", "stripe_subscription_synced", { userId, plan, type: event.type });
        break;
      }
      default:
        break;
    }
  } catch (e) {
    log(env, "error", "stripe_webhook_handler_error", { message: String(e), eventId });
    return new Response("Handler error", { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

export default {
  async fetch(request, env) {
    const cors = corsHeaders(env, request);
    if (request.method === "OPTIONS") {
      if (!cors) {
        return new Response(null, { status: 403 });
      }
      return new Response(null, { headers: cors });
    }

    const url = new URL(request.url);

    if (url.pathname === "/stripe/webhook" && request.method === "POST") {
      return handleStripeWebhook(request, env);
    }

    if (!cors) {
      return new Response("Forbidden", { status: 403 });
    }

    if (url.pathname === "/stripe/subscription" && request.method === "GET") {
      return handleStripeSubscription(request, env, cors);
    }

    if (url.pathname === "/stripe/subscription/schedule-downgrade" && request.method === "POST") {
      return handleScheduleDowngrade(request, env, cors);
    }

    if (url.pathname === "/upload-stack-photo" && request.method === "POST") {
      return handleUploadStackPhoto(request, env, cors);
    }

    if (url.pathname === "/account/delete" && request.method === "POST") {
      return handleDeleteAccount(request, env, cors);
    }

    if (url.pathname === "/member-profiles/handle-available" && request.method === "GET") {
      return handleCheckHandleAvailability(request, env, cors);
    }

    if (url.pathname === "/member-profiles" && request.method === "GET") {
      return handleGetMemberProfiles(request, env, cors);
    }

    const memberProfilePathMatch = url.pathname.match(/^\/member-profiles\/([^/]+)\/?$/);
    if (memberProfilePathMatch) {
      const mpId = memberProfilePathMatch[1];
      if (request.method === "PATCH") {
        return handlePatchMemberProfile(request, env, cors, mpId);
      }
      if (request.method === "DELETE") {
        return handleDeleteMemberProfile(request, env, cors, mpId);
      }
    }

    if (url.pathname === "/member-profiles" && request.method === "POST") {
      return handleCreateMemberProfile(request, env, cors);
    }

    if (url.pathname === "/stack-photo" && request.method === "POST") {
      return handlePostStackPhoto(request, env, cors);
    }

    if (url.pathname === "/stack-photo" && request.method === "GET") {
      return handleGetStackPhoto(request, env, cors);
    }

    if (url.pathname !== "/v1/chat" || request.method !== "POST") {
      return new Response("Not found", { status: 404, headers: cors });
    }

    const key = env.ANTHROPIC_API_KEY;
    if (!key) {
      return jsonResponse({ error: "ANTHROPIC_API_KEY is not set on the Worker" }, 500, cors);
    }

    const production = isProduction(env);
    if (production && !supabaseAuthReady(env)) {
      log(env, "error", "production_missing_supabase", {});
      return jsonResponse(
        { error: "Server misconfiguration: Supabase auth is required" },
        503,
        cors
      );
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return jsonResponse({ error: "Invalid JSON body" }, 400, cors);
    }

    let userId = null;
    let plan = "entry";

    if (supabaseAuthReady(env)) {
      const { data: user, error } = await getSessionUser(env, request.headers.get("Authorization"));
      if (error || !user?.sub) {
        return jsonResponse({ error: "Unauthorized" }, 401, cors);
      }
      userId = user.sub;
      const supabaseUrl = (env.SUPABASE_URL ?? "").replace(/\/$/, "");
      const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY ?? "";
      plan = await fetchProfilePlan(supabaseUrl, serviceKey, userId);
    } else {
      if (production) {
        return jsonResponse({ error: "Unauthorized" }, 401, cors);
      }
      plan = normalizePlanTier(body.plan);
      log(env, "warn", "dev_mode_chat_without_supabase", {});
    }

    const rl = await checkRateLimit(env, env.RATE_LIMIT_KV, userId, plan);
    if (rl.error) {
      return jsonResponse({ error: rl.error }, 503, cors);
    }
    if (!rl.allowed) {
      return jsonResponse(
        {
          error: `Daily query limit reached (${rl.limit}/day on ${plan} plan). Upgrade for more queries.`,
          limit_reached: true,
          limit: rl.limit,
          count: rl.count,
        },
        429,
        cors
      );
    }

    const model = modelForPlan(plan);

    const payload = {
      model,
      max_tokens: Math.min(body.max_tokens ?? 1024, 1024),
      messages: normalizeMessages(body.messages).slice(-10),
      system: buildSystem(body),
    };

    let res;
    try {
      res = await fetch(ANTHROPIC_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": key,
          "anthropic-version": ANTHROPIC_VERSION,
        },
        body: JSON.stringify(payload),
      });
    } catch (e) {
      log(env, "error", "anthropic_fetch_failed", { message: String(e) });
      return jsonResponse({ error: "Upstream request failed" }, 502, cors);
    }

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      log(env, "warn", "anthropic_error", { status: res.status, body: data });
      return jsonResponse(
        { error: data.error?.message || data.error || `Anthropic error (${res.status})` },
        res.status >= 400 && res.status < 600 ? res.status : 502,
        cors
      );
    }

    const block = Array.isArray(data.content)
      ? data.content.find((c) => c.type === "text")
      : null;
    const text = block?.text ?? "";

    const inputTokens = data.usage?.input_tokens ?? 0;
    const outputTokens = data.usage?.output_tokens ?? 0;
    logUsage(env, userId, plan, model, inputTokens + outputTokens);

    return jsonResponse(
      {
        text,
        id: data.id,
        role: "assistant",
        usage: {
          queries_today: rl.count,
          queries_limit: rl.limit,
          plan,
        },
      },
      200,
      cors
    );
  },
};
