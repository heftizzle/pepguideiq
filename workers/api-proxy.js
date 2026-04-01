/**
 * Cloudflare Worker: proxies Anthropic Messages API so the API key never ships to the browser.
 *
 * Secrets: wrangler secret put ANTHROPIC_API_KEY
 * Supabase: wrangler secret put SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *   When both are set, `Authorization: Bearer <access_token>` is verified via GET /auth/v1/user
 *   (same as supabase.auth.getUser); plan comes from user_metadata / app_metadata.
 *   When unset, body.plan is used for /v1/chat (dev only — do not use in production).
 *
 * Route: POST /v1/chat — body JSON { system?, messages, plan?, max_tokens? }
 *   system: optional extra context appended after the Worker’s fixed advisor prompt (client cannot replace the persona).
 *   messages: only the last 10 turns are forwarded (cost / abuse limit).
 *   max_tokens: capped at 1024 regardless of client value.
 * Response: JSON { text, id?, role?, usage?: { queries_today, queries_limit, plan } } on success.
 *
 * CORS: Access-Control-Allow-Origin is * for now; for production lock to https://pepguideiq.com (or your Pages origin).
 *
 * Stripe (billing source of truth):
 *   GET  /stripe/subscription — subscription fields from Stripe + pending_plan from Supabase
 *   POST /stripe/subscription/schedule-downgrade — body { target_plan } — sets pending_plan + pending_plan_date
 *   Secrets: STRIPE_SECRET_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

const VALID_PLAN_TIERS = new Set(["entry", "pro", "elite", "goat"]);
const TIER_RANK = { entry: 0, pro: 1, elite: 2, goat: 3 };

const DAILY_QUERY_LIMIT = {
  entry: 1,
  pro:   4,
  elite: 8,
  goat:  16,
};

const MODEL_ENTRY_PRO = "claude-haiku-4-5-20251001";
const MODEL_ELITE_GOAT = "claude-sonnet-4-6";

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";

// TODO(prod): set to "https://pepguideiq.com" (or exact Pages URL) instead of "*"
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
};

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
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

/** Entry + Pro → Haiku; Elite + GOAT → Sonnet. Unknown/missing plan defaults to Haiku. */
function modelForPlan(plan) {
  const p = typeof plan === "string" ? plan.trim().toLowerCase() : "";
  if (p === "elite" || p === "goat") return MODEL_ELITE_GOAT;
  return MODEL_ENTRY_PRO;
}

/**
 * Checks and increments daily query counter in KV.
 * Key format: "rl:{userId}:{YYYY-MM-DD}" (UTC)
 * TTL: 25 hours — self-expiring, no cleanup needed.
 * If KV is not bound (dev mode), fails open with a warning.
 */
async function checkRateLimit(kv, userId, plan) {
  if (!kv) {
    console.warn("RATE_LIMIT_KV not bound — rate limiting disabled");
    return { allowed: true, count: 0, limit: 99 };
  }

  const limit = DAILY_QUERY_LIMIT[plan] ?? DAILY_QUERY_LIMIT.entry;
  const today = new Date().toISOString().slice(0, 10); // "2026-04-01"
  const key   = `rl:${userId}:${today}`;

  const raw     = await kv.get(key);
  const current = raw ? JSON.parse(raw) : { count: 0 };

  if (current.count >= limit) {
    return { allowed: false, count: current.count, limit };
  }

  const next = { count: current.count + 1 };
  await kv.put(key, JSON.stringify(next), { expirationTtl: 90000 }); // 25hr TTL
  return { allowed: true, count: next.count, limit };
}

/**
 * Fire-and-forget usage log to Supabase query_log table.
 * Never awaited — never blocks the response.
 */
function logUsage(env, userId, plan, model, tokenCount) {
  const supabaseUrl = (env.SUPABASE_URL ?? "").replace(/\/$/, "");
  const serviceKey  = env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  if (!supabaseUrl || !serviceKey || !userId) return;

  fetch(`${supabaseUrl}/rest/v1/query_log`, {
    method: "POST",
    headers: {
      apikey:          serviceKey,
      Authorization:   `Bearer ${serviceKey}`,
      "Content-Type":  "application/json",
      Prefer:          "return=minimal",
    },
    body: JSON.stringify({
      user_id:    userId,
      plan,
      model,
      token_count: tokenCount ?? 0,
      queried_at:  new Date().toISOString(),
    }),
  }).catch(() => {}); // swallow — logging must never break a response
}

/**
 * Validates the access token via Supabase Auth REST (same behavior as supabase.auth.getUser(jwt)).
 * @param {Record<string, string | undefined>} env
 * @param {string | null} authorization
 * @returns {Promise<{ data: { plan: string | null, sub: string | null } | null, error: Error | null }>}
 */
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
  const um = user.user_metadata;
  const am = user.app_metadata;
  let plan = null;
  if (um && typeof um === "object" && typeof um.plan === "string") plan = um.plan;
  else if (am && typeof am === "object" && typeof am.plan === "string") plan = am.plan;
  const sub = typeof user.id === "string" ? user.id : null;
  return { data: { plan, sub }, error: null };
}

function supabaseAuthReady(env) {
  return Boolean((env.SUPABASE_URL ?? "").trim() && (env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim());
}

function buildSystem(body) {
  const extra = typeof body?.system === "string" ? body.system.trim() : "";
  const base =
    "You are an expert peptide research advisor with deep knowledge of peptide pharmacology, biohacking protocols, dosing strategies, and interactions. Be direct, technical, and practical. Always include safety notes — these are research chemicals requiring physician oversight.";
  return extra ? `${base}\n\n${extra}` : base;
}

/** @param {Record<string, unknown> | null | undefined} subscr */
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

/**
 * @param {Request} request
 * @param {Record<string, string | undefined>} env
 */
async function handleStripeSubscription(request, env) {
  if (!supabaseAuthReady(env)) {
    return jsonResponse({ error: "SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set on the Worker" }, 503);
  }

  const { data: user, error } = await getSessionUser(env, request.headers.get("Authorization"));
  if (error || !user?.sub) {
    return jsonResponse({ error: "Unauthorized" }, 401);
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
    });

  if (!customerId) {
    return emptyResponse();
  }

  const stripeKey = env.STRIPE_SECRET_KEY ?? "";
  if (!stripeKey) {
    return jsonResponse({ error: "STRIPE_SECRET_KEY is not set on the Worker" }, 503);
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
      sr.status >= 400 && sr.status < 600 ? sr.status : 502
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
  });
}

/**
 * POST body: { target_plan: "entry" | "pro" | "elite" | "goat" }
 */
async function handleScheduleDowngrade(request, env) {
  if (!supabaseAuthReady(env)) {
    return jsonResponse({ error: "SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set on the Worker" }, 503);
  }

  const { data: user, error } = await getSessionUser(env, request.headers.get("Authorization"));
  if (error || !user?.sub) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }
  const userId = user.sub;

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }
  const target = typeof body?.target_plan === "string" ? body.target_plan.trim().toLowerCase() : "";
  if (!VALID_PLAN_TIERS.has(target)) {
    return jsonResponse({ error: "Invalid target_plan" }, 400);
  }

  const supabaseUrl = (env.SUPABASE_URL ?? "").replace(/\/$/, "");
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  if (!supabaseUrl || !serviceKey) {
    return jsonResponse({ error: "SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set on the Worker" }, 503);
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
    return jsonResponse({ error: "No Stripe customer on file" }, 400);
  }

  const stripeKey = env.STRIPE_SECRET_KEY ?? "";
  if (!stripeKey) {
    return jsonResponse({ error: "STRIPE_SECRET_KEY is not set on the Worker" }, 503);
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
      502
    );
  }
  const list = Array.isArray(sdata.data) ? sdata.data : [];
  const subscr = list[0];
  if (!subscr || typeof subscr.current_period_end !== "number") {
    return jsonResponse({ error: "No active subscription to schedule against" }, 400);
  }

  const currentTier = tierPlanFromStripeSubscription(subscr);
  const activeLike = ["active", "trialing", "past_due"].includes(subscr.status);
  if (!activeLike) {
    return jsonResponse({ error: "Subscription is not in a state that allows scheduling" }, 400);
  }
  if (TIER_RANK[target] >= TIER_RANK[currentTier]) {
    return jsonResponse({ error: "target_plan must be lower than current plan" }, 400);
  }

  const ok = await supabasePatchProfile(supabaseUrl, serviceKey, userId, {
    pending_plan: target,
    pending_plan_date: new Date(subscr.current_period_end * 1000).toISOString(),
  });
  if (!ok) {
    return jsonResponse({ error: "Failed to update profile" }, 502);
  }

  return jsonResponse({ ok: true });
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS });
    }

    const url = new URL(request.url);

    if (url.pathname === "/stripe/subscription" && request.method === "GET") {
      return handleStripeSubscription(request, env);
    }

    if (url.pathname === "/stripe/subscription/schedule-downgrade" && request.method === "POST") {
      return handleScheduleDowngrade(request, env);
    }

    if (url.pathname !== "/v1/chat" || request.method !== "POST") {
      return new Response("Not found", { status: 404, headers: CORS });
    }

    const key = env.ANTHROPIC_API_KEY;
    if (!key) {
      return jsonResponse({ error: "ANTHROPIC_API_KEY is not set on the Worker" }, 500);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return jsonResponse({ error: "Invalid JSON body" }, 400);
    }

    let plan;
    let userId = null;
    if (supabaseAuthReady(env)) {
      const { data: user, error } = await getSessionUser(env, request.headers.get("Authorization"));
      if (error || !user?.sub) {
        return jsonResponse({ error: "Unauthorized" }, 401);
      }
      plan = user.plan;
      userId = user.sub;
    } else {
      // body.plan is trusted only when Supabase auth is not configured on the Worker (dev only).
      plan = body.plan;
    }

    // ── Rate limit ──────────────────────────────────────────────
    const rl = await checkRateLimit(
      env.RATE_LIMIT_KV,
      userId,
      plan ?? "entry"
    );
    if (!rl.allowed) {
      return jsonResponse(
        {
          error: `Daily query limit reached (${rl.limit}/day on ${plan ?? "entry"} plan). Upgrade for more queries.`,
          limit_reached: true,
          limit:         rl.limit,
          count:         rl.count,
        },
        429
      );
    }
    // ────────────────────────────────────────────────────────────

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
    } catch {
      return jsonResponse({ error: "Upstream request failed" }, 502);
    }

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return jsonResponse(
        { error: data.error?.message || data.error || `Anthropic error (${res.status})` },
        res.status >= 400 && res.status < 600 ? res.status : 502
      );
    }

    const block = Array.isArray(data.content)
      ? data.content.find((c) => c.type === "text")
      : null;
    const text = block?.text ?? "";

    const inputTokens  = data.usage?.input_tokens  ?? 0;
    const outputTokens = data.usage?.output_tokens ?? 0;
    logUsage(env, userId, plan, model, inputTokens + outputTokens);

    return jsonResponse({
      text,
      id:   data.id,
      role: "assistant",
      usage: {
        queries_today: rl.count,
        queries_limit: rl.limit,
        plan:          plan ?? "entry",
      },
    });
  },
};
