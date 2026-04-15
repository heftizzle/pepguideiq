# PepGuideIQ

Research peptide reference and tooling — [pepguideiq.com](https://pepguideiq.com).

Repository: [github.com/heftizzle/pepguideiq](https://github.com/heftizzle/pepguideiq).

## Development

```bash
npm install
npm run dev
```

Build: `npm run build` — output in `dist/`.

### Environment variables

Copy [`.env.example`](./.env.example) to **`.env.local`** and fill in values (Vite loads `.env.local` automatically).

| Variable | Purpose |
|----------|---------|
| `VITE_SUPABASE_URL` | Supabase project URL (Auth + `profiles`, `user_stacks`, etc.). |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon (public) key. |
| `VITE_API_WORKER_URL` | Worker origin, **no trailing slash**. |
| `VITE_STRIPE_CHECKOUT_*` | Optional Stripe Payment Link URLs for Pro / Elite / GOAT (see `.env.example`). |

On **Cloudflare Pages**, set the same Vite variables as build/environment variables. Do not commit `.env` or `.env.local`.

### Supabase database

Apply migrations in order under [`supabase/migrations/`](./supabase/migrations/) (SQL Editor or `supabase db push`). Migration **`008_plan_and_stack_photo_security.sql`** adds:

- `profiles.stack_photo_r2_key` and a trigger so **`plan` cannot be changed by end users** from the client; only the trusted RPC `update_user_plan` (service role / Worker webhook) can change tier after checkout.

### Cloudflare Worker (API proxy)

The Anthropic key stays on the Worker only (`wrangler secret put ANTHROPIC_API_KEY`), never in the browser.

1. `npm install`
2. `npx wrangler login`
3. `npx wrangler secret put ANTHROPIC_API_KEY --config wrangler.worker.toml` (and Supabase + optional Stripe secrets — see [`.env.example`](./.env.example); add `--config wrangler.worker.toml` to each `wrangler secret put`)
4. `npm run deploy:worker`
5. Set **`VITE_API_WORKER_URL`** to the deployed Worker URL (no trailing slash).

Worker entry: [`workers/api-proxy.js`](./workers/api-proxy.js). Notable routes:

| Route | Purpose |
|-------|---------|
| `POST /v1/chat` | Anthropic proxy; effective plan from **`public.profiles.plan`** (not client-supplied). |
| `GET /stack-photo` | Authenticated download of the user’s stack image from R2. |
| `POST /stripe/webhook` | Stripe → `update_user_plan` + `stripe_customer_id` sync. |

**Production:** set Worker vars `ENVIRONMENT=production` and `ALLOWED_ORIGIN=https://your-domain.com` (see commented `[vars]` in [`wrangler.worker.toml`](./wrangler.worker.toml)). Rate limiting requires KV; in production the Worker **fails closed** if KV is missing.

### Stripe billing

1. Create Payment Links (or Checkout) and set `VITE_STRIPE_CHECKOUT_PRO` etc. The app appends **`client_reference_id=<Supabase user id>`** so the webhook can map Checkout to `auth.users`.
2. Add metadata on prices or subscriptions: **`plan`** = `entry` \| `pro` \| `elite` \| `goat`.
3. In Stripe Dashboard → Webhooks, point to **`https://<worker-host>/stripe/webhook`** and add the signing secret as **`STRIPE_WEBHOOK_SECRET`** (`wrangler secret put`).
4. Subscribe to at least: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`.

Plan changes from the browser **are not** accepted; the database trigger enforces that.

### Manual tier testing (SQL)

To set a tier without Stripe (e.g. staging), run as a privileged role in the SQL editor:

```sql
SELECT public.update_user_plan('<user-uuid>'::uuid, 'pro');
```

### Auth

The app uses **Supabase Auth** (`signIn`, `signUp`, `signOut`, `getCurrentUser` in [`src/lib/supabase.js`](./src/lib/supabase.js)). There is no demo account; create a user in Supabase or via the in-app sign-up flow.

### CI

GitHub Actions runs `npm ci`, `npm audit --audit-level=high`, and `npm run build` on pushes and pull requests (see [`.github/workflows/ci.yml`](./github/workflows/ci.yml)).

### Security headers (Cloudflare Pages)

[`public/_headers`](./public/_headers) sets CSP, `X-Frame-Options`, and related headers for the static app. Tighten `Content-Security-Policy` `connect-src` for your exact API origins if you use a custom Worker domain.
