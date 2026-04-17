/**
 * Cloudflare Worker: Anthropic proxy, Stripe billing helpers, R2 stack photos.
 *
 * Secrets: wrangler secret put ANTHROPIC_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 * Optional: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
 * Vars: STRIPE_PRICE_ID_PRO, STRIPE_PRICE_ID_ELITE, STRIPE_PRICE_ID_GOAT (required for create-subscription),
 *       ALLOWED_ORIGIN (exact origin, e.g. https://pepguideiq.com; omit or * for dev),
 *       ENVIRONMENT=production (strict: require Supabase + KV for /v1/chat, fail closed on rate limit)
 */

// ─── Enumeration Hardening — routes patched: (none) ───
// Audit: This Worker does not define any HTTP routes for login, signup, forgot-password,
// password-reset, magic-link, or OTP. Those flows use Supabase Auth from the browser
// (see src/lib/supabase.js); no Worker-side responses vary on “email/user exists” for
// those operations. IP rate limiting uses pathname prefixes /auth, /login, /signup for
// classification only — there are no matching route handlers here.
// Auth-adjacent endpoints that do exist (e.g. POST /account/delete, member_profiles) use
// session-backed identity only and were left unchanged per scope.

const VALID_PLAN_TIERS = new Set(["entry", "pro", "elite", "goat"]);
const TIER_RANK = { entry: 0, pro: 1, elite: 2, goat: 3 };

/** Max Netflix-style member_profiles per account (Free/Pro: 1, Elite: 2, GOAT: 4). */
function memberProfileSlotLimit(plan) {
  const p = normalizePlanTier(plan, undefined);
  if (p === "goat") return 4;
  if (p === "elite") return 2;
  return 1;
}

const DAILY_QUERY_LIMIT = {
  entry: 2,
  pro: 4,
  elite: 8,
  goat: 16,
};

const DAILY_ADVISOR_LIMIT = {
  entry: 5,
  pro: 20,
  elite: 30,
  goat: 40,
};

const MODEL_ENTRY_PRO = "claude-haiku-4-5-20251001";
const MODEL_ELITE_GOAT = "claude-sonnet-4-6";

const STACK_PHOTO_MAX_BYTES = 10 * 1024 * 1024;
const STACK_PHOTO_TYPES = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/gif", "gif"],
]);

/**
 * Verify file magic bytes match claimed image/* (defense against MIME spoofing).
 * JPEG FF D8 FF; PNG 89 50 4E 47; WEBP RIFF..WEBP; GIF GIF8.
 * @param {ArrayBuffer} buf
 * @param {string} mime — lowercase e.g. image/jpeg
 */
function imageMagicMatchesClaimedMime(buf, mime) {
  const u = new Uint8Array(buf.slice(0, 16));
  if (u.length < 3) return false;
  if (mime === "image/jpeg") {
    return u[0] === 0xff && u[1] === 0xd8 && u[2] === 0xff;
  }
  if (mime === "image/png") {
    return u.length >= 4 && u[0] === 0x89 && u[1] === 0x50 && u[2] === 0x4e && u[3] === 0x47;
  }
  if (mime === "image/gif") {
    return u.length >= 4 && u[0] === 0x47 && u[1] === 0x49 && u[2] === 0x46 && u[3] === 0x38;
  }
  if (mime === "image/webp") {
    if (u.length < 12) return false;
    return (
      u[0] === 0x52 &&
      u[1] === 0x49 &&
      u[2] === 0x46 &&
      u[3] === 0x46 &&
      u[8] === 0x57 &&
      u[9] === 0x45 &&
      u[10] === 0x42 &&
      u[11] === 0x50
    );
  }
  return false;
}

/** Content-Type from stored R2 object's filename extension (fallback when metadata is missing). */
function contentTypeFromKey(key) {
  const m = String(key ?? "").toLowerCase().match(/\.([a-z0-9]+)$/);
  if (!m) return "application/octet-stream";
  const ext = m[1];
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  if (ext === "gif") return "image/gif";
  return "application/octet-stream";
}

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
/** Messages API version header (required). Latest per https://platform.claude.com/docs/en/api/versioning (Apr 2026). */
const ANTHROPIC_VERSION = "2023-06-01";

const CORS_BASE = {
  "Access-Control-Allow-Methods": "GET, HEAD, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
};

/** Permissive CORS — edge may answer OPTIONS before Worker; POST/OPTIONS responses must still carry ACAO. */
const PERMISSIVE_CORS_HEADERS = {
  ...CORS_BASE,
  "Access-Control-Allow-Origin": "*",
};

// ─── Security Headers ───
// img-src includes the Worker origin (workers.dev) so avatars served from
// /avatars/{key} render in the SPA from a different origin.
const SECURITY_HEADERS = {
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy":
    "camera=(), microphone=(), geolocation=(), payment=(self \"https://js.stripe.com\" \"https://hooks.stripe.com\")",
  "Content-Security-Policy":
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com https://js.stripe.com; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: blob: https://*.r2.cloudflarestorage.com https://*.workers.dev; " +
    "connect-src 'self' https://api.anthropic.com https://*.supabase.co https://*.workers.dev https://api.stripe.com https://m.stripe.network; " +
    "frame-src https://challenges.cloudflare.com https://js.stripe.com https://hooks.stripe.com; " +
    "object-src 'none'; " +
    "base-uri 'self'; " +
    "form-action 'self'",
};

// ─── Rate Limiting ───
/**
 * IP sliding-window limits (RATE_LIMIT_KV, keys `iprl:<type>:<ip>`). This is
 * defense-in-depth for auth/api/R2 routes. Primary usage and abuse control for
 * paid upstreams is daily per-user KV (`rl:<userId>:<date>`, advisor keys, etc.).
 */
const RATE_LIMITS = {
  auth: { windowMs: 60_000, max: 10 },
  api: { windowMs: 60_000, max: 60 },
  /** Authed image uploads (POST/PUT): 20/min per IP. */
  r2_write: { windowMs: 60_000, max: 20 },
  /** Authenticated private image reads (GET /stack-photo): 500/min per IP. Public /avatars/ is unrate-limited. */
  r2_read: { windowMs: 60_000, max: 500 },
};

// ─── Turnstile ───
const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

/**
 * @param {string} token
 * @param {Record<string, string | undefined>} env
 * @returns {Promise<{ success: boolean }>}
 */
async function verifyTurnstile(token, env) {
  const secret = env.TURNSTILE_SECRET_KEY ?? "";
  if (!secret || !token) {
    return { success: false };
  }
  try {
    const body = new URLSearchParams();
    body.set("secret", secret);
    body.set("response", token);
    const res = await fetch(TURNSTILE_VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });
    if (!res.ok) {
      return { success: false };
    }
    const data = await res.json().catch(() => ({}));
    if (data && data.success === true) {
      return { success: true };
    }
    return { success: false };
  } catch {
    return { success: false };
  }
}

/**
 * Sliding-window IP rate limit using RATE_LIMIT_KV.
 * @param {Record<string, unknown>} env
 * @param {string} ip
 * @param {"auth" | "api" | "r2_read" | "r2_write"} type
 * @returns {Promise<{ limited: boolean, retryAfter?: number, serviceUnavailable?: boolean }>}
 */
async function checkIpRateLimit(env, ip, type) {
  const kv = env.RATE_LIMIT_KV;
  const cfg = RATE_LIMITS[type] ?? RATE_LIMITS.api;
  if (!kv) {
    if (isProduction(env)) {
      log(env, "error", "rate_limit_kv_required_ip", { type });
      return { limited: true, retryAfter: 60, serviceUnavailable: true };
    }
    return { limited: false };
  }

  const key = `iprl:${type}:${ip}`;
  const now = Date.now();
  const { windowMs, max } = cfg;

  const raw = await kv.get(key);
  /** @type {number[]} */
  let stamps = [];
  if (raw) {
    try {
      const o = JSON.parse(raw);
      if (o && Array.isArray(o.t)) {
        stamps = o.t.filter((x) => typeof x === "number" && now - x < windowMs);
      }
    } catch {
      /* corrupted — treat as empty */
    }
  }

  if (stamps.length >= max) {
    stamps.sort((a, b) => a - b);
    const oldest = stamps[0];
    const retryAfter = Math.max(1, Math.ceil((oldest + windowMs - now) / 1000));
    return { limited: true, retryAfter };
  }

  stamps.push(now);
  const ttlSec = Math.min(90_000, Math.max(120, Math.ceil((windowMs / 1000) * 3)));
  await kv.put(key, JSON.stringify({ t: stamps }), { expirationTtl: ttlSec });
  return { limited: false };
}

/** @param {number} retryAfter seconds until the client may retry */
function rateLimitResponse(retryAfter) {
  const sec = Math.max(1, Math.floor(Number(retryAfter)) || 1);
  return new Response(JSON.stringify({ error: "Too many requests", retryAfter: sec }), {
    status: 429,
    headers: {
      "Content-Type": "application/json",
      "Retry-After": String(sec),
    },
  });
}

/**
 * Clones the response and merges SECURITY_HEADERS onto it (Worker exit hardening).
 * @param {Response} response
 */
function applySecurityHeaders(response) {
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    headers.set(key, value);
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

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

/** CORS for public avatar images (<img src cross-origin); not gated on ALLOWED_ORIGIN. */
function publicAvatarCorsHeaders() {
  return PERMISSIVE_CORS_HEADERS;
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

// ─── AI GUIDE (stack recommendations) ───────────────────────────────────────
/**
 * POST /ai-guide (aliases: /ai-stack-advisor, /stack-advisor) — Build-tab stack suggestions (permissive CORS).
 * Upstream / transport failures → 502 { error }; invalid model JSON on 200 → empty insight/recommendations.
 * Auth: same session + fetchProfilePlan pattern as POST /v1/chat (no client-supplied plan or user id).
 * @param {Request} request
 * @param {Record<string, string | undefined>} env
 */
async function handleStackAdvisor(request, env) {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };

  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const production = isProduction(env);
  if (production && !supabaseAuthReady(env)) {
    log(env, "error", "production_missing_supabase", { route: "stack_advisor" });
    return new Response(
      JSON.stringify({ error: "Server misconfiguration: Supabase auth is required" }),
      { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  let sessionUserId = null;
  let plan = "entry";
  /** @type {string[]} */
  let advisorUserContextLines = [];
  if (supabaseAuthReady(env)) {
    const { data: user, error } = await getSessionUser(env, request.headers.get("Authorization"));
    if (error || !user?.sub) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    sessionUserId = user.sub;
    const supabaseUrl = (env.SUPABASE_URL ?? "").replace(/\/$/, "");
    const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY ?? "";
    plan = await fetchProfilePlan(supabaseUrl, serviceKey, sessionUserId, env);
    const aiCtx = await fetchProfileAiContextFields(supabaseUrl, serviceKey, sessionUserId);
    advisorUserContextLines = [
      biologicalSexPromptLineFromDb(aiCtx.biological_sex),
      agePromptLineFromDob(aiCtx.date_of_birth),
      trainingExperiencePromptLineFromDb(aiCtx.training_experience),
    ].filter(Boolean);
  } else {
    if (production) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    log(env, "warn", "dev_mode_stack_advisor_without_supabase", {});
  }

  const advisorRateUserId = sessionUserId ?? "anon";
  const dailyLimit = DAILY_ADVISOR_LIMIT[plan] ?? DAILY_ADVISOR_LIMIT.entry;

  try {
    const { currentStack, catalog } = await request.json();

    if (!currentStack?.length) {
      return new Response(JSON.stringify({ error: "No stack provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!Array.isArray(catalog)) {
      return new Response(JSON.stringify({ error: "Invalid catalog" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (dailyLimit < 999 && env.RATE_LIMIT_KV) {
      const today = new Date().toISOString().split("T")[0];
      const kvKey = `advisor:${advisorRateUserId}:${today}`;
      const count = parseInt((await env.RATE_LIMIT_KV.get(kvKey)) ?? "0", 10);

      if (count >= dailyLimit) {
        return new Response(
          JSON.stringify({
            insight: "",
            recommendations: [],
            rateLimited: true,
            limitMessage: `You've used your ${dailyLimit} daily AI Guide calls on the ${plan} plan.`,
          }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      await env.RATE_LIMIT_KV.put(kvKey, String(count + 1), { expirationTtl: 86400 });
    }

    const stackIds = new Set(
      currentStack.map((c) => (c && typeof c.id === "string" ? c.id : "")).filter(Boolean)
    );
    const compactCatalog = catalog
      .filter((c) => c && typeof c.id === "string" && !stackIds.has(c.id))
      .map((c) => ({
        id: c.id,
        name: typeof c.name === "string" ? c.name : c.id,
        category: typeof c.category === "string" ? c.category : "",
        brief: typeof c.brief === "string" ? c.brief : "",
      }));

    const systemPrompt = `You are an expert peptide and biohacking protocol advisor. The user is building a research stack and needs honest, nuanced compound recommendations. You MUST only recommend compounds that exist in the provided catalog — never invent compounds not in the list. Be specific about mechanisms and overlap with the current stack. Return ONLY valid JSON — no markdown, no preamble, no explanation outside the JSON. Exact shape required:
{
  "insight": "1-2 sentences assessing the current stack (strengths, gaps, redundancy)",
  "recommendations": [
    {
      "peptideId": "exact_id_from_catalog",
      "name": "Exact catalog name",
      "reason": "One clear sentence: why this tier applies and how it relates to the current stack.",
      "tier": "must_have"
    }
  ]
}

Return EXACTLY 4 recommendations — no fewer, no more. Each object MUST include "tier" as one of these strings only:
- "must_have": high synergy with the current stack; a clear gap is being filled.
- "nice_to_have": complementary benefit; marginal improvement, not essential.
- "not_necessary": the stack already covers this therapeutic/goal angle adequately.
- "redundant": overlaps with an existing compound; may compete, duplicate mechanism, or add little distinct value.

Tier assignment rules:
- As the stack grows larger, be more honest: surface more "not_necessary" and "redundant" picks when appropriate. A stack of ~10 compounds should rarely label anything "must_have" unless the gap is unmistakable.
- Do not force four "must_have" items; use the full tier spectrum when the stack warrants it.
- Every peptideId MUST match an "id" from the provided catalog (compounds not already in the user's stack).

Only use peptideId values from the provided catalog.`;

    const advisorContextBlock = advisorUserContextLines.length ? advisorUserContextLines.join("\n") : "";
    const stackAdvisorSystemText = [systemPrompt, advisorContextBlock, AI_AGE_TRAINING_SAFETY_NOTE]
      .filter(Boolean)
      .join("\n\n");

    const apiKey = env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ insight: "", recommendations: [] }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let anthropicRes;
    try {
      anthropicRes = await fetch(ANTHROPIC_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": ANTHROPIC_VERSION,
        },
        body: JSON.stringify({
          model: MODEL_ENTRY_PRO,
          max_tokens: 900,
          system: [{ type: "text", text: stackAdvisorSystemText, cache_control: { type: "ephemeral" } }],
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: `Available catalog (filtered, not in stack already):\n${JSON.stringify(compactCatalog)}`,
                  cache_control: { type: "ephemeral" },
                },
                {
                  type: "text",
                  text: `Current stack: ${JSON.stringify(currentStack)}\n\nAssess the stack and return exactly 4 recommendations in the required JSON shape (each with peptideId, name, reason, and tier).`,
                },
              ],
            },
          ],
        }),
      });
    } catch (fetchErr) {
      log(env, "error", "stack_advisor_fetch_failed", { message: String(fetchErr) });
      return new Response(JSON.stringify({ error: "Advisor temporarily unavailable" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!anthropicRes.ok) {
      log(env, "warn", "stack_advisor_anthropic_status", { status: anthropicRes.status });
      return new Response(JSON.stringify({ error: "Advisor temporarily unavailable" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let anthropicData;
    try {
      anthropicData = await anthropicRes.json();
    } catch (jsonErr) {
      log(env, "error", "stack_advisor_anthropic_json", { message: String(jsonErr) });
      return new Response(JSON.stringify({ error: "Advisor temporarily unavailable" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const rawText = anthropicData.content?.[0]?.text ?? "";
    const cleaned = rawText.replace(/```json|```/g, "").trim();
    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      return new Response(JSON.stringify({ insight: "", recommendations: [] }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const catalogIdSet = new Set(catalog.map((c) => (c && c.id ? String(c.id) : "")).filter(Boolean));
    const ADVISOR_TIERS = new Set(["must_have", "nice_to_have", "not_necessary", "redundant"]);
    const rawRecs = Array.isArray(parsed.recommendations) ? parsed.recommendations : [];
    const safeRecs = rawRecs
      .map((r) => {
        if (!r || typeof r !== "object") return null;
        const pid =
          typeof r.peptideId === "string"
            ? r.peptideId.trim()
            : typeof r.catalogId === "string"
              ? r.catalogId.trim()
              : "";
        if (!pid || !catalogIdSet.has(pid)) return null;
        const tierRaw = typeof r.tier === "string" ? r.tier.trim().toLowerCase().replace(/-/g, "_") : "";
        const tier = ADVISOR_TIERS.has(tierRaw) ? tierRaw : undefined;
        const name = typeof r.name === "string" && r.name.trim() ? r.name.trim() : pid;
        const reason =
          typeof r.reason === "string"
            ? r.reason.trim()
            : typeof r.rationale === "string"
              ? r.rationale.trim()
              : "";
        const out = { peptideId: pid, name, reason };
        if (tier) out.tier = tier;
        return out;
      })
      .filter(Boolean)
      .slice(0, 4);

    return new Response(JSON.stringify({ insight: parsed.insight ?? "", recommendations: safeRecs }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    log(env, "error", "stack_advisor_error", { message: String(err) });
    return new Response(JSON.stringify({ error: "Advisor temporarily unavailable" }), {
      status: 502,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}

function modelForPlan(plan) {
  const p = typeof plan === "string" ? plan.trim().toLowerCase() : "";
  if (p === "elite" || p === "goat") return MODEL_ELITE_GOAT;
  return MODEL_ENTRY_PRO;
}

/** Anthropic max_tokens ceiling by plan (M11). */
function maxTokensCapForPlan(plan, env) {
  const p = normalizePlanTier(plan, env);
  if (p === "goat") return 4096;
  if (p === "elite") return 2048;
  return 1024;
}

/**
 * Read-only daily query budget check (does not consume a query). Increment after Anthropic success.
 * @param {import("@cloudflare/workers-types").KVNamespace | undefined} kv
 * @param {string | null} userId
 * @param {string} plan
 */
async function readDailyQueryRateLimit(env, kv, userId, plan) {
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
    try {
      current = JSON.parse(raw);
    } catch {
      /* corrupted KV entry — reset */
    }
  }

  if (current.count >= limit) {
    return { allowed: false, count: current.count, limit };
  }
  return { allowed: true, count: current.count, limit };
}

/**
 * Consume one daily query slot after a successful Anthropic response (M4).
 * @param {import("@cloudflare/workers-types").KVNamespace | undefined} kv
 * @param {string | null} userId
 * @param {string} plan
 */
async function incrementDailyQueryRateLimit(env, kv, userId, plan) {
  const production = isProduction(env);
  if (!kv) {
    if (production) {
      return { count: 0, limit: 0 };
    }
    return { count: 0, limit: 99 };
  }
  if (!userId) {
    return { count: 0, limit: 0 };
  }
  const limit = DAILY_QUERY_LIMIT[plan] ?? DAILY_QUERY_LIMIT.entry;
  const today = new Date().toISOString().slice(0, 10);
  const key = `rl:${userId}:${today}`;
  const raw = await kv.get(key);
  let current = { count: 0 };
  if (raw) {
    try {
      current = JSON.parse(raw);
    } catch {
      /* reset */
    }
  }
  const next = { count: current.count + 1 };
  await kv.put(key, JSON.stringify(next), { expirationTtl: 90000 });
  return { count: next.count, limit };
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

/**
 * @param {unknown} p
 * @param {Record<string, string | undefined> | undefined} env — when set, unknown non-empty tiers log a warning (L9).
 */
function normalizePlanTier(p, env) {
  const x = typeof p === "string" ? p.trim().toLowerCase() : "";
  if (VALID_PLAN_TIERS.has(x)) return x;
  if (x && env) {
    log(env, "warn", "unknown_plan_tier", { received: String(p) });
  }
  return "entry";
}

/**
 * @param {Record<string, string | undefined> | undefined} [env]
 */
async function fetchProfilePlan(supabaseUrl, serviceKey, userId, env) {
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
  return normalizePlanTier(row?.plan, env);
}

/** Milliseconds per mean Gregorian year (365.25 days), per product spec for age-at-request. */
const MS_PER_YEAR_AGE = 31557600000;

const VALID_TRAINING_EXPERIENCE = new Set(["beginner", "intermediate", "advanced", "elite"]);

const AI_AGE_TRAINING_SAFETY_NOTE =
  "If the user's age is over 60 or under 25, apply conservative dosing guidance and flag compounds with age-specific risk profiles. If age is unknown, note that recommendations assume a healthy adult and encourage the user to consult a physician.";

/**
 * @param {string | null | undefined} raw — profiles.biological_sex
 * @returns {string} — line for model context, or empty to omit
 */
function biologicalSexPromptLineFromDb(raw) {
  const x = typeof raw === "string" ? raw.trim().toLowerCase() : "";
  if (x === "male") return "User biological sex: male";
  if (x === "female") return "User biological sex: female";
  return "";
}

/**
 * @param {string | null | undefined} isoDate — profiles.date_of_birth (YYYY-MM-DD)
 * @returns {number | null}
 */
function ageFromDateOfBirthAtRequestTime(isoDate) {
  const s = typeof isoDate === "string" ? isoDate.trim() : "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const t = new Date(s + "T12:00:00.000Z");
  if (Number.isNaN(t.getTime())) return null;
  const age = Math.floor((Date.now() - t.getTime()) / MS_PER_YEAR_AGE);
  if (!Number.isFinite(age) || age < 0 || age > 120) return null;
  return age;
}

/**
 * @param {string | null | undefined} isoDate
 * @returns {string} — line for model context, or empty to omit
 */
function agePromptLineFromDob(isoDate) {
  const age = ageFromDateOfBirthAtRequestTime(isoDate);
  return age != null ? `User age: ${age}` : "";
}

/**
 * @param {string | null | undefined} raw — profiles.training_experience
 * @returns {string} — line for model context, or empty to omit
 */
function trainingExperiencePromptLineFromDb(raw) {
  const x = typeof raw === "string" ? raw.trim().toLowerCase() : "";
  if (!VALID_TRAINING_EXPERIENCE.has(x)) return "";
  return `User training experience: ${x}`;
}

/**
 * Profile fields used for AI Guide and Stack Advisor safety context (single REST round-trip).
 * @param {string} supabaseUrl
 * @param {string} serviceKey
 * @param {string} userId
 * @returns {Promise<{ biological_sex: string | null, date_of_birth: string | null, training_experience: string | null }>}
 */
async function fetchProfileAiContextFields(supabaseUrl, serviceKey, userId) {
  const res = await fetch(
    `${supabaseUrl}/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}&select=biological_sex,date_of_birth,training_experience`,
    {
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
      },
    }
  );
  const rows = await res.json().catch(() => []);
  const row = Array.isArray(rows) ? rows[0] : null;
  const sex = typeof row?.biological_sex === "string" ? row.biological_sex.trim() : null;
  const dobRaw = row?.date_of_birth;
  const dob =
    typeof dobRaw === "string"
      ? dobRaw.trim()
      : dobRaw instanceof Date && !Number.isNaN(dobRaw.getTime())
        ? dobRaw.toISOString().slice(0, 10)
        : null;
  const teRaw = typeof row?.training_experience === "string" ? row.training_experience.trim().toLowerCase() : "";
  const training = VALID_TRAINING_EXPERIENCE.has(teRaw) ? teRaw : null;
  return {
    biological_sex: sex,
    date_of_birth: dob && /^\d{4}-\d{2}-\d{2}$/.test(dob) ? dob : null,
    training_experience: training,
  };
}

/** Cached system prefix for AI Guide (/v1/chat); dynamic user context is a separate block. */
const AI_GUIDE_SYSTEM_BASE =
  "You are an expert peptide research advisor with deep knowledge of peptide pharmacology, biohacking protocols, dosing strategies, and interactions. Be direct, technical, and practical. Always include safety notes — these are research chemicals requiring physician oversight.";

/**
 * Anthropic Messages API: system as content blocks with prompt caching on the static prefix.
 * @param {{ system?: string }} body
 * @returns {Array<{ type: string, text: string, cache_control?: { type: string } }>}
 */
function buildChatSystemBlocks(body) {
  const dynamic = typeof body?.system === "string" ? body.system.trim() : "";
  const blocks = [
    { type: "text", text: AI_GUIDE_SYSTEM_BASE, cache_control: { type: "ephemeral" } },
  ];
  if (dynamic) blocks.push({ type: "text", text: dynamic });
  return blocks;
}

/**
 * Inject compact catalog (cacheable) before the latest user turn for prompt caching.
 * @param {Array<{ role: string, content: unknown }>} messages
 * @param {unknown} catalog
 */
function injectCatalogCacheIntoMessages(messages, catalog) {
  if (!Array.isArray(catalog) || catalog.length === 0) return messages;
  const out = messages.map((m) => ({ ...m }));
  for (let i = out.length - 1; i >= 0; i--) {
    if (out[i].role !== "user") continue;
    const c = out[i].content;
    const text = typeof c === "string" ? c : String(c ?? "");
    out[i] = {
      ...out[i],
      content: [
        {
          type: "text",
          text: `Peptide catalog (compact JSON for reference):\n${JSON.stringify(catalog)}`,
          cache_control: { type: "ephemeral" },
        },
        { type: "text", text },
      ],
    };
    break;
  }
  return out;
}

function stripePriceIdsConfigured(env) {
  const pro = String(env.STRIPE_PRICE_ID_PRO ?? "").trim();
  const elite = String(env.STRIPE_PRICE_ID_ELITE ?? "").trim();
  const goat = String(env.STRIPE_PRICE_ID_GOAT ?? "").trim();
  return Boolean(pro && elite && goat);
}

/** Map Stripe Price id → app plan tier (requires STRIPE_PRICE_ID_* on the Worker). */
function planFromStripePriceId(priceId, env) {
  const id = String(priceId ?? "").trim();
  if (!id || !stripePriceIdsConfigured(env)) return null;
  const pro = String(env.STRIPE_PRICE_ID_PRO).trim();
  const elite = String(env.STRIPE_PRICE_ID_ELITE).trim();
  const goat = String(env.STRIPE_PRICE_ID_GOAT).trim();
  if (id === pro) return "pro";
  if (id === elite) return "elite";
  if (id === goat) return "goat";
  return null;
}

function stripePriceIdForPaidPlan(plan, env) {
  if (!stripePriceIdsConfigured(env)) return "";
  const p = normalizePlanTier(plan, env);
  if (p === "pro") return String(env.STRIPE_PRICE_ID_PRO).trim();
  if (p === "elite") return String(env.STRIPE_PRICE_ID_ELITE).trim();
  if (p === "goat") return String(env.STRIPE_PRICE_ID_GOAT).trim();
  return "";
}

function tierPlanFromStripeSubscription(subscr, env) {
  if (!subscr || typeof subscr !== "object") return "entry";
  const st = typeof subscr.status === "string" ? subscr.status : "";
  if (st === "canceled" || st === "unpaid" || st === "incomplete_expired") return "entry";
  const priceId = subscr.items?.data?.[0]?.price?.id ?? subscr.items?.data?.[0]?.plan?.id;
  const fromPrice = planFromStripePriceId(priceId, env);
  if (fromPrice) return fromPrice;
  const m =
    (typeof subscr.metadata?.plan === "string" && subscr.metadata.plan.trim().toLowerCase()) ||
    (typeof subscr.items?.data?.[0]?.price?.metadata?.plan === "string" &&
      subscr.items.data[0].price.metadata.plan.trim().toLowerCase()) ||
    "";
  return normalizePlanTier(m, env);
}

function stripeSubscriptionStatusPriority(status) {
  const normalized = typeof status === "string" ? status.trim().toLowerCase() : "";
  if (normalized === "active") return 6;
  if (normalized === "trialing") return 5;
  if (normalized === "past_due") return 4;
  if (normalized === "unpaid") return 3;
  if (normalized === "incomplete") return 2;
  if (normalized === "incomplete_expired") return 1;
  if (normalized === "canceled") return 0;
  return -1;
}

function stripeSubscriptionPeriodEnd(subscr) {
  const value = typeof subscr?.current_period_end === "number" ? subscr.current_period_end : Number(subscr?.current_period_end);
  return Number.isFinite(value) ? value : 0;
}

function stripeSubscriptionCreatedAt(subscr) {
  const value = typeof subscr?.created === "number" ? subscr.created : Number(subscr?.created);
  return Number.isFinite(value) ? value : 0;
}

function pickPrimaryStripeSubscription(subscriptions, allowedStatuses = null, fallbackToAny = true) {
  const allowed = Array.isArray(allowedStatuses) ? new Set(allowedStatuses.map((s) => String(s).trim().toLowerCase())) : null;
  const list = Array.isArray(subscriptions) ? subscriptions.filter((sub) => sub && typeof sub === "object") : [];
  const eligible = allowed
    ? list.filter((sub) => allowed.has(String(sub.status ?? "").trim().toLowerCase()))
    : list;
  const pool = eligible.length > 0 ? eligible : fallbackToAny ? list : [];
  if (pool.length === 0) return null;
  return pool
    .slice()
    .sort((a, b) => {
      const statusDiff = stripeSubscriptionStatusPriority(b.status) - stripeSubscriptionStatusPriority(a.status);
      if (statusDiff !== 0) return statusDiff;
      const cancelDiff = Number(Boolean(a.cancel_at_period_end)) - Number(Boolean(b.cancel_at_period_end));
      if (cancelDiff !== 0) return cancelDiff;
      const periodDiff = stripeSubscriptionPeriodEnd(b) - stripeSubscriptionPeriodEnd(a);
      if (periodDiff !== 0) return periodDiff;
      return stripeSubscriptionCreatedAt(b) - stripeSubscriptionCreatedAt(a);
    })[0];
}

function stripePortalAllowedOrigin(env) {
  const origin = String(env.ALLOWED_ORIGIN ?? "").trim();
  if (!origin || origin === "*") return "https://pepguideiq.com";
  return origin.replace(/\/$/, "");
}

function normalizeStripePortalReturnUrl(rawReturnUrl, env) {
  const allowedOrigin = stripePortalAllowedOrigin(env);
  const fallback = `${allowedOrigin}/`;
  if (typeof rawReturnUrl !== "string" || !rawReturnUrl.trim()) return fallback;
  try {
    const url = new URL(rawReturnUrl.trim(), fallback);
    if (!/^https?:$/.test(url.protocol)) return fallback;
    if (url.origin !== allowedOrigin) return fallback;
    return url.toString();
  } catch {
    return fallback;
  }
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
 * @param {string} stripeKey
 * @param {string} path — e.g. `customers` or `subscriptions/sub_xxx` (no leading slash)
 * @param {Record<string, string>} fields — flat x-www-form-urlencoded keys (use `items[0][price]` style)
 */
async function stripeFormPost(stripeKey, path, fields) {
  const body = new URLSearchParams();
  for (const [k, v] of Object.entries(fields)) {
    if (v === undefined || v === null) continue;
    body.append(k, String(v));
  }
  const urlPath = path.startsWith("/") ? path.slice(1) : path;
  const r = await fetch(`https://api.stripe.com/v1/${urlPath}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${stripeKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
  const json = await r.json().catch(() => ({}));
  return { ok: r.ok, status: r.status, json };
}

/** @returns {string | null} */
function paymentIntentClientSecretFromSubscriptionPayload(obj) {
  const inv = obj?.latest_invoice;
  const pi =
    inv && typeof inv === "object"
      ? inv.payment_intent
      : typeof inv === "string"
        ? null
        : null;
  if (pi && typeof pi === "object" && typeof pi.client_secret === "string") return pi.client_secret;
  return null;
}

async function supabasePatchProfileStripeSubscriptionFields(supabaseUrl, serviceKey, userId, subscr) {
  if (!subscr || typeof subscr !== "object") return false;
  const priceId =
    (subscr.items?.data?.[0]?.price && typeof subscr.items.data[0].price.id === "string"
      ? subscr.items.data[0].price.id
      : null) ?? null;
  const st = typeof subscr.status === "string" ? subscr.status : "unknown";
  const sid = typeof subscr.id === "string" ? subscr.id : null;
  return supabasePatchProfile(supabaseUrl, serviceKey, userId, {
    stripe_subscription_id: sid,
    stripe_price_id: priceId,
    subscription_status: st,
  });
}

/**
 * @returns {Promise<{ ok: true, customer_id: string } | { ok: false, error: string }>}
 */
async function ensureStripeCustomerForUser(env, supabaseUrl, serviceKey, userId, stripeKey) {
  const pr = await fetch(
    `${supabaseUrl}/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}&select=email,name,stripe_customer_id`,
    {
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
      },
    }
  );
  const rows = await pr.json().catch(() => []);
  const profile = Array.isArray(rows) ? rows[0] : null;
  const existing =
    profile && typeof profile.stripe_customer_id === "string" ? profile.stripe_customer_id.trim() : "";
  if (existing) {
    return { ok: true, customer_id: existing };
  }
  const email = profile && typeof profile.email === "string" ? profile.email.trim() : "";
  if (!email) {
    return { ok: false, error: "Profile email missing" };
  }
  const name = profile && typeof profile.name === "string" ? profile.name.trim() : "";
  const { ok, json } = await stripeFormPost(stripeKey, "customers", {
    email,
    name,
    "metadata[supabase_user_id]": userId,
  });
  if (!ok || !json || typeof json.id !== "string") {
    const msg = json?.error?.message || json?.error || `Stripe customer create failed (${ok ? 200 : "err"})`;
    return { ok: false, error: String(msg) };
  }
  const patched = await supabasePatchProfile(supabaseUrl, serviceKey, userId, { stripe_customer_id: json.id });
  if (!patched) {
    return { ok: false, error: "Could not save Stripe customer id" };
  }
  return { ok: true, customer_id: json.id };
}

/**
 * Returns create-subscription JSON: client_secret when payment is required, or syncs Supabase when already active/trialing.
 */
async function respondStripeCreateSubscriptionPayload(
  env,
  supabaseUrl,
  serviceKey,
  userId,
  customerId,
  stripeKey,
  subJson,
  cors
) {
  const secret = paymentIntentClientSecretFromSubscriptionPayload(subJson);
  const sid = typeof subJson.id === "string" ? subJson.id : "";
  const st = typeof subJson.status === "string" ? subJson.status : "";
  if (secret) {
    return jsonResponse({ client_secret: secret, subscription_id: sid || null, status: st }, 200, cors);
  }
  if (["active", "trialing"].includes(st) && sid) {
    const full = await fetchStripeSubscriptionExpanded(stripeKey, sid);
    if (full) {
      const plan = tierPlanFromStripeSubscription(full, env);
      await supabaseSyncUserPlanAndCustomer(env, supabaseUrl, serviceKey, userId, plan, customerId);
      await supabasePatchProfileStripeSubscriptionFields(supabaseUrl, serviceKey, userId, full);
    }
    return jsonResponse(
      {
        client_secret: null,
        subscription_id: sid,
        status: st,
        no_payment_needed: true,
      },
      200,
      cors
    );
  }
  return jsonResponse(
    {
      error:
        "No payment client_secret from Stripe — subscription may still be incomplete. Check the Stripe Dashboard or try again.",
    },
    502,
    cors
  );
}

async function handleStripeCreateCustomer(request, env, cors) {
  if (!supabaseAuthReady(env)) {
    return jsonResponse({ error: "SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set on the Worker" }, 503, cors);
  }
  const stripeKey = env.STRIPE_SECRET_KEY ?? "";
  if (!stripeKey) {
    return jsonResponse({ error: "STRIPE_SECRET_KEY is not set on the Worker" }, 503, cors);
  }
  const { data: user, error } = await getSessionUser(env, request.headers.get("Authorization"));
  if (error || !user?.sub) {
    return jsonResponse({ error: "Unauthorized" }, 401, cors);
  }
  const userId = user.sub;
  const supabaseUrl = (env.SUPABASE_URL ?? "").replace(/\/$/, "");
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  const ensured = await ensureStripeCustomerForUser(env, supabaseUrl, serviceKey, userId, stripeKey);
  if (!ensured.ok) {
    return jsonResponse({ error: ensured.error }, 400, cors);
  }
  return jsonResponse({ customer_id: ensured.customer_id }, 200, cors);
}

async function handleStripeCreateSubscription(request, env, cors) {
  if (!supabaseAuthReady(env)) {
    return jsonResponse({ error: "SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set on the Worker" }, 503, cors);
  }
  const stripeKey = env.STRIPE_SECRET_KEY ?? "";
  if (!stripeKey) {
    return jsonResponse({ error: "STRIPE_SECRET_KEY is not set on the Worker" }, 503, cors);
  }
  if (!stripePriceIdsConfigured(env)) {
    log(env, "error", "stripe_price_ids_missing", {});
    return jsonResponse({ error: "Missing Stripe price configuration" }, 500, cors);
  }
  const { data: sessionUser, error: authErr } = await getSessionUser(env, request.headers.get("Authorization"));
  if (authErr || !sessionUser?.sub) {
    return jsonResponse({ error: "Unauthorized" }, 401, cors);
  }
  const userId = sessionUser.sub;

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400, cors);
  }
  const planRaw = typeof body?.plan === "string" ? body.plan.trim().toLowerCase() : "";
  const plan = normalizePlanTier(planRaw, env);
  if (!["pro", "elite", "goat"].includes(plan)) {
    return jsonResponse({ error: "plan must be pro, elite, or goat" }, 400, cors);
  }
  let priceId = typeof body?.price_id === "string" ? body.price_id.trim() : "";
  if (!priceId) {
    priceId = stripePriceIdForPaidPlan(plan, env);
  }
  if (!priceId) {
    return jsonResponse({ error: "Missing price_id" }, 400, cors);
  }
  const mapped = planFromStripePriceId(priceId, env);
  if (mapped && mapped !== plan) {
    return jsonResponse({ error: "price_id does not match plan" }, 400, cors);
  }

  const supabaseUrl = (env.SUPABASE_URL ?? "").replace(/\/$/, "");
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY ?? "";

  const ensured = await ensureStripeCustomerForUser(env, supabaseUrl, serviceKey, userId, stripeKey);
  if (!ensured.ok) {
    return jsonResponse({ error: ensured.error }, 400, cors);
  }
  const customerId = ensured.customer_id;

  const qs = new URLSearchParams({ customer: customerId, limit: "20", status: "all" });
  qs.append("expand[]", "data.items.data.price");
  const listRes = await fetch(`https://api.stripe.com/v1/subscriptions?${qs}`, {
    headers: { Authorization: `Bearer ${stripeKey}` },
  });
  const listJson = await listRes.json().catch(() => ({}));
  const subs = Array.isArray(listJson.data) ? listJson.data : [];
  const existing = pickPrimaryStripeSubscription(subs, ["active", "trialing", "past_due", "unpaid"], false);

  const expandFields = {
    "metadata[plan]": plan,
    payment_behavior: "default_incomplete",
    "payment_settings[save_default_payment_method]": "on_subscription",
  };

  if (existing && typeof existing.id === "string") {
    const item0 = existing.items?.data?.[0];
    const itemId = item0 && typeof item0.id === "string" ? item0.id : "";
    if (!itemId) {
      return jsonResponse({ error: "Could not read subscription item id" }, 502, cors);
    }
    const form = {
      "items[0][id]": itemId,
      "items[0][price]": priceId,
      proration_behavior: "create_prorations",
      ...expandFields,
    };
    const formBody = new URLSearchParams();
    for (const [k, v] of Object.entries(form)) {
      formBody.append(k, String(v));
    }
    formBody.append("expand[]", "latest_invoice.payment_intent");
    const up = await fetch(`https://api.stripe.com/v1/subscriptions/${encodeURIComponent(existing.id)}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formBody,
    });
    const subJson = await up.json().catch(() => ({}));
    if (!up.ok) {
      return jsonResponse(
        { error: subJson.error?.message || subJson.error || `Stripe error (${up.status})` },
        up.status >= 400 && up.status < 600 ? up.status : 502,
        cors
      );
    }
    return respondStripeCreateSubscriptionPayload(
      env,
      supabaseUrl,
      serviceKey,
      userId,
      customerId,
      stripeKey,
      subJson,
      cors
    );
  }

  const createBody = new URLSearchParams();
  createBody.append("customer", customerId);
  createBody.append("items[0][price]", priceId);
  createBody.append("payment_behavior", "default_incomplete");
  createBody.append("payment_settings[save_default_payment_method]", "on_subscription");
  createBody.append("metadata[plan]", plan);
  createBody.append("expand[]", "latest_invoice.payment_intent");
  const cr = await fetch("https://api.stripe.com/v1/subscriptions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${stripeKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: createBody,
  });
  const subJson = await cr.json().catch(() => ({}));
  if (!cr.ok) {
    return jsonResponse(
      { error: subJson.error?.message || subJson.error || `Stripe error (${cr.status})` },
      cr.status >= 400 && cr.status < 600 ? cr.status : 502,
      cors
    );
  }
  return respondStripeCreateSubscriptionPayload(
    env,
    supabaseUrl,
    serviceKey,
    userId,
    customerId,
    stripeKey,
    subJson,
    cors
  );
}

async function handleStripePortalSession(request, env, cors) {
  if (!supabaseAuthReady(env)) {
    return jsonResponse({ error: "SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set on the Worker" }, 503, cors);
  }
  const stripeKey = env.STRIPE_SECRET_KEY ?? "";
  if (!stripeKey) {
    return jsonResponse({ error: "STRIPE_SECRET_KEY is not set on the Worker" }, 503, cors);
  }
  const { data: sessionUser, error: authErr } = await getSessionUser(env, request.headers.get("Authorization"));
  if (authErr || !sessionUser?.sub) {
    return jsonResponse({ error: "Unauthorized" }, 401, cors);
  }
  const userId = sessionUser.sub;
  let body;
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  const returnUrl = normalizeStripePortalReturnUrl(body?.return_url, env);

  const supabaseUrl = (env.SUPABASE_URL ?? "").replace(/\/$/, "");
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  const pr = await fetch(
    `${supabaseUrl}/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}&select=stripe_customer_id`,
    {
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
      },
    }
  );
  const rows = await pr.json().catch(() => []);
  const profile = Array.isArray(rows) ? rows[0] : null;
  const customerId =
    profile && typeof profile.stripe_customer_id === "string" ? profile.stripe_customer_id.trim() : "";
  if (!customerId) {
    return jsonResponse({ error: "No Stripe customer on file" }, 400, cors);
  }

  const { ok, json } = await stripeFormPost(stripeKey, "billing_portal/sessions", {
    customer: customerId,
    return_url: returnUrl,
  });
  if (!ok || !json?.url) {
    return jsonResponse({ error: json?.error?.message || json?.error || "Portal session failed" }, 502, cors);
  }
  return jsonResponse({ url: json.url }, 200, cors);
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
          msg:
            "Handle must be 3–32 characters: letters, numbers, underscore, period, or hyphen; no ..; cannot start or end with .",
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

async function stripeCancelSubscriptionById(env, stripeKey, subscriptionId) {
  const sid = typeof subscriptionId === "string" ? subscriptionId.trim() : "";
  if (!sid || !stripeKey) return;
  const r = await fetch(`https://api.stripe.com/v1/subscriptions/${encodeURIComponent(sid)}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${stripeKey}` },
  });
  if (!r.ok && r.status !== 404) {
    log(env, "warn", "stripe_subscription_delete_failed", { subscriptionId: sid, status: r.status });
  }
}

async function stripeCancelAllSubscriptionsForCustomer(env, stripeKey, customerId) {
  const cid = typeof customerId === "string" ? customerId.trim() : "";
  if (!cid || !stripeKey) return;
  const qs = new URLSearchParams({ customer: cid, limit: "100" });
  const listRes = await fetch(`https://api.stripe.com/v1/subscriptions?${qs}`, {
    headers: { Authorization: `Bearer ${stripeKey}` },
  });
  const j = await listRes.json().catch(() => ({}));
  const subs = Array.isArray(j?.data) ? j.data : [];
  for (const s of subs) {
    const id = typeof s?.id === "string" ? s.id.trim() : "";
    if (!id) continue;
    const st = typeof s?.status === "string" ? s.status : "";
    if (st === "canceled" || st === "incomplete_expired") continue;
    await stripeCancelSubscriptionById(env, stripeKey, id);
  }
}

/** Best-effort: stack photos, vials, avatars, and member profile uploads use keys under `${userId}/`. */
async function deleteUserR2Prefix(env, bucket, userId) {
  const prefix = `${userId}/`;
  let cursor;
  for (let page = 0; page < 200; page++) {
    let listed;
    try {
      listed = await bucket.list({ prefix, limit: 1000, ...(cursor ? { cursor } : {}) });
    } catch (e) {
      log(env, "warn", "r2_list_failed_account_delete", { userId, message: String(e) });
      break;
    }
    const objects = Array.isArray(listed?.objects) ? listed.objects : [];
    for (const obj of objects) {
      const key = obj && typeof obj.key === "string" ? obj.key : "";
      if (!key || !key.startsWith(prefix)) continue;
      try {
        await bucket.delete(key);
      } catch (e) {
        log(env, "warn", "r2_delete_failed_account_delete", { key, message: String(e) });
      }
    }
    if (!listed?.truncated) break;
    cursor = listed.cursor;
  }
}

/**
 * Authenticated POST — cancel Stripe subs, remove R2 objects for this user, then delete auth user (DB cascades).
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
  const stripeKey = typeof env.STRIPE_SECRET_KEY === "string" ? env.STRIPE_SECRET_KEY.trim() : "";

  const pr = await fetch(
    `${supabaseUrl}/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}&select=stripe_customer_id,stripe_subscription_id`,
    {
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
      },
    }
  );
  const rows = await pr.json().catch(() => []);
  const row = Array.isArray(rows) ? rows[0] : null;
  const customerId =
    row && typeof row.stripe_customer_id === "string" ? row.stripe_customer_id.trim() : "";
  const subscriptionId =
    row && typeof row.stripe_subscription_id === "string" ? row.stripe_subscription_id.trim() : "";

  if (stripeKey) {
    if (subscriptionId) {
      await stripeCancelSubscriptionById(env, stripeKey, subscriptionId);
    }
    if (customerId) {
      await stripeCancelAllSubscriptionsForCustomer(env, stripeKey, customerId);
    }
  }

  const bucket = env.STACK_PHOTOS;
  if (bucket) {
    await deleteUserR2Prefix(env, bucket, userId);
  }

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
  return jsonResponse({ success: true }, 200, cors);
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

  const plan = await fetchProfilePlan(supabaseUrl, serviceKey, userId, env);
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
    limit: "20",
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
  const subscr = pickPrimaryStripeSubscription(list);
  if (!subscr) {
    return emptyResponse();
  }

  const cpe = subscr.current_period_end;
  const cpeNum = typeof cpe === "number" ? cpe : 0;

  return jsonResponse({
    current_period_end: cpeNum,
    cancel_at_period_end: Boolean(subscr.cancel_at_period_end),
    status: typeof subscr.status === "string" ? subscr.status : "unknown",
    plan: tierPlanFromStripeSubscription(subscr, env),
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

  const qs = new URLSearchParams({ customer: customerId, limit: "20", status: "all" });
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
  const subscr = pickPrimaryStripeSubscription(list, ["active", "trialing", "past_due"], false);
  if (!subscr || typeof subscr.current_period_end !== "number") {
    return jsonResponse({ error: "No active subscription to schedule against" }, 400, cors);
  }

  const currentTier = tierPlanFromStripeSubscription(subscr, env);
  const activeLike = ["active", "trialing", "past_due"].includes(subscr.status);
  if (!activeLike) {
    return jsonResponse({ error: "Subscription is not in a state that allows scheduling" }, 400, cors);
  }
  if (TIER_RANK[target] >= TIER_RANK[currentTier]) {
    return jsonResponse({ error: "target_plan must be lower than current plan" }, 400, cors);
  }

  const subscriptionId = typeof subscr.id === "string" ? subscr.id.trim() : "";
  if (!subscriptionId) {
    return jsonResponse({ error: "No active subscription to schedule against" }, 400, cors);
  }

  const cancelBody = new URLSearchParams();
  cancelBody.set("cancel_at_period_end", "true");
  const cancelRes = await fetch(
    `https://api.stripe.com/v1/subscriptions/${encodeURIComponent(subscriptionId)}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: cancelBody.toString(),
    }
  );
  const cancelData = await cancelRes.json().catch(() => ({}));
  if (!cancelRes.ok) {
    return jsonResponse(
      {
        error:
          cancelData.error?.message ||
          cancelData.error ||
          `Stripe error (${cancelRes.status})`,
      },
      cancelRes.status >= 400 && cancelRes.status < 600 ? cancelRes.status : 502,
      cors
    );
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
  const profilePlan = await fetchProfilePlan(supabaseUrl, serviceKey, userId, env);
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
  if (size <= 0) {
    return jsonResponse({ error: "File is empty" }, 400, cors);
  }
  if (size > STACK_PHOTO_MAX_BYTES) {
    return jsonResponse({ error: "File too large — max 10MB" }, 413, cors);
  }

  const mime = typeof file.type === "string" ? file.type.trim().toLowerCase() : "";
  const ext = STACK_PHOTO_TYPES.get(mime);
  if (!ext) {
    return jsonResponse(
      { error: "Unsupported file type — use JPEG, PNG, WebP, or GIF" },
      415,
      cors
    );
  }

  const key = `${userId}/stack.${ext}`;
  let bytes;
  try {
    bytes = await file.arrayBuffer();
  } catch {
    return jsonResponse({ error: "Could not read file" }, 400, cors);
  }
  if (bytes.byteLength > STACK_PHOTO_MAX_BYTES) {
    return jsonResponse({ error: "File too large — max 10MB" }, 413, cors);
  }

  if (!imageMagicMatchesClaimedMime(bytes, mime)) {
    return jsonResponse({ error: "File content does not match declared image type" }, 415, cors);
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

  const url = privateStackPhotoUrl(request, key);
  return jsonResponse({ url, key, private: true }, 200, cors);
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
    const ct =
      (obj.httpMetadata && typeof obj.httpMetadata.contentType === "string" && obj.httpMetadata.contentType) ||
      contentTypeFromKey(key);
    return new Response(obj.body, {
      status: 200,
      headers: {
        ...cors,
        "Content-Type": ct,
        "Cache-Control": "private, max-age=31536000, immutable",
      },
    });
  } catch (e) {
    log(env, "error", "r2_get_failed", { message: String(e) });
    return new Response("Storage error", { status: 502, headers: cors });
  }
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** R2 keys allowed for public GET /avatars/{key} (member profile or legacy account avatar JPEG). */
const AVATAR_R2_KEY_RE = new RegExp(
  `^${UUID_RE.source.slice(1, -1)}/(?:member-profiles/${UUID_RE.source.slice(1, -1)}/avatar\\.jpg|avatar\\.jpg)$`
);

/**
 * @param {Request} request
 * @param {string} key
 */
function publicMemberAvatarUrl(request, key) {
  return `${new URL(request.url).origin}/avatars/${key}`;
}

/**
 * Canonical URL for private R2 reads (vial photos, stack shots, legacy stack photo).
 * The client must attach a Bearer token when fetching this URL.
 * @param {Request} request
 * @param {string} key
 */
function privateStackPhotoUrl(request, key) {
  return `${new URL(request.url).origin}/stack-photo?key=${encodeURIComponent(key)}`;
}

/**
 * Public GET — stream avatar from R2 for use in <img src> (key must match AVATAR_R2_KEY_RE).
 */
async function handleGetAvatar(request, env, cors) {
  const bucket = env.STACK_PHOTOS;
  if (!bucket) {
    log(env, "error", "avatar_r2_bucket_missing", {});
    return jsonResponse(
      { error: "R2 bucket STACK_PHOTOS is not bound on the Worker" },
      503,
      cors
    );
  }
  const url = new URL(request.url);
  const prefix = "/avatars/";
  if (!url.pathname.startsWith(prefix)) {
    return new Response("Not found", { status: 404, headers: cors });
  }
  const key = url.pathname.slice(prefix.length);
  if (!key || key.includes("..") || !AVATAR_R2_KEY_RE.test(key)) {
    return new Response("Forbidden", { status: 403, headers: cors });
  }
  try {
    const obj = await bucket.get(key);
    if (!obj) {
      return new Response("Not found", { status: 404, headers: cors });
    }
    const ct =
      (obj.httpMetadata && typeof obj.httpMetadata.contentType === "string" && obj.httpMetadata.contentType) ||
      contentTypeFromKey(key);
    const isHead = request.method === "HEAD";
    return new Response(isHead ? null : obj.body, {
      status: 200,
      headers: {
        ...cors,
        "Content-Type": ct,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (e) {
    log(env, "error", "r2_avatar_get_failed", { message: String(e) });
    return new Response("Storage error", { status: 502, headers: cors });
  }
}

const MEMBER_PROFILE_ALLOWED_LANGUAGES = new Set(["en", "es", "pt-BR", "fr", "de", "ja", "zh-Hans"]);

const MEMBER_PROFILE_SHIFT_SCHEDULES = new Set(["days", "swings", "mids", "nights", "rotating"]);

/** Aligned with `member_profiles_handle_format_chk`: 3–32, no .., alphanumeric ends, [a-z0-9_.-] middle. */
const MEMBER_HANDLE_RE = /^(?!.*\.\.)(?!\.)[a-zA-Z0-9](?:[a-zA-Z0-9_.-]{1,30}[a-zA-Z0-9])$/;

/** Lowercase slug only — same as DB `handle` after backfill; used for exact search before broad ILIKE. */
const MEMBER_HANDLE_SLUG_RE = /^[a-z0-9][a-z0-9_.-]*[a-z0-9]$/;

const MEMBER_EXPERIENCE_LEVELS = new Set(["beginner", "intermediate", "advanced", "elite"]);

/** Trim and strip all leading `@` (preserve casing for display_handle / validation). */
function stripHandleAtForApi(v) {
  let t = String(v ?? "").trim();
  while (t.startsWith("@")) t = t.slice(1).trim();
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
  const stripped = stripHandleAtForApi(raw);
  const excludeRaw = url.searchParams.get("exclude") ?? "";
  const excludeProfileId = UUID_RE.test(excludeRaw) ? excludeRaw : undefined;
  if (!stripped) {
    return jsonResponse({ available: false, reason: "empty" }, 200, cors);
  }
  if (!MEMBER_HANDLE_RE.test(stripped)) {
    return jsonResponse({ available: false, reason: "invalid_format" }, 200, cors);
  }
  const h = stripped.toLowerCase();
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
 * One PostgREST GET for member_profiles list (service role; not the browser JWT).
 * @param {string} attemptLabel "1" | "2" for logs
 * @returns {Promise<{ ok: true, rows: object[] } | { ok: false, status: number, errorBody: string }>}
 */
async function fetchMemberProfilesListOnce(env, supabaseUrl, serviceKey, userId, attemptLabel) {
  const sel = `${supabaseUrl}/rest/v1/member_profiles?user_id=eq.${encodeURIComponent(
    userId
  )}&select=id,user_id,display_name,avatar_url,is_default,created_at,city,state,country,language,shift_schedule,wake_time,handle,display_handle,demo_sessions_shown,bio,instagram_handle,tiktok_handle,facebook_handle,snapchat_handle,linkedin_handle,x_handle,youtube_handle,rumble_handle,experience_level,goals,body_scan_r2_key,body_scan_uploaded_at,body_scan_ocr_pending,progress_photo_front_r2_key,progress_photo_front_at,progress_photo_side_r2_key,progress_photo_side_at,progress_photo_back_r2_key,progress_photo_back_at,progress_photo_sets,current_streak&order=created_at.asc`;
  try {
    const res = await fetch(sel, {
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
      },
    });
    const raw = await res.text();
    /** @type {unknown} */
    let parsed = null;
    if (raw) {
      try {
        parsed = JSON.parse(raw);
      } catch (parseErr) {
        log(env, "warn", "member_profile_get_list_json_parse_error", {
          userId,
          status: res.status,
          attempt: attemptLabel,
          bodyPreview: raw.slice(0, 2000),
          parseMessage: parseErr && typeof parseErr === "object" && "message" in parseErr ? parseErr.message : String(parseErr),
        });
        return { ok: false, status: res.status, errorBody: raw.slice(0, 2000) };
      }
    }
    if (!res.ok) {
      log(env, "warn", "member_profile_get_list_postgrest_non_ok", {
        userId,
        status: res.status,
        attempt: attemptLabel,
        bodyPreview: raw.slice(0, 2000),
      });
      return { ok: false, status: res.status, errorBody: raw.slice(0, 2000) };
    }
    if (!Array.isArray(parsed)) {
      log(env, "warn", "member_profile_get_list_not_array", {
        userId,
        attempt: attemptLabel,
        typeofParsed: typeof parsed,
        bodyPreview: typeof raw === "string" ? raw.slice(0, 800) : "",
      });
      return { ok: false, status: res.status, errorBody: typeof raw === "string" ? raw.slice(0, 800) : "" };
    }
    return { ok: true, rows: parsed };
  } catch (err) {
    const msg = err && typeof err === "object" && "message" in err ? String(err.message) : String(err);
    log(env, "error", "member_profile_get_list_fetch_threw", {
      userId,
      attempt: attemptLabel,
      message: msg,
    });
    return { ok: false, status: 0, errorBody: msg };
  }
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

  const out = await fetchMemberProfilesListOnce(env, supabaseUrl, serviceKey, userId, "1");
  if (!out.ok) {
    const upstream = out.status;
    const clientStatus =
      upstream === 0 || (upstream >= 500 && upstream < 600)
        ? 503
        : upstream >= 400 && upstream < 500
          ? upstream
          : 502;
    log(env, "warn", "member_profile_get_list_failed", {
      userId,
      upstreamStatus: upstream,
      clientStatus,
      detailPreview: out.errorBody.slice(0, 500),
    });
    return jsonResponse(
      {
        error: "Could not load profiles",
        upstream_status: upstream,
        detail: out.errorBody.slice(0, 800),
      },
      clientStatus,
      cors
    );
  }
  return jsonResponse({ profiles: out.rows }, 200, cors);
}

/**
 * @param {string} supabaseUrl
 * @param {string} serviceKey
 * @param {string} userId
 * @param {string} profileId
 */
async function memberProfileOwnedByUser(supabaseUrl, serviceKey, userId, profileId) {
  const res = await fetch(
    `${supabaseUrl}/rest/v1/member_profiles?id=eq.${encodeURIComponent(profileId)}&user_id=eq.${encodeURIComponent(
      userId
    )}&select=id`,
    {
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
      },
    }
  );
  const rows = await res.json().catch(() => []);
  return res.ok && Array.isArray(rows) && rows.length === 1;
}

/** Strip characters that break PostgREST `or=(…ilike.*…*)` filters. */
function sanitizeMemberSearchToken(q) {
  return String(q ?? "")
    .toLowerCase()
    .replace(/[%_*(),]/g, "")
    .trim()
    .slice(0, 64);
}

/**
 * GET /member-profiles/search?q=… — discover other users' member profiles (auth).
 */
async function handleSearchMemberProfiles(request, env, cors) {
  if (!supabaseAuthReady(env)) {
    return jsonResponse({ error: "Supabase not configured" }, 503, cors);
  }
  const { data: sessionUser, error: authErr } = await getSessionUser(env, request.headers.get("Authorization"));
  if (authErr || !sessionUser?.sub) {
    return jsonResponse({ error: "Unauthorized" }, 401, cors);
  }
  const userId = sessionUser.sub;
  const url = new URL(request.url);
  const rawQ = url.searchParams.get("q") ?? url.searchParams.get("query") ?? "";
  let q = String(rawQ).trim();
  while (q.startsWith("@")) q = q.slice(1).trim();
  q = q.toLowerCase();
  const safe = sanitizeMemberSearchToken(q);
  if (!safe) {
    return jsonResponse({ profiles: [] }, 200, cors);
  }

  const supabaseUrl = (env.SUPABASE_URL ?? "").replace(/\/$/, "");
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  const headers = {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
  };

  let rows = [];
  if (safe.length >= 3 && MEMBER_HANDLE_SLUG_RE.test(safe)) {
    const exactUrl = `${supabaseUrl}/rest/v1/member_profiles?user_id=neq.${encodeURIComponent(
      userId
    )}&handle=eq.${encodeURIComponent(safe)}&select=id,handle,display_handle,display_name,avatar_url,bio,user_id&limit=20`;
    const er = await fetch(exactUrl, { headers });
    const exactRows = await er.json().catch(() => []);
    if (er.ok && Array.isArray(exactRows) && exactRows.length > 0) {
      rows = exactRows;
    }
  }

  if (rows.length === 0) {
    const orClause = `(handle.ilike.*${safe}*,display_handle.ilike.*${safe}*,display_name.ilike.*${safe}*)`;
    const sel = `${supabaseUrl}/rest/v1/member_profiles?user_id=neq.${encodeURIComponent(
      userId
    )}&or=${encodeURIComponent(orClause)}&select=id,handle,display_handle,display_name,avatar_url,bio,user_id&limit=20`;

    const res = await fetch(sel, { headers });
    rows = await res.json().catch(() => []);
    if (!res.ok || !Array.isArray(rows)) {
      log(env, "warn", "member_profile_search_failed", { userId, status: res.status });
      return jsonResponse({ error: "Search failed" }, 502, cors);
    }
  }

  const userIds = [...new Set(rows.map((r) => r?.user_id).filter((x) => typeof x === "string" && x))];
  /** @type {Record<string, string>} */
  const planByUser = {};
  if (userIds.length > 0) {
    const inList = userIds.join(",");
    const pr = await fetch(`${supabaseUrl}/rest/v1/profiles?select=id,plan&id=in.(${inList})`, {
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
      },
    });
    const planRows = await pr.json().catch(() => []);
    if (Array.isArray(planRows)) {
      for (const p of planRows) {
        if (p && typeof p.id === "string") {
          planByUser[p.id] = normalizePlanTier(typeof p.plan === "string" ? p.plan : "", env);
        }
      }
    }
  }

  const profiles = rows.map((row) => ({
    ...row,
    plan: planByUser[row.user_id] ?? "entry",
  }));

  return jsonResponse({ profiles }, 200, cors);
}

/**
 * Optional active fast visible on public profile (`public_visible` + `ended_at` null).
 * @param {string} supabaseUrl
 * @param {string} serviceKey
 * @param {string} memberProfileId
 * @returns {Promise<{ fast_type: string, started_at: string, target_hours: number } | null>}
 */
async function fetchPublicActiveFastForProfile(supabaseUrl, serviceKey, memberProfileId) {
  const fastUrl = `${supabaseUrl}/rest/v1/member_fasts?member_profile_id=eq.${encodeURIComponent(
    memberProfileId
  )}&ended_at=is.null&public_visible=eq.true&select=fast_type,started_at,target_hours&limit=1`;
  const fr = await fetch(fastUrl, {
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
    },
  });
  const fastRows = await fr.json().catch(() => []);
  if (!fr.ok || !Array.isArray(fastRows) || !fastRows[0]) return null;
  const f = fastRows[0];
  if (typeof f.fast_type !== "string" || typeof f.started_at !== "string") return null;
  const th = typeof f.target_hours === "number" ? f.target_hours : Number(f.target_hours);
  if (!Number.isFinite(th)) return null;
  return { fast_type: f.fast_type, started_at: f.started_at, target_hours: th };
}

/**
 * Public follow counts for a member profile.
 * @param {string} supabaseUrl
 * @param {string} serviceKey
 * @param {string} memberProfileId
 * @returns {Promise<{ follower_count: number, following_count: number } | null>}
 */
async function fetchFollowCountsForProfile(supabaseUrl, serviceKey, memberProfileId) {
  const rpcUrl = `${supabaseUrl}/rest/v1/rpc/get_follow_counts`;
  const res = await fetch(rpcUrl, {
    method: "POST",
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ p_profile_id: memberProfileId }),
  });
  const row = await res.json().catch(() => null);
  if (!res.ok || !row || typeof row !== "object") return null;
  const followerCount = Number(row.follower_count);
  const followingCount = Number(row.following_count);
  return {
    follower_count: Number.isFinite(followerCount) && followerCount >= 0 ? followerCount : 0,
    following_count: Number.isFinite(followingCount) && followingCount >= 0 ? followingCount : 0,
  };
}

/**
 * Public stack share id for a member profile when a share link already exists.
 * @param {string} supabaseUrl
 * @param {string} serviceKey
 * @param {string} memberProfileId
 * @returns {Promise<string | null>}
 */
async function fetchPublicStackShareIdForProfile(supabaseUrl, serviceKey, memberProfileId) {
  const res = await fetch(
    `${supabaseUrl}/rest/v1/user_stacks?profile_id=eq.${encodeURIComponent(memberProfileId)}&select=share_id&limit=1`,
    {
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
      },
    }
  );
  const rows = await res.json().catch(() => []);
  if (!res.ok || !Array.isArray(rows) || !rows[0]) return null;
  const shareId = typeof rows[0].share_id === "string" ? rows[0].share_id.trim() : "";
  return shareId || null;
}

/**
 * GET /member-profiles/public?handle=foo — no auth. Public member card fields for a unique @handle.
 */
async function handleGetMemberProfilePublic(request, env, cors) {
  if (!supabaseAuthReady(env)) {
    return jsonResponse({ error: "Supabase not configured" }, 503, cors);
  }
  const url = new URL(request.url);
  const raw = String(url.searchParams.get("handle") ?? url.searchParams.get("h") ?? "").trim();
  const stripped = stripHandleAtForApi(raw);
  if (!stripped || stripped.length < 3) {
    return jsonResponse({ error: "Invalid handle" }, 400, cors);
  }

  const supabaseUrl = (env.SUPABASE_URL ?? "").replace(/\/$/, "");
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  const rpcUrl = `${supabaseUrl}/rest/v1/rpc/member_profile_public_by_handle_lookup`;
  const res = await fetch(rpcUrl, {
    method: "POST",
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ handle_query: raw }),
  });
  const rows = await res.json().catch(() => []);
  if (!res.ok || !Array.isArray(rows)) {
    log(env, "warn", "member_profile_public_failed", { status: res.status });
    return jsonResponse({ error: "Lookup failed" }, 502, cors);
  }
  const row = rows[0];
  if (!row || typeof row.handle !== "string" || !row.handle) {
    return jsonResponse({ profile: null }, 404, cors);
  }

  let plan = "entry";
  const uid = typeof row.user_id === "string" ? row.user_id : "";
  if (uid) {
    const pr = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${encodeURIComponent(uid)}&select=plan`, {
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
      },
    });
    const planRows = await pr.json().catch(() => []);
    if (Array.isArray(planRows) && planRows[0] && typeof planRows[0].plan === "string") {
      plan = normalizePlanTier(planRows[0].plan, env);
    }
  }

  let publicFast = null;
  let followCounts = null;
  let publicStackShareId = null;
  if (typeof row.id === "string" && row.id) {
    try {
      publicFast = await fetchPublicActiveFastForProfile(supabaseUrl, serviceKey, row.id);
    } catch {
      publicFast = null;
    }
    try {
      followCounts = await fetchFollowCountsForProfile(supabaseUrl, serviceKey, row.id);
    } catch {
      followCounts = null;
    }
    try {
      publicStackShareId = await fetchPublicStackShareIdForProfile(supabaseUrl, serviceKey, row.id);
    } catch {
      publicStackShareId = null;
    }
  }

  const profile = {
    id: row.id,
    handle: row.handle,
    display_handle: row.display_handle,
    display_name: row.display_name,
    avatar_url: row.avatar_url,
    bio: row.bio,
    instagram_handle: row.instagram_handle,
    tiktok_handle: row.tiktok_handle,
    facebook_handle: row.facebook_handle,
    snapchat_handle: row.snapchat_handle,
    linkedin_handle: row.linkedin_handle,
    x_handle: row.x_handle,
    youtube_handle: row.youtube_handle,
    rumble_handle: row.rumble_handle,
    experience_level: row.experience_level,
    goals: row.goals,
    city: row.city,
    state: row.state,
    country: row.country,
    shift_schedule: row.shift_schedule,
    plan,
    follower_count: followCounts?.follower_count ?? 0,
    following_count: followCounts?.following_count ?? 0,
    public_stack_share_id: publicStackShareId,
    public_fast: publicFast,
  };

  return jsonResponse({ profile }, 200, cors);
}

/**
 * POST /member-follows — body { follower_profile_id, following_profile_id }
 */
async function handlePostMemberFollow(request, env, cors) {
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
    return jsonResponse({ error: "Invalid JSON body" }, 400, cors);
  }
  const followerId =
    typeof body.follower_profile_id === "string" ? body.follower_profile_id.trim() : "";
  const followingId =
    typeof body.following_profile_id === "string" ? body.following_profile_id.trim() : "";
  if (!UUID_RE.test(followerId) || !UUID_RE.test(followingId)) {
    return jsonResponse({ error: "Invalid profile id" }, 400, cors);
  }
  if (followerId === followingId) {
    return jsonResponse({ error: "Cannot follow yourself" }, 400, cors);
  }

  const supabaseUrl = (env.SUPABASE_URL ?? "").replace(/\/$/, "");
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  const ok = await memberProfileOwnedByUser(supabaseUrl, serviceKey, userId, followerId);
  if (!ok) {
    return jsonResponse({ error: "Forbidden" }, 403, cors);
  }

  const ins = await fetch(`${supabaseUrl}/rest/v1/member_follows`, {
    method: "POST",
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify({ follower_id: followerId, following_id: followingId }),
  });
  const text = await ins.text().catch(() => "");
  let parsed = null;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    parsed = null;
  }
  if (ins.ok && Array.isArray(parsed) && parsed[0] && typeof parsed[0].id === "string") {
    return jsonResponse({ ok: true, follow_id: parsed[0].id }, 200, cors);
  }
  const code =
    parsed && typeof parsed === "object" && !Array.isArray(parsed) && "code" in parsed
      ? String(parsed.code)
      : "";
  if (ins.status === 409 || code === "23505") {
    return jsonResponse({ ok: true, already: true }, 200, cors);
  }
  log(env, "warn", "member_follow_insert_failed", { status: ins.status, body: String(text).slice(0, 200) });
  return jsonResponse({ error: "Could not follow" }, ins.status >= 400 ? ins.status : 502, cors);
}

/**
 * DELETE /member-follows — body { follower_profile_id, following_profile_id }
 */
async function handleDeleteMemberFollow(request, env, cors) {
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
    return jsonResponse({ error: "Invalid JSON body" }, 400, cors);
  }
  const followerId =
    typeof body.follower_profile_id === "string" ? body.follower_profile_id.trim() : "";
  const followingId =
    typeof body.following_profile_id === "string" ? body.following_profile_id.trim() : "";
  if (!UUID_RE.test(followerId) || !UUID_RE.test(followingId)) {
    return jsonResponse({ error: "Invalid profile id" }, 400, cors);
  }

  const supabaseUrl = (env.SUPABASE_URL ?? "").replace(/\/$/, "");
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  const owned = await memberProfileOwnedByUser(supabaseUrl, serviceKey, userId, followerId);
  if (!owned) {
    return jsonResponse({ error: "Forbidden" }, 403, cors);
  }

  const del = await fetch(
    `${supabaseUrl}/rest/v1/member_follows?follower_id=eq.${encodeURIComponent(
      followerId
    )}&following_id=eq.${encodeURIComponent(followingId)}`,
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
    log(env, "warn", "member_follow_delete_failed", { status: del.status });
    return jsonResponse({ error: "Could not unfollow" }, 502, cors);
  }
  return jsonResponse({ ok: true }, 200, cors);
}

/**
 * GET /member-follows/following?profile_id=… — follower row must belong to auth user.
 */
async function handleGetMemberFollowFollowing(request, env, cors) {
  if (!supabaseAuthReady(env)) {
    return jsonResponse({ error: "Supabase not configured" }, 503, cors);
  }
  const { data: sessionUser, error: authErr } = await getSessionUser(env, request.headers.get("Authorization"));
  if (authErr || !sessionUser?.sub) {
    return jsonResponse({ error: "Unauthorized" }, 401, cors);
  }
  const userId = sessionUser.sub;
  const url = new URL(request.url);
  const profileId = (url.searchParams.get("profile_id") ?? "").trim();
  if (!UUID_RE.test(profileId)) {
    return jsonResponse({ error: "Invalid profile_id" }, 400, cors);
  }

  const supabaseUrl = (env.SUPABASE_URL ?? "").replace(/\/$/, "");
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  const owned = await memberProfileOwnedByUser(supabaseUrl, serviceKey, userId, profileId);
  if (!owned) {
    return jsonResponse({ error: "Forbidden" }, 403, cors);
  }

  const res = await fetch(
    `${supabaseUrl}/rest/v1/member_follows?follower_id=eq.${encodeURIComponent(
      profileId
    )}&select=following_id`,
    {
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
      },
    }
  );
  const rows = await res.json().catch(() => []);
  if (!res.ok || !Array.isArray(rows)) {
    return jsonResponse({ error: "Could not load follows" }, 502, cors);
  }
  const following = rows
    .map((r) => (r && typeof r.following_id === "string" ? r.following_id : ""))
    .filter(Boolean);
  return jsonResponse({ following }, 200, cors);
}

const MEMBER_SOCIAL_HANDLE_MAX_LEN = 80;

function memberSocialTryDecode(s) {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

function memberSocialFirstPathSegment(raw) {
  const s = memberSocialTryDecode(String(raw ?? "").trim());
  if (!s) return "";
  return s.split("/")[0].split("?")[0].split("#")[0] ?? "";
}

/**
 * Normalize optional social handle fields for PATCH (mirror `src/lib/socialProfileLinks.js`).
 * @param {string} columnKey
 * @param {unknown} raw
 * @returns {string}
 */
function normalizeMemberSocialHandlePatch(columnKey, raw) {
  let s = typeof raw === "string" ? raw.trim() : "";
  if (!s) return "";

  switch (columnKey) {
    case "instagram_handle":
      s = s.replace(/^https?:\/\/(www\.)?instagram\.com\//i, "");
      s = s.replace(/^@+/, "");
      s = memberSocialFirstPathSegment(s);
      break;
    case "tiktok_handle":
      s = s.replace(/^https?:\/\/(www\.)?tiktok\.com\/@?/i, "");
      s = s.replace(/^@+/, "");
      s = memberSocialFirstPathSegment(s);
      break;
    case "facebook_handle":
      s = s.replace(/^https?:\/\/(www\.)?facebook\.com\//i, "");
      s = s.replace(/^@+/, "");
      s = memberSocialFirstPathSegment(s);
      break;
    case "snapchat_handle":
      s = s.replace(/^https?:\/\/(www\.)?snapchat\.com\/add\//i, "");
      s = s.replace(/^@+/, "");
      s = memberSocialFirstPathSegment(s);
      break;
    case "linkedin_handle":
      s = s.replace(/^https?:\/\/([a-z]{2,3}\.)?linkedin\.com\//i, "");
      s = s.replace(/^\/+/, "");
      if (!s) return "";
      {
        const lower = s.toLowerCase();
        if (lower.startsWith("in/")) {
          s = s.slice(3);
        } else if (lower.startsWith("pub/")) {
          s = s.slice(4);
        } else if (lower.startsWith("company/")) {
          s = `company/${s.slice(8).split("/")[0]}`;
          return s.slice(0, MEMBER_SOCIAL_HANDLE_MAX_LEN);
        }
      }
      s = memberSocialFirstPathSegment(s);
      break;
    case "x_handle":
      s = s.replace(/^https?:\/\/(www\.)?(x\.com|twitter\.com)\//i, "");
      s = s.replace(/^@+/, "");
      s = memberSocialFirstPathSegment(s);
      break;
    case "youtube_handle":
      s = s.replace(/^https?:\/\/(www\.)?youtube\.com\//i, "");
      s = s.replace(/^https?:\/\/youtu\.be\//i, "");
      s = s.replace(/^@+/, "");
      {
        const lower = s.toLowerCase();
        if (lower.startsWith("c/")) {
          s = s.slice(2).split("/")[0] ?? "";
        } else if (lower.startsWith("user/")) {
          s = s.slice(5).split("/")[0] ?? "";
        } else if (lower.startsWith("channel/")) {
          s = s.slice(8).split("/")[0] ?? "";
        } else if (lower.startsWith("@")) {
          s = s.slice(1).split("/")[0] ?? "";
        } else {
          s = memberSocialFirstPathSegment(s);
        }
      }
      break;
    case "rumble_handle":
      s = s.replace(/^https?:\/\/(www\.)?rumble\.com\//i, "");
      s = memberSocialTryDecode(s.split("?")[0].split("#")[0] ?? "");
      {
        const parts = s.split("/").filter(Boolean);
        const p0 = (parts[0] ?? "").toLowerCase();
        if (p0 === "c" && parts[1]) {
          s = `c/${parts[1]}`;
        } else if (p0 === "user" && parts[1]) {
          s = `user/${parts[1]}`;
        } else if (parts[0]) {
          s = `c/${parts[0]}`;
        } else {
          s = "";
        }
      }
      break;
    default:
      s = memberSocialFirstPathSegment(s.replace(/^@+/, ""));
  }

  return s.slice(0, MEMBER_SOCIAL_HANDLE_MAX_LEN);
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
      patch.display_handle = null;
    } else if (typeof v === "string") {
      const rawTyped = stripHandleAtForApi(v);
      if (rawTyped === "") {
        patch.handle = null;
        patch.display_handle = null;
      } else if (!MEMBER_HANDLE_RE.test(rawTyped)) {
        return {
          error:
            "handle must be 3–32 characters: letters, numbers, underscore, period, or hyphen; no ..; cannot start or end with .",
        };
      } else {
        patch.handle = rawTyped.toLowerCase();
        patch.display_handle = rawTyped;
      }
    } else {
      return { error: "handle must be a string or null" };
    }
  }

  if (Object.prototype.hasOwnProperty.call(body, "bio")) {
    hasKey = true;
    const v = body.bio;
    if (v === null) {
      patch.bio = null;
    } else if (typeof v === "string") {
      const t = v.trim().slice(0, 500);
      patch.bio = t === "" ? null : t;
    } else {
      return { error: "bio must be a string or null" };
    }
  }

  const socialHandleKeys = [
    "instagram_handle",
    "tiktok_handle",
    "facebook_handle",
    "snapchat_handle",
    "linkedin_handle",
    "x_handle",
    "youtube_handle",
    "rumble_handle",
  ];
  for (const key of socialHandleKeys) {
    if (!Object.prototype.hasOwnProperty.call(body, key)) continue;
    hasKey = true;
    const v = body[key];
    if (v === null) {
      patch[key] = null;
      continue;
    }
    if (typeof v !== "string") {
      return { error: `${key} must be a string or null` };
    }
    const t = normalizeMemberSocialHandlePatch(key, v);
    patch[key] = t === "" ? null : t;
  }

  if (Object.prototype.hasOwnProperty.call(body, "experience_level")) {
    hasKey = true;
    const v = body.experience_level;
    if (v === null) {
      patch.experience_level = null;
    } else if (typeof v === "string") {
      const t = v.trim().toLowerCase();
      if (t === "") {
        patch.experience_level = null;
      } else if (!MEMBER_EXPERIENCE_LEVELS.has(t)) {
        return { error: "experience_level must be beginner, intermediate, advanced, or elite" };
      } else {
        patch.experience_level = t;
      }
    } else {
      return { error: "experience_level must be a string or null" };
    }
  }

  if (Object.prototype.hasOwnProperty.call(body, "goals")) {
    hasKey = true;
    const v = body.goals;
    if (v === null) {
      patch.goals = null;
    } else if (typeof v === "string") {
      const t = v.trim().slice(0, 400);
      patch.goals = t === "" ? null : t;
    } else {
      return { error: "goals must be a string or null" };
    }
  }

  if (!hasKey) {
    return { error: "No supported fields to update" };
  }
  return { patch };
}

/**
 * Move the current front/side/back progress keys into `progress_photo_sets` (prepend) and clear the slots.
 */
async function handleArchiveProgressPhotoSet(env, cors, userId, profileId, supabaseUrl, serviceKey) {
  const selUrl = `${supabaseUrl}/rest/v1/member_profiles?id=eq.${encodeURIComponent(
    profileId
  )}&user_id=eq.${encodeURIComponent(userId)}&select=progress_photo_front_r2_key,progress_photo_front_at,progress_photo_side_r2_key,progress_photo_side_at,progress_photo_back_r2_key,progress_photo_back_at,progress_photo_sets`;
  const selRes = await fetch(selUrl, {
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
    },
  });
  const rows = await selRes.json().catch(() => []);
  if (!selRes.ok || !Array.isArray(rows) || rows.length !== 1) {
    return jsonResponse({ error: "Member profile not found" }, 404, cors);
  }
  const row = rows[0];
  const fk = row && typeof row.progress_photo_front_r2_key === "string" ? row.progress_photo_front_r2_key.trim() : "";
  const sk = row && typeof row.progress_photo_side_r2_key === "string" ? row.progress_photo_side_r2_key.trim() : "";
  const bk = row && typeof row.progress_photo_back_r2_key === "string" ? row.progress_photo_back_r2_key.trim() : "";
  if (!fk || !sk || !bk) {
    return jsonResponse(
      { error: "Upload front, side, and back photos before archiving this set" },
      400,
      cors
    );
  }
  let existing = row.progress_photo_sets;
  if (!Array.isArray(existing)) existing = [];
  const entry = {
    progress_photo_front_r2_key: fk,
    progress_photo_front_at: row.progress_photo_front_at ?? null,
    progress_photo_side_r2_key: sk,
    progress_photo_side_at: row.progress_photo_side_at ?? null,
    progress_photo_back_r2_key: bk,
    progress_photo_back_at: row.progress_photo_back_at ?? null,
  };
  const nextSets = [entry, ...existing];
  const patchResult = await supabasePatchMemberProfile(supabaseUrl, serviceKey, userId, profileId, {
    progress_photo_sets: nextSets,
    progress_photo_front_r2_key: null,
    progress_photo_front_at: null,
    progress_photo_side_r2_key: null,
    progress_photo_side_at: null,
    progress_photo_back_r2_key: null,
    progress_photo_back_at: null,
  });
  if (!patchResult.ok) {
    const { msg, status } = memberProfilePatchFailureMessage(patchResult, {});
    log(env, "warn", "progress_photo_archive_failed", {
      profileId,
      status: patchResult.status,
      snippet: String(patchResult.bodyText ?? "").slice(0, 200),
    });
    return jsonResponse({ error: msg }, status, cors);
  }
  return jsonResponse({ ok: true, archived: true }, 200, cors);
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
  const supabaseUrl = (env.SUPABASE_URL ?? "").replace(/\/$/, "");
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  if (body && body.archive_progress_photo_set === true) {
    const extra = Object.keys(body).filter((k) => k !== "archive_progress_photo_set");
    if (extra.length > 0) {
      return jsonResponse(
        { error: "When archive_progress_photo_set is true, no other fields may be sent in the same request" },
        400,
        cors
      );
    }
    return await handleArchiveProgressPhotoSet(env, cors, userId, profileId, supabaseUrl, serviceKey);
  }
  const parsed = parseMemberProfilePatchBody(body);
  if (parsed.error || !parsed.patch) {
    return jsonResponse({ error: parsed.error ?? "Invalid body" }, 400, cors);
  }
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
 * Vial Tracker hero shots and per-vial photos; Saved Stacks keep using POST /upload-stack-photo.
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

  if (kind === "body_scan") {
    const profilePlan = await fetchProfilePlan(supabaseUrl, serviceKey, userId, env);
    if (TIER_RANK[profilePlan] < TIER_RANK.pro) {
      return jsonResponse({ error: "Pro plan or higher required for InBody / DEXA scan upload" }, 403, cors);
    }
  }

  const memberScopedKinds = new Set(["body_scan", "progress_front", "progress_side", "progress_back"]);
  if (
    !["stack_shot_1", "stack_shot_2", "vial", "avatar", ...memberScopedKinds].includes(kind)
  ) {
    return jsonResponse(
      {
        error:
          "kind must be stack_shot_1, stack_shot_2, vial, avatar, body_scan, progress_front, progress_side, or progress_back",
      },
      400,
      cors
    );
  }
  if (kind === "vial") {
    if (!UUID_RE.test(vialId)) {
      return jsonResponse({ error: "Valid vial_id (UUID) required" }, 400, cors);
    }
  }
  if (memberScopedKinds.has(kind)) {
    if (!memberProfileId || !UUID_RE.test(memberProfileId)) {
      return jsonResponse({ error: "member_profile_id (UUID) required" }, 400, cors);
    }
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
  }

  const file = formData.get("file");
  if (!file || typeof file === "string" || typeof file.arrayBuffer !== "function") {
    return jsonResponse({ error: 'Expected multipart field "file"' }, 400, cors);
  }

  const size = typeof file.size === "number" ? file.size : 0;
  if (size <= 0) {
    return jsonResponse({ error: "File is empty" }, 400, cors);
  }
  if (size > STACK_PHOTO_MAX_BYTES) {
    return jsonResponse({ error: "File too large — max 10MB" }, 413, cors);
  }

  const mime = typeof file.type === "string" ? file.type.trim().toLowerCase() : "";
  if (!STACK_PHOTO_TYPES.has(mime)) {
    return jsonResponse(
      { error: "Unsupported file type — use JPEG, PNG, WebP, or GIF" },
      415,
      cors
    );
  }

  let key;
  /** When set, avatar upload updates `member_profiles.avatar_url` (R2 key) instead of account `profiles.avatar_r2_key`. */
  let avatarMemberProfileId = null;
  const isoNow = new Date().toISOString();
  if (kind === "stack_shot_1") key = `${userId}/stack-shot-1.jpg`;
  else if (kind === "stack_shot_2") key = `${userId}/stack-shot-2.jpg`;
  else if (kind === "body_scan") key = `${userId}/member-profiles/${memberProfileId}/body-scan.jpg`;
  else if (kind === "progress_front") key = `${userId}/member-profiles/${memberProfileId}/progress-front.jpg`;
  else if (kind === "progress_side") key = `${userId}/member-profiles/${memberProfileId}/progress-side.jpg`;
  else if (kind === "progress_back") key = `${userId}/member-profiles/${memberProfileId}/progress-back.jpg`;
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
    return jsonResponse({ error: "File too large — max 10MB" }, 413, cors);
  }

  if (!imageMagicMatchesClaimedMime(bytes, mime)) {
    return jsonResponse({ error: "File content does not match declared image type" }, 415, cors);
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
  /** Full canonical URL of the uploaded object — always non-empty on success. */
  let url = "";
  if (kind === "stack_shot_1") {
    patched = await supabasePatchProfile(supabaseUrl, serviceKey, userId, { stack_shot_1_r2_key: key });
    url = privateStackPhotoUrl(request, key);
  } else if (kind === "stack_shot_2") {
    patched = await supabasePatchProfile(supabaseUrl, serviceKey, userId, { stack_shot_2_r2_key: key });
    url = privateStackPhotoUrl(request, key);
  } else if (kind === "avatar") {
    if (avatarMemberProfileId) {
      url = publicMemberAvatarUrl(request, key);
      const avatarPatch = await supabasePatchMemberProfile(supabaseUrl, serviceKey, userId, avatarMemberProfileId, {
        avatar_url: url,
      });
      patched = avatarPatch.ok;
    } else {
      patched = await supabasePatchProfile(supabaseUrl, serviceKey, userId, { avatar_r2_key: key });
      url = publicMemberAvatarUrl(request, key);
    }
  } else if (kind === "body_scan") {
    const scanPatch = await supabasePatchMemberProfile(supabaseUrl, serviceKey, userId, memberProfileId, {
      body_scan_r2_key: key,
      body_scan_uploaded_at: isoNow,
      body_scan_ocr_pending: true,
    });
    patched = scanPatch.ok;
    url = privateStackPhotoUrl(request, key);
  } else if (kind === "progress_front") {
    const prPatch = await supabasePatchMemberProfile(supabaseUrl, serviceKey, userId, memberProfileId, {
      progress_photo_front_r2_key: key,
      progress_photo_front_at: isoNow,
    });
    patched = prPatch.ok;
    url = privateStackPhotoUrl(request, key);
  } else if (kind === "progress_side") {
    const prPatch = await supabasePatchMemberProfile(supabaseUrl, serviceKey, userId, memberProfileId, {
      progress_photo_side_r2_key: key,
      progress_photo_side_at: isoNow,
    });
    patched = prPatch.ok;
    url = privateStackPhotoUrl(request, key);
  } else if (kind === "progress_back") {
    const prPatch = await supabasePatchMemberProfile(supabaseUrl, serviceKey, userId, memberProfileId, {
      progress_photo_back_r2_key: key,
      progress_photo_back_at: isoNow,
    });
    patched = prPatch.ok;
    url = privateStackPhotoUrl(request, key);
  } else {
    patched = await supabasePatchUserVial(supabaseUrl, serviceKey, userId, vialId, { vial_photo_r2_key: key }, profileId);
    url = privateStackPhotoUrl(request, key);
  }

  if (!patched) {
    return jsonResponse({ error: "Failed to update database" }, 502, cors);
  }

  const isPublic = kind === "avatar";
  return jsonResponse({ url, key, private: !isPublic }, 200, cors);
}

const isUUID = (s) =>
  typeof s === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);

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
        const customerId =
          typeof session.customer === "string"
            ? session.customer
            : session.customer && typeof session.customer === "object"
              ? session.customer.id
              : "";
        const userId =
          session.metadata?.supabase_user_id ||
          (isUUID(session.client_reference_id) ? session.client_reference_id : null);
        let plan =
          (typeof session.metadata?.plan === "string" && normalizePlanTier(session.metadata.plan, env)) ||
          "entry";
        if (!userId) {
          log(env, "warn", "stripe_checkout_session_user_unresolved", {
            eventId,
            client_reference_id:
              typeof session.client_reference_id === "string" ? session.client_reference_id : "",
            customerId: customerId || "",
          });
          break;
        }
        if (userId && customerId) {
          const subId =
            typeof session.subscription === "string"
              ? session.subscription
              : session.subscription && typeof session.subscription === "object"
                ? session.subscription.id
                : "";
          if ((plan === "entry" || !VALID_PLAN_TIERS.has(plan)) && subId) {
            const sub = await fetchStripeSubscriptionExpanded(stripeKey, subId);
            if (sub) plan = tierPlanFromStripeSubscription(sub, env);
          }
          const ok = await supabaseSyncUserPlanAndCustomer(env, supabaseUrl, serviceKey, userId, plan, customerId);
          if (!ok) {
            log(env, "error", "stripe_webhook_profile_sync_failed", { userId, eventId });
            return new Response("Profile sync failed", { status: 502 });
          }
          if (subId) {
            const full = await fetchStripeSubscriptionExpanded(stripeKey, subId);
            if (full) {
              await supabasePatchProfileStripeSubscriptionFields(supabaseUrl, serviceKey, userId, full);
            }
          }
          log(env, "info", "stripe_checkout_completed", { userId, plan, customerId });
        }
        break;
      }
      case "customer.subscription.created":
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

        if (event.type === "customer.subscription.deleted") {
          const ok = await supabaseSyncUserPlanAndCustomer(env, supabaseUrl, serviceKey, userId, "entry", customerId);
          if (!ok) {
            log(env, "error", "stripe_webhook_subscription_sync_failed", { userId, eventId });
            return new Response("Sync failed", { status: 502 });
          }
          await supabasePatchProfile(supabaseUrl, serviceKey, userId, {
            stripe_subscription_id: null,
            stripe_price_id: null,
            subscription_status: "canceled",
          });
          log(env, "info", "stripe_subscription_synced", { userId, plan: "entry", type: event.type });
          break;
        }

        let subFull = sub;
        if (typeof sub?.id === "string") {
          const exp = await fetchStripeSubscriptionExpanded(stripeKey, sub.id);
          if (exp) subFull = exp;
        }
        const plan = tierPlanFromStripeSubscription(subFull, env);
        const ok = await supabaseSyncUserPlanAndCustomer(env, supabaseUrl, serviceKey, userId, plan, customerId);
        if (!ok) {
          log(env, "error", "stripe_webhook_subscription_sync_failed", { userId, eventId });
          return new Response("Sync failed", { status: 502 });
        }
        await supabasePatchProfileStripeSubscriptionFields(supabaseUrl, serviceKey, userId, subFull);
        log(env, "info", "stripe_subscription_synced", { userId, plan, type: event.type });
        break;
      }
      case "invoice.payment_failed": {
        const inv = event.data?.object ?? {};
        const customerId = typeof inv.customer === "string" ? inv.customer : inv.customer?.id;
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
        if (!userId) break;
        await supabasePatchProfile(supabaseUrl, serviceKey, userId, { subscription_status: "past_due" });
        log(env, "warn", "stripe_invoice_payment_failed", { userId, eventId });
        break;
      }
      case "invoice.payment_succeeded": {
        const inv = event.data?.object ?? {};
        const customerId = typeof inv.customer === "string" ? inv.customer : inv.customer?.id;
        const subRef = inv.subscription;
        const subId = typeof subRef === "string" ? subRef : subRef && typeof subRef === "object" ? subRef.id : "";
        if (!customerId || !subId) break;
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
        if (!userId) break;
        const full = await fetchStripeSubscriptionExpanded(stripeKey, subId);
        if (!full) break;
        const plan = tierPlanFromStripeSubscription(full, env);
        const ok = await supabaseSyncUserPlanAndCustomer(env, supabaseUrl, serviceKey, userId, plan, customerId);
        if (ok) {
          await supabasePatchProfileStripeSubscriptionFields(supabaseUrl, serviceKey, userId, full);
        }
        log(env, "info", "stripe_invoice_payment_succeeded", { userId, eventId });
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

async function handleRequest(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: PERMISSIVE_CORS_HEADERS,
      });
    }

    const url = new URL(request.url);
    const ip = request.headers.get("CF-Connecting-IP") ?? "unknown";
    const pathname = url.pathname;
    const method = request.method;

    /**
     * Public R2 GETs (/avatars/{key}) are never rate-limited — they're static
     * asset reads served from an immutable object store. Rate limiting here
     * would cascade into broken <img> tags.
     */
    const skipRateLimitPublicAvatar =
      pathname.startsWith("/avatars/") &&
      (method === "GET" || method === "HEAD" || method === "OPTIONS");

    /** Authed image uploads (multipart): POST /stack-photo, POST /upload-stack-photo, POST/PUT /avatars. */
    const isR2Write =
      (pathname === "/stack-photo" && method === "POST") ||
      (pathname === "/upload-stack-photo" && method === "POST") ||
      ((pathname === "/avatars" || pathname === "/avatars/") &&
        (method === "POST" || method === "PUT"));

    /** Authed private reads: GET /stack-photo. Higher limit for <img> rendering bursts. */
    const isR2Read = pathname === "/stack-photo" && (method === "GET" || method === "HEAD");

    if (!skipRateLimitPublicAvatar) {
      let rlType;
      if (isR2Write) {
        rlType = "r2_write";
      } else if (isR2Read) {
        rlType = "r2_read";
      } else if (
        pathname.startsWith("/auth") ||
        pathname.startsWith("/login") ||
        pathname.startsWith("/signup")
      ) {
        rlType = "auth";
      } else {
        rlType = "api";
      }
      const ipRl = await checkIpRateLimit(env, ip, rlType);
      if (ipRl.limited) {
        if (ipRl.serviceUnavailable) {
          return new Response(
            JSON.stringify({ error: "Rate limiting unavailable" }),
            { status: 503, headers: { "Content-Type": "application/json" } }
          );
        }
        return rateLimitResponse(ipRl.retryAfter ?? 60);
      }
    }

    if (url.pathname === "/stripe/webhook" && request.method === "POST") {
      return handleStripeWebhook(request, env);
    }

    const isAvatarsUploadPath = pathname === "/avatars" || pathname === "/avatars/";
    const pubAvatarCors = publicAvatarCorsHeaders();
    if (!isAvatarsUploadPath && pathname.startsWith("/avatars/")) {
      if (request.method === "GET" || request.method === "HEAD") {
        return handleGetAvatar(request, env, pubAvatarCors);
      }
    }

    const cors = corsHeaders(env, request);

    if (isAvatarsUploadPath && (request.method === "POST" || request.method === "PUT")) {
      return handlePostStackPhoto(request, env, PERMISSIVE_CORS_HEADERS);
    }

    if (!cors) {
      return new Response("Forbidden", { status: 403 });
    }

    if (url.pathname === "/turnstile/verify" && request.method === "POST") {
      let body = {};
      try {
        body = await request.json();
      } catch {
        return jsonResponse({ error: "Invalid JSON body" }, 400, cors);
      }
      const token = typeof body.token === "string" ? body.token.trim() : "";
      if (!token) {
        return jsonResponse({ error: "Missing token" }, 400, cors);
      }
      const { success } = await verifyTurnstile(token, env);
      return jsonResponse({ success }, 200, cors);
    }

    if (url.pathname === "/stripe/subscription" && request.method === "GET") {
      return handleStripeSubscription(request, env, cors);
    }

    if (url.pathname === "/stripe/subscription/schedule-downgrade" && request.method === "POST") {
      return handleScheduleDowngrade(request, env, cors);
    }

    if (url.pathname === "/stripe/create-customer" && request.method === "POST") {
      return handleStripeCreateCustomer(request, env, cors);
    }

    if (url.pathname === "/stripe/create-subscription" && request.method === "POST") {
      return handleStripeCreateSubscription(request, env, cors);
    }

    if (url.pathname === "/stripe/create-portal-session" && request.method === "POST") {
      return handleStripePortalSession(request, env, cors);
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

    if (url.pathname === "/member-profiles/public" && request.method === "GET") {
      return handleGetMemberProfilePublic(request, env, cors);
    }

    if (url.pathname === "/member-profiles/search" && request.method === "GET") {
      return handleSearchMemberProfiles(request, env, cors);
    }

    if (url.pathname === "/member-profiles" && request.method === "GET") {
      return handleGetMemberProfiles(request, env, cors);
    }

    if (url.pathname === "/member-follows/following" && request.method === "GET") {
      return handleGetMemberFollowFollowing(request, env, cors);
    }

    if (url.pathname === "/member-follows" && request.method === "POST") {
      return handlePostMemberFollow(request, env, cors);
    }

    if (url.pathname === "/member-follows" && request.method === "DELETE") {
      return handleDeleteMemberFollow(request, env, cors);
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

    // ─── AI GUIDE (stack recommendations) ────────────────────────────────
    // Normalize trailing slash so POST /ai-guide/ still matches (avoids 404 from typo/proxies).
    const stackAdvisorPath = (url.pathname.replace(/\/+$/, "") || "/");
    if (
      (stackAdvisorPath === "/ai-guide" ||
        stackAdvisorPath === "/ai-stack-advisor" ||
        stackAdvisorPath === "/stack-advisor") &&
      request.method === "POST"
    ) {
      return handleStackAdvisor(request, env);
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
      plan = await fetchProfilePlan(supabaseUrl, serviceKey, userId, env);
      const chatCtx = await fetchProfileAiContextFields(supabaseUrl, serviceKey, userId);
      const chatUserLines = [
        biologicalSexPromptLineFromDb(chatCtx.biological_sex),
        agePromptLineFromDob(chatCtx.date_of_birth),
        trainingExperiencePromptLineFromDb(chatCtx.training_experience),
      ].filter(Boolean);
      const profileAugment = [chatUserLines.join("\n"), AI_AGE_TRAINING_SAFETY_NOTE].filter(Boolean).join("\n\n");
      const baseSystem = typeof body.system === "string" ? body.system.trim() : "";
      body.system = baseSystem ? `${baseSystem}\n\n${profileAugment}` : profileAugment;
    } else {
      if (production) {
        return jsonResponse({ error: "Unauthorized" }, 401, cors);
      }
      plan = normalizePlanTier(body.plan, env);
      log(env, "warn", "dev_mode_chat_without_supabase", {});
    }

    const rl = await readDailyQueryRateLimit(env, env.RATE_LIMIT_KV, userId, plan);
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
    const maxTokCap = maxTokensCapForPlan(plan, env);

    const baseMsgs = normalizeMessages(body.messages).slice(-10);
    const catalogForCache = Array.isArray(body.catalog) ? body.catalog : null;
    const messages = injectCatalogCacheIntoMessages(baseMsgs, catalogForCache);

    const payload = {
      model,
      max_tokens: Math.min(body.max_tokens ?? maxTokCap, maxTokCap),
      messages,
      system: buildChatSystemBlocks(body),
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

    const usageAfter = await incrementDailyQueryRateLimit(env, env.RATE_LIMIT_KV, userId, plan);

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
          queries_today: usageAfter.count,
          queries_limit: usageAfter.limit,
          plan,
        },
      },
      200,
      cors
    );
}

export default {
  async fetch(request, env) {
    return applySecurityHeaders(await handleRequest(request, env));
  },
};
