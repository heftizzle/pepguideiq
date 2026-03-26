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
| `VITE_SUPABASE_URL` | Supabase project URL (Auth + `profiles`, `user_stacks`, `ai_queries`). |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon (public) key. |
| `VITE_API_WORKER_URL` | Worker origin, **no trailing slash**. AI uses **`POST /v1/chat`** with JSON `{ messages, system }`; response JSON `{ text }`. |

On **Cloudflare Pages**, set the same three as build/environment variables. Do not commit `.env` or `.env.local`.

### Supabase database

Run [`supabase/migrations/001_initial_schema.sql`](./supabase/migrations/001_initial_schema.sql) in the **SQL Editor** (or `supabase db push`). It creates **`profiles`** (plan + name, filled by signup trigger), **`user_stacks`** (JSONB stack per user), **`ai_queries`** (usage log), RLS policies, **`update_user_plan`** / **`get_daily_ai_count`** helpers, and triggers for `updated_at` + auto profile/stack on signup.

### Cloudflare Worker (Anthropic proxy)

The API key stays on the Worker only (`wrangler secret put ANTHROPIC_API_KEY`), never in the frontend.

1. `npm install` (includes `wrangler` as a dev dependency; or `npm install -g wrangler`).
2. `npx wrangler login`
3. `npx wrangler secret put ANTHROPIC_API_KEY` — paste your Anthropic key.
4. `npm run deploy:worker` (or `npx wrangler deploy` using [`wrangler.toml`](./wrangler.toml)).
5. Copy the deployed Worker URL into `.env.local` as `VITE_API_WORKER_URL` (no trailing slash).

Worker entry: [`workers/api-proxy.js`](./workers/api-proxy.js).

### Auth

The app uses **Supabase Auth** (`signIn`, `signUp`, `signOut`, `getCurrentUser`, `updateUserPlan` in [`src/lib/supabase.js`](./src/lib/supabase.js)). There is no demo account; create a user in Supabase or via the in-app sign-up flow.
