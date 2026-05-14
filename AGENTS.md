# pepguideIQ — agent brief

Read before making changes. This file tells you what's actually in the repo vs what might seem plausible.

## What this is

A research-peptide reference and personal-protocol tracker. Production: [pepguideiq.com](https://pepguideiq.com). 275-compound catalog, per-user saved stacks (JSONB), vial lifecycle tracking, dose logging, social profile layer with follows + a receipted network feed, AI Atfeh (Advanced Technology For Enhanced Humans) (Anthropic) — powering two surfaces: Atfeh Chat and Atfeh Stack Picks — both proxied through a Cloudflare Worker so the API key never hits the browser.

## Stack (exact)

- React 19.0 + Vite 6 — single-page app, **no router library**
- Supabase — Postgres + Auth + RLS
- Cloudflare Workers — Anthropic proxy, Stripe, R2, Turnstile (`workers/api-proxy.js`)
- Cloudflare R2 — stack photos, avatars, vial photos (bucket: `stack-photos`)
- Cloudflare KV — per-user daily AI query rate limit (namespace binding: `RATE_LIMIT_KV`)
- Cloudflare Pages — static hosting
- Cloudflare Turnstile — bot check on auth
- Stripe hosted Checkout (subscription) + Payment Links + webhook. `@stripe/stripe-js` / `@stripe/react-stripe-js` remain in deps; plan upgrades from `UpgradePlanModal` redirect to Checkout or a Billing Portal `subscription_update_confirm` URL from the Worker (no `client_secret` in browser).

Production deps (7, exhaustive):
- `@stripe/react-stripe-js` ^3.10.0 — `<Elements>`, `<PaymentElement>`, hooks
- `@stripe/stripe-js` ^5.10.0 — `loadStripe`
- `@supabase/supabase-js` ^2.49.1
- `react` ^19.0.0
- `react-dom` ^19.0.0
- `react-markdown` ^9.0.3 — renders AI Atfeh assistant messages
- `zxcvbn` ^4.4.2 — lazy-loaded in AuthScreen for password strength

Dev deps: `vite`, `@vitejs/plugin-react`, `wrangler`, `eslint`. Before `import`ing anything else, add it to `package.json` first.

## Commands

| Command | What |
|---|---|
| `pnpm run dev` | Vite dev server, port 5173 |
| `pnpm run build` | Production build to `dist/` |
| `pnpm run preview` | Preview the prod build |
| `pnpm run deploy:worker` | Deploy Worker (`wrangler deploy --config wrangler.worker.toml`) |
| `./deploy.sh` | `pnpm run build`, Worker deploy (`wrangler.worker.toml`), then Pages deploy (`pepguideiq` / `main`). Bash script from repo root; no git. Commit and push separately if you want source on GitHub. |
| `pnpm exec wrangler dev --config wrangler.worker.toml` | Local Worker on port 8787 |

Local Worker + Vite same-origin option: set `VITE_API_WORKER_URL=http://localhost:5173/api-worker` and Vite proxies to 8787 (see `vite.config.js`).

## File map

```
workers/api-proxy.js              ~5400 lines — Anthropic proxy, Stripe, R2, member profiles, Turnstile
src/App.jsx                       2784 lines — main shell, 8 tabs, AI Atfeh
src/components/ProfileTab.jsx     2752 lines
src/components/VialTracker.jsx    2003 lines
src/components/BuildTab.jsx       1385 lines
src/components/SettingsTab.jsx    1280 lines
src/lib/supabase.js               1183 lines — 57 exported data-layer functions
src/data/catalog.js                355 lines — schema + merges COMPOUNDS batches
src/data/compounds/batch1..9.js          — compound rows across batch1..41 (~275 total)
supabase/migrations/                     — 51 migrations (001..050 + 045a)
```

Subdirectory briefs: `src/AGENTS.md`, `workers/AGENTS.md`, `supabase/AGENTS.md`.

## Corrections to common AI assumptions

- **Catalog has 275 compounds.** For the live count do `PEPTIDES.length`. The catalog payload for AI Atfeh (`src/lib/atfehCatalogPayload.js`) sends all compounds — no hardcoded cap.
- **Tier emojis are 💸 Entry · 🔬 Pro · ⚡ Elite · 🐐 GOAT.** Source: `src/lib/tiers.js`.
- **Tier IDs are `entry`, `pro`, `elite`, `goat` — exactly 4.** No "free", no "basic", no "premium".
- **No Tailwind. No CSS modules. No router. No state management lib.** Inline styles + a few global classes in `src/components/GlobalStyles.jsx`. Routing is regex in `src/main.jsx`. State is `useState` / context.
- **Stripe hosted checkout for plan upgrades.** `UpgradePlanModal.jsx` → Worker `POST /stripe/create-subscription` → `{ url }` (Stripe Checkout for new subscriptions, or Billing Portal when changing an existing paid subscription’s price). Payment Links remain a fallback / alternative path.
- **Affiliate codes (14 whitelisted).** Canonical codes (all 15% flat, case-insensitive via `normalizeAffiliateRef()` in `src/lib/affiliateRef.js`). One Rewardful affiliate may have multiple active codes (tracked separately); list each code here.

  | Name             | Code          |
  |------------------|---------------|
  | Jose Primo       | Primo15       |
  | Pete Belcastro   | Pete15        |
  | Kirby Anderson   | Tsource15     |
  | Nic Edon         | EDON15, HEAVYDUTY15 |
  | Miranda Geist    | ironresolve15 |
  | Debbie Palmer    | Palmer15      |
  | Jake Ryba        | Ryba15        |
  | Mike Hefta       | Fire15        |
  | Mike Lake        | Lake15        |
  | OverTime Men     | OTMen15       |
  | Jeff Cohn        | Elite15       |
  | Dr. Tracy / Live In Vitality (Riverview, FL) | Vitality15 |
  | Chad             | Chad15        |

  All 14 codes are whitelisted in `normalizeAffiliateRef()`. Do not add codes not in this list. Old stale codes (KwElite15, OTMax15, Promo15) are retired.
- **Plan (tier) is server-authoritative.** The `profiles.plan` column has a trigger that rejects direct updates. Only `update_user_plan(uuid, text)` via the service-role Worker can change it.
- **Session IDs are `morning`, `afternoon`, `evening`, `night` — exactly 4.** See `src/data/protocolSessions.js`.
- **Tab IDs are `library`, `guide`, `stackBuilder`, `stack`, `network`, `vialTracker`, `protocol`, `profile` — exactly 8.** See `PEPV_VALID_TABS` in `src/App.jsx`.

## Environment variables

App (Vite, `VITE_` prefix):
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_API_WORKER_URL` — Worker origin, no trailing slash
- `VITE_TURNSTILE_SITE_KEY`
- `VITE_STRIPE_PUBLISHABLE_KEY` — currently unused (Elements path dormant)
- `VITE_STRIPE_CHECKOUT_PRO` / `_ELITE` / `_GOAT` — Payment Link URLs

Worker secrets (`wrangler secret put --config wrangler.worker.toml`):
- `ANTHROPIC_API_KEY`
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- `TURNSTILE_SECRET_KEY`

Worker vars (non-secret, Cloudflare dashboard or `[vars]` in toml):
- `ENVIRONMENT=production` — turns on fail-closed rate limiting
- `ALLOWED_ORIGIN=https://pepguideiq.com` — exact origin, not `*`
- `STRIPE_PRICE_ID_PRO`, `STRIPE_PRICE_ID_ELITE`, `STRIPE_PRICE_ID_GOAT`

## Atfeh thread endpoint response contract

Every thread endpoint that returns a single thread wraps it as `{ thread: {...}, ...extras }`. The client always reads `data.thread.id`, `data.thread.locked`, etc.

| Endpoint | Response shape |
|---|---|
| `POST /atfeh/threads` (create) | `{ thread: { id, profile_id, title, ... } }` |
| `GET /atfeh/threads` (list) | `{ active: [...], archived: [...] }` |
| `GET /atfeh/threads/:id/messages` | `{ thread: { id, title, message_count, ... }, messages: [...] }` |
| `POST /atfeh/threads/:id/messages` | `{ thread: { message_count, locked, canContinue }, content }` |
| `POST /atfeh/threads/:id/continue` | `{ thread: { id, title, ... }, summary }` |
| `PATCH .../archive` | `{ success: true }` |
| `PATCH .../restore` | `{ success: true }` |

New thread endpoints must follow this contract. Do not return bare Supabase rows at the top level.

## Hard rules

- Do not `import` a library not in `package.json`.
- Do not set `profiles.plan` from the client. Use `update_user_plan` RPC from the Worker only.
- Do not invent Worker routes. There are exactly 38 — see `workers/CLAUDE.md`.
- Do not invent tab IDs, session IDs, or tier IDs.
- Do not introduce a CSS framework. Use inline styles and existing `GlobalStyles.jsx` classes.
- Do not persist R2 URLs with cache-bust params (`?v=…`). Store the key; apply busting at render time only.
- Do not write new RLS policies without reading `docs/security/rls-audit.md`.

## CI / deploy

`.github/workflows/ci.yml`: on every push to `main` + all PRs → `pnpm install --frozen-lockfile`, `pnpm audit --audit-level=high` (fails on high/critical), `pnpm run build`. On `main` only: deploys Worker + Pages.

Required repo secrets: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, all `VITE_*` env vars.

## Roadmap

See `ROADMAP.md`. Launch gates, active queue, post-launch backlog, and V2 features are tracked there — not in memory, not in this file.
