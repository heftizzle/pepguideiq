# pepguideIQ — agent brief

Read before making changes. This file tells you what's actually in the repo vs what might seem plausible.

## What this is

A research-peptide reference and personal-protocol tracker. Production: [pepguideiq.com](https://pepguideiq.com). 171-compound catalog, per-user saved stacks (JSONB), vial lifecycle tracking, dose logging, social profile layer with follows + a receipted network feed, AI Guide (Anthropic) and Stack Advisor — both proxied through a Cloudflare Worker so the API key never hits the browser.

## Stack (exact)

- React 19.0 + Vite 6 — single-page app, **no router library**
- Supabase — Postgres + Auth + RLS
- Cloudflare Workers — Anthropic proxy, Stripe, R2, Turnstile (`workers/api-proxy.js`)
- Cloudflare R2 — stack photos, avatars, vial photos (bucket: `stack-photos`)
- Cloudflare KV — per-user daily AI query rate limit (namespace binding: `RATE_LIMIT_KV`)
- Cloudflare Pages — static hosting
- Cloudflare Turnstile — bot check on auth
- Stripe Elements (embedded checkout) + Payment Links + webhook. Elements path uses `@stripe/stripe-js` + `@stripe/react-stripe-js` client-side; the Worker issues the PaymentIntent `client_secret`.

Production deps (7, exhaustive):
- `@stripe/react-stripe-js` ^3.10.0 — `<Elements>`, `<PaymentElement>`, hooks
- `@stripe/stripe-js` ^5.10.0 — `loadStripe`
- `@supabase/supabase-js` ^2.49.1
- `react` ^19.0.0
- `react-dom` ^19.0.0
- `react-markdown` ^9.0.3 — renders AI Guide assistant messages
- `zxcvbn` ^4.4.2 — lazy-loaded in AuthScreen for password strength

Dev deps: `vite`, `@vitejs/plugin-react`, `wrangler`, `eslint`. Before `import`ing anything else, add it to `package.json` first.

## Commands

| Command | What |
|---|---|
| `pnpm run dev` | Vite dev server, port 5173 |
| `pnpm run build` | Production build to `dist/` |
| `pnpm run preview` | Preview the prod build |
| `pnpm run deploy:worker` | Deploy Worker (`wrangler deploy --config wrangler.worker.toml`) |
| `./deploy.sh` | Full deploy: build + Worker + Pages |
| `pnpm exec wrangler dev --config wrangler.worker.toml` | Local Worker on port 8787 |

Local Worker + Vite same-origin option: set `VITE_API_WORKER_URL=http://localhost:5173/api-worker` and Vite proxies to 8787 (see `vite.config.js`).

## File map

```
workers/api-proxy.js              3972 lines — Anthropic proxy, Stripe, R2, member profiles, Turnstile
src/App.jsx                       2784 lines — main shell, 8 tabs, AI Guide
src/components/ProfileTab.jsx     2752 lines
src/components/VialTracker.jsx    2003 lines
src/components/BuildTab.jsx       1385 lines
src/components/SettingsTab.jsx    1280 lines
src/lib/supabase.js               1183 lines — 57 exported data-layer functions
src/data/catalog.js                355 lines — schema + merges COMPOUNDS batches
src/data/compounds/batch1..9.js          — compound rows, ~171 total
supabase/migrations/                     — 51 migrations (001..050 + 045a)
```

Subdirectory briefs: `src/CLAUDE.md`, `workers/CLAUDE.md`, `supabase/CLAUDE.md`.

## Corrections to common AI assumptions

- **Catalog has 171 compounds.** `MAX_ADVISOR_CATALOG = 153` in `src/lib/advisorCatalogPayload.js` is the AI advisor payload cap, NOT the catalog size. For the live count do `PEPTIDES.length`.
- **Tier emojis are 💸 Entry · 🔬 Pro · ⚡ Elite · 🐐 GOAT.** Source: `src/lib/tiers.js`.
- **Tier IDs are `entry`, `pro`, `elite`, `goat` — exactly 4.** No "free", no "basic", no "premium".
- **No Tailwind. No CSS modules. No router. No state management lib.** Inline styles + a few global classes in `src/components/GlobalStyles.jsx`. Routing is regex in `src/main.jsx`. State is `useState` / context.
- **Stripe Elements is live.** Primary checkout is embedded Elements via `UpgradePlanModal.jsx` → Worker `POST /stripe/create-subscription` → PaymentIntent `client_secret`. Payment Links are the fallback / alternative path.
- **Affiliate codes (13 whitelisted).** `?ref=` values are normalized case-insensitively by `normalizeAffiliateRef()` in `src/lib/affiliateRef.js`; unknown Rewardful codes are dropped. Canonical codes: Primo15, Pete15, Tsource15, EDON15, ironresolve15, Palmer15, Ryba15, Fire15, Lake15, OTMen15, Elite15, Vitality15 (Dr. Tracy / Live In Vitality, Riverview, FL), Chad15.
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

## Hard rules

- Do not `import` a library not in `package.json`.
- Do not set `profiles.plan` from the client. Use `update_user_plan` RPC from the Worker only.
- Do not invent Worker routes. There are exactly 29 — see `workers/CLAUDE.md`.
- Do not invent tab IDs, session IDs, or tier IDs.
- Do not introduce a CSS framework. Use inline styles and existing `GlobalStyles.jsx` classes.
- Do not persist R2 URLs with cache-bust params (`?v=…`). Store the key; apply busting at render time only.
- Do not write new RLS policies without reading `docs/security/rls-audit.md`.

## CI / deploy

`.github/workflows/ci.yml`: on every push to `main` + all PRs → `pnpm install --frozen-lockfile`, `pnpm audit --audit-level=high` (fails on high/critical), `pnpm run build`. On `main` only: deploys Worker + Pages.

Required repo secrets: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, all `VITE_*` env vars.

## Roadmap

See `ROADMAP.md`. Launch gates, active queue, post-launch backlog, and V2 features are tracked there — not in memory, not in this file.
