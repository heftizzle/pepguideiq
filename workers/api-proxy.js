/**
 * Cloudflare Worker: proxies Anthropic Messages API so the API key never ships to the browser.
 *
 * Secrets: wrangler secret put ANTHROPIC_API_KEY
 * Optional (hardened model selection): wrangler secret put SUPABASE_JWT_SECRET
 *   Same value as Supabase Dashboard → Project Settings → API → JWT Secret (legacy).
 *   When set, `Authorization: Bearer <access_token>` is verified; plan comes from the JWT
 *   `user_metadata.plan` (and body.plan is ignored for routing). When unset, body.plan is used.
 *
 * Route: POST /v1/chat — body JSON { system?, messages, plan?, max_tokens? }
 *   system: optional extra context appended after the Worker’s fixed advisor prompt (client cannot replace the persona).
 *   messages: only the last 10 turns are forwarded (cost / abuse limit).
 *   max_tokens: capped at 1024 regardless of client value.
 * Response: JSON { text } (plain assistant string) on success.
 *
 * CORS: Access-Control-Allow-Origin is * for now; for production lock to https://pepguideiq.com (or your Pages origin).
 *
 * Stripe (billing source of truth):
 *   GET  /stripe/subscription — subscription fields from Stripe + pending_plan from Supabase
 *   POST /stripe/subscription/schedule-downgrade — body { target_plan } — sets pending_plan + pending_plan_date
 *   Secrets: STRIPE_SECRET_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_JWT_SECRET
 */

const VALID_PLAN_TIERS = new Set(["entry", "pro", "elite", "goat"]);
const TIER_RANK = { entry: 0, pro: 1, elite: 2, goat: 3 };

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

function base64UrlToBytes(b64url) {
  let s = b64url.replace(/-/g, "+").replace(/_/g, "/");
  const pad = s.length % 4;
  if (pad) s += "=".repeat(4 - pad);
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/**
 * Verifies Supabase HS256 JWT and returns plan from token claims (not from request body).
 * @param {string | null} authorization
 * @param {string} secret
 * @returns {Promise<{ plan: string | null, sub: string | null }>}
 */
async function verifyJWT(authorization, secret) {
  const raw = authorization?.replace(/^Bearer\s+/i, "")?.trim();
  if (!raw) {
    throw new Error("Missing Authorization Bearer token");
  }
  const parts = raw.split(".");
  if (parts.length !== 3) {
    throw new Error("Invalid token");
  }
  const [h, p, sigB64] = parts;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"]
  );
  const signedBytes = new TextEncoder().encode(`${h}.${p}`);
  const sig = base64UrlToBytes(sigB64);
  const ok = await crypto.subtle.verify("HMAC", key, sig, signedBytes);
  if (!ok) {
    throw new Error("Invalid token signature");
  }
  const payloadJson = new TextDecoder().decode(base64UrlToBytes(p));
  const payload = JSON.parse(payloadJson);
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp != null && now > payload.exp) {
    throw new Error("Token expired");
  }
  const um = payload.user_metadata;
  const am = payload.app_metadata;
  let plan = null;
  if (um && typeof um === "object" && typeof um.plan === "string") plan = um.plan;
  else if (am && typeof am === "object" && typeof am.plan === "string") plan = am.plan;
  else if (typeof payload.plan === "string") plan = payload.plan;
  const sub = typeof payload.sub === "string" ? payload.sub : null;
  return { plan, sub };
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
  const jwtSecret = env.SUPABASE_JWT_SECRET ?? "";
  if (!jwtSecret) {
    return jsonResponse({ error: "SUPABASE_JWT_SECRET is not set on the Worker" }, 503);
  }

  let userId;
  try {
    const v = await verifyJWT(request.headers.get("Authorization"), jwtSecret);
    userId = v.sub;
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unauthorized";
    return jsonResponse({ error: msg }, 401);
  }
  if (!userId) {
    return jsonResponse({ error: "Invalid token: missing sub" }, 401);
  }

  const supabaseUrl = (env.SUPABASE_URL ?? "").replace(/\/$/, "");
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  if (!supabaseUrl || !serviceKey) {
    return jsonResponse({ error: "SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set on the Worker" }, 503);
  }

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
  const jwtSecret = env.SUPABASE_JWT_SECRET ?? "";
  if (!jwtSecret) {
    return jsonResponse({ error: "SUPABASE_JWT_SECRET is not set on the Worker" }, 503);
  }

  let userId;
  try {
    const v = await verifyJWT(request.headers.get("Authorization"), jwtSecret);
    userId = v.sub;
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unauthorized";
    return jsonResponse({ error: msg }, 401);
  }
  if (!userId) {
    return jsonResponse({ error: "Invalid token: missing sub" }, 401);
  }

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

    const jwtSecret = env.SUPABASE_JWT_SECRET ?? "";
    let plan;
    if (jwtSecret) {
      try {
        const v = await verifyJWT(request.headers.get("Authorization"), jwtSecret);
        plan = v.plan;
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Unauthorized";
        return jsonResponse({ error: msg }, 401);
      }
    } else {
      // body.plan is trusted only when SUPABASE_JWT_SECRET is unset; set the secret to close this gap.
      plan = body.plan;
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

    return jsonResponse({ text, id: data.id, role: "assistant" });
  },
};
