# pepguideIQ Worker — agent brief

Single file: `workers/api-proxy.js` (3972 lines). Dispatch is a long `if/else` chain around line 3700.

## Routes (exactly 29)

### AI
- `POST /v1/chat` — Anthropic proxy. Plan-gated, KV rate-limited per user per day. Body: `{messages, system, catalog}`. Response: `{text, usage: {queries_today, queries_limit}}`. Also handles Stack Advisor when payload indicates — branches in `handleStackAdvisor()` (line 397).

### Stripe
- `POST /stripe/webhook` — event handler: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_succeeded`. Syncs plan via `update_user_plan`.
- `GET /stripe/subscription` — current user's sub info.
- `POST /stripe/subscription/schedule-downgrade` — sets `profiles.pending_plan` + `pending_plan_date` from Stripe period end.
- `POST /stripe/create-customer`
- `POST /stripe/create-subscription` — returns PaymentIntent `client_secret` or `{no_payment_needed: true}`.
- `POST /stripe/create-portal-session` — returns `{url}` for the Stripe-hosted billing portal.

### Auth-adjacent
- `POST /auth/signup` — Turnstile + IP rate limit, then proxies to Supabase `POST /auth/v1/signup` with anon key. Body: `{ email, password, turnstileToken, userData }`.
- `POST /auth/password-reset` — Turnstile + IP rate limit, then proxies to Supabase `POST /auth/v1/recover`. Body: `{ email, turnstileToken, redirectTo? }`.
- `POST /turnstile/verify` — verifies a Turnstile token (used by AuthScreen; login logging only).
- `POST /account/delete` — service-role delete of user + cascading data.

### Member profiles
- `GET /member-profiles` — list caller's profiles.
- `POST /member-profiles` — create new member profile (slot limit enforced per plan).
- `PATCH /member-profiles/{id}` — update display_name, handle, display_handle, bio, goals, social_*_handle, locale_*, wake_time, schedule_shift, biological_sex, training_experience, date_of_birth, demo_sessions_shown, avatar_url, archive progress photo set, etc.
- `DELETE /member-profiles/{id}` — delete non-default profile.
- `GET /member-profiles/handle-available?handle=`
- `GET /member-profiles/public?handle=` — **no auth.**
- `GET /member-profiles/search?q=` — authed.

### Social graph
- `POST /member-follows` — follow (body: `{follower_profile_id, following_profile_id}`).
- `DELETE /member-follows` — unfollow (same body shape).
- `GET /member-follows/following?profile_id=`

### Body composition (InBody / DEXA)
- `POST /inbody-scan/extract` — multipart `file` (JPEG/PNG/WebP/GIF). **Pro+** only. Claude Haiku vision → `{ values, confidence, rawText }` JSON for review before save. Does not consume AI Guide daily KV quota.
- `POST /inbody-scan/interpret` — JSON body `{ scanId, scans?, protocolEvents?, activeStack?, reinterpret?: boolean }`. **Pro+** only. If `inbody_scan_history.ai_interpretation` is already set for `scanId` (and `reinterpret` is not true), returns JSON `{ cached: true, interpretation, ai_interpreted_at }` with no Anthropic call. Otherwise streams Sonnet (`MODEL_ELITE_GOAT`) as `text/event-stream`, then persists to `ai_interpretation` / `ai_interpreted_at` on that row. Does **not** use AI Guide daily KV quota.

### R2 images
- `POST /stack-photo` — multipart upload to R2 bucket `stack-photos`. Returns `{url, key, private: true}`. Use `kind=inbody_scan_history` + `member_profile_id` for timestamped keys under `{userId}/scans/{iso}.jpg` (no `member_profiles` body_scan columns updated).
- `POST /upload-stack-photo` — alias of the above, kept for compatibility.
- `GET /stack-photo?key=…` — authenticated private read. User can only read keys prefixed with their own user id.
- `GET /avatars/{key}` — **public** R2 read (no auth, no rate limit). Never rate-limit these — cascades to broken `<img>` tags.
- `POST /avatars` / `PUT /avatars` — authenticated avatar upload.

## Model routing

```js
const MODEL_ENTRY_PRO  = "claude-haiku-4-5-20251001";
const MODEL_ELITE_GOAT = "claude-sonnet-4-6";
```

`modelForPlan(plan)` returns one of these. Plan is read from `public.profiles.plan` via service-role — **never from the client payload**.

## max_tokens cap by plan

| Plan | Cap |
|---|---|
| Entry / Pro | 1024 |
| Elite | 2048 |
| GOAT | 4096 |

See `maxTokensCapForPlan(plan, env)`.

## Daily query limits

Taken from `DAILY_QUERY_LIMIT` constant, mapped to tiers: Entry 2, Pro 4, Elite 8, GOAT 16. Counter in KV at `rl:{userId}:{YYYY-MM-DD}` with 90,000s TTL.

- Read with `readDailyQueryRateLimit` before the Anthropic call.
- Increment with `incrementDailyQueryRateLimit` **after** a successful Anthropic response. Never before — otherwise a failed response charges the user.

## IP rate limits

`checkIpRateLimit(env, ip, type)` with types: `r2_write`, `r2_read`, `auth`, `api`, `signup` (3/hour per IP), `password_reset` (5/hour per IP). `POST /auth/signup` and `POST /auth/password-reset` skip the outer `/auth` bucket and use only these dedicated limits (so 429 responses include CORS). Public avatar reads (`GET /avatars/{key}`, `HEAD /avatars/{key}`, `OPTIONS /avatars/{key}`) bypass rate limiting entirely. Fails-closed in production if KV is missing.

## Bindings (`wrangler.worker.toml`)

```toml
[[kv_namespaces]]
binding = "RATE_LIMIT_KV"
id = "8e4c0ecee5b54a81abf179e58624fd33"
preview_id = "2239fd8dcc6f40fdaf903993ff5a1cd8"

[[r2_buckets]]
binding = "STACK_PHOTOS"
bucket_name = "stack-photos"
```

## Secrets (`wrangler secret put --config wrangler.worker.toml`)

- `ANTHROPIC_API_KEY` — required
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` — required
- `SUPABASE_ANON_KEY` — same value as `VITE_SUPABASE_ANON_KEY`; required for `POST /auth/signup` and `POST /auth/password-reset` (Turnstile-gated auth proxy)
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` — required for billing
- `TURNSTILE_SECRET_KEY` — required when the app sets `VITE_TURNSTILE_SITE_KEY`

## Vars (non-secret)

- `ENVIRONMENT=production` — turns on fail-closed KV enforcement + strict CORS
- `ALLOWED_ORIGIN=https://pepguideiq.com` — exact origin, no wildcard
- `STRIPE_PRICE_ID_PRO`, `STRIPE_PRICE_ID_ELITE`, `STRIPE_PRICE_ID_GOAT`

## Security invariants

- **Never trust client-supplied `plan`.** Always fetch from `public.profiles` with `fetchProfilePlan()`.
- **Stripe webhook signature verification is required** (`verifyStripeWebhookSignature`). Don't skip.
- **Image uploads must pass `imageMagicMatchesClaimedMime()`** — reject when magic bytes don't match the claimed MIME.
- **R2 private reads must check ownership** — the key must start with the caller's user id prefix.
- **Service-role key bypasses RLS.** Always check ownership explicitly in the handler — don't rely on RLS alone when using the service key.
- **Turnstile verify is one-shot per token.** Don't replay.

## Common helpers (don't re-invent)

- `getSessionUser(env, authHeader)` — resolves Supabase user from `Authorization: Bearer` header.
- `normalizePlanTier(p, env)` — canonicalizes plan to `entry`/`pro`/`elite`/`goat`.
- `fetchProfilePlan(supabaseUrl, serviceKey, userId, env)` — server-side plan read.
- `fetchProfileAiContextFields(supabaseUrl, serviceKey, userId)` — pulls biological_sex, DOB, training_experience for AI context injection.
- `jsonResponse(body, status, cors)` — standard JSON response.
- `applySecurityHeaders(response)` — adds CSP-ish headers.
- `corsHeaders(env, request)` — origin-gated; production requires exact match with `ALLOWED_ORIGIN`.
- `publicAvatarCorsHeaders()` — relaxed CORS for public avatar reads.
- `log(env, level, msg, extra)` — structured log. Don't `console.log` elsewhere.

## How to add a new route

1. Add `if (url.pathname === "/your-route" && request.method === "…") return handler(request, env, cors);` in the dispatch chain around line 3720.
2. Implement `handler(request, env, cors)` in the handler section above (alphabetical-ish grouping).
3. Rate-limit type defaults to `api` — change in the dispatch if the route is a write or an auth path.
4. Always `return jsonResponse({...}, status, cors)`.
5. Read the user with `getSessionUser(env, request.headers.get("authorization"))`. Explicit 401 on missing token.
6. Verify ownership before any service-role write.
