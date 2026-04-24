# pepguideIQ database — agent brief

51 migrations (001 through 050 plus 045a). Apply in strict order. `supabase db push` or paste into SQL Editor — both work.

## Tables

| Table | Purpose |
|---|---|
| `profiles` | One row per auth user. Plan tier, Stripe IDs, stack photo R2 key, demographics (`biological_sex`, `date_of_birth`, `training_experience`). |
| `user_stacks` | One row per `(user_id, profile_id)`. `stack` JSONB holds the compound list. `public_share_id`, `share_feed_visible`. |
| `user_vials` | Vial lifecycle. `peptide_id`, `concentration_mcg_ml`, `bac_water_ml`, `vial_size_mg`, `reconstituted_at`, `expires_at`, `desired_dose_mcg`, `photo_r2_key`, `status`. |
| `dose_logs` | One row per dose. `peptide_id`, `vial_id` (null for oral/nasal/topical), `dose_mcg` OR `dose_count` + `dose_unit`, `dosed_at`, `session_label`, `route_kind`. |
| `member_profiles` | Sub-profiles per user (Netflix-style, slot-limited by plan). `display_name`, `handle`, `display_handle`, `avatar_url`, `bio`, `goals` (CSV), `language`, `wake_time`, `schedule_shift`, `demo_sessions_shown`, `tutorial_completed` (core walkthrough finished), `current_streak`, `consecutive_days`, `is_default`, `social_{instagram,tiktok,facebook,snapchat,linkedin,x,youtube,rumble}_handle`, `locale_{city,state,country_code}`. |
| `body_metrics` | Scoped per profile. Weight/height/body-fat, InBody/DEXA fields. |
| `member_follows` | Graph edges. `(follower_id, following_id)`. Unique constraint. |
| `network_feed` | Receipted feed posts. `stack_id` for stack shares, `dose_log_id` for dose posts. `public_visible` flag. `expires_at` for TTL. |
| `notifications` | In-app bell. `user_id`, `actor_id`, `type`, `read_at`, `nav_target`. |
| `member_fasts` | Fasting tracker. `fast_type`, `started_at`, `target_hours`, `ended_at`. |
| `shopping_lists` | Saved shopping list snapshots. |
| `query_log` | AI query log for analytics. Not used for rate limiting (KV is). |

**Removed in 047:** `ai_queries`. Don't reference it.

## RPCs (`public.*`)

| RPC | Purpose |
|---|---|
| `update_user_plan(uuid, text)` | **The only way to change `profiles.plan`.** Sets `app.allow_plan_change` session flag, updates column, mirrors to `auth.users.raw_user_meta_data`. Revoked from PUBLIC, granted to `service_role`. |
| `get_daily_ai_count(uuid)` | Legacy; KV is the primary rate limit now. |
| `get_network_feed()` | Feed joined with `member_profiles` + `user_stacks` for the caller. Filtered by ownership + follow graph. |
| `get_public_network_dose_feed()` | Public dose feed (no auth). Filtered by `public_visible = true AND expires_at > now()`. |
| `get_shared_stack(text)` | Public read of a stack by share id. |
| `get_follow_counts(uuid)` | Follower + following counts for a profile. |
| `get_user_profile_stats(uuid)` | Aggregated stats for a member profile (streak, dose count, etc.). |
| `recalculate_member_profile_streak(uuid)` | Called by dose_logs trigger. |
| `increment_member_profile_demo_sessions(uuid)` | Called when user enters the main app. |
| `member_profile_public_by_handle_lookup(text)` | Case-insensitive handle resolver. |
| `handle_new_user()` | Trigger function: seeds `profiles` + empty `user_stacks` on signup. |
| `set_updated_at()` | Generic updated_at trigger function. |
| `notify_new_follower_from_follow()` | Inserts into `notifications` on new follow. |
| `dose_logs_touch_member_streak()` | Calls streak recalculation. |
| `profiles_enforce_plan_change()` | Rejects plan updates without session flag. |

## Triggers

- `on_auth_user_created` on `auth.users` — creates `profiles` + empty `user_stacks`.
- `profiles_enforce_plan_change` on `profiles` BEFORE UPDATE — rejects plan changes unless `app.allow_plan_change = 'true'` is set.
- `profiles_updated_at`, `user_stacks_updated_at`, `shopping_lists_updated_at`, `body_metrics_updated_at`, `member_fasts_updated_at`, `notifications_updated_at`, `member_follows_updated_at`, `network_feed_updated_at` — all BEFORE UPDATE, call `set_updated_at()`.
- `dose_logs_recalc_member_streak` on `dose_logs` AFTER INSERT/UPDATE/DELETE — calls `recalculate_member_profile_streak`.
- `member_follows_notify_followee` on `member_follows` AFTER INSERT — inserts `notifications` row.

## RLS model

Every table has RLS enabled. Policies are `auth.uid() = user_id` style, except:

- `member_profiles: select own` — scoped via user_id match (not profile_id).
- `network_feed: select public active` — public access filtered by `public_visible = true AND expires_at > now()`.
- `user_stacks: select network feed` — lets followers see feed-visible stacks.
- `member_follows: select authenticated` — anyone signed in can read (for counter displays).

See `docs/security/rls-audit.md` before touching policies.

## Schema invariants

- `profiles.plan` ∈ `('entry', 'pro', 'elite', 'goat')` — CHECK constraint in 001.
- `member_profiles.handle` — lowercase, 3–32 chars, `^[a-zA-Z0-9][a-zA-Z0-9_.-]{1,30}[a-zA-Z0-9]$`, no consecutive dots (`..`), enforced by `member_profiles_handle_format_chk`.
- `member_profiles.bio` ≤ 500 chars (migration 031).
- `member_fasts.target_hours` > 0, ≤ 2160 (90 days, enforced client-side).
- `user_stacks` unique on `(user_id, profile_id)` — one stack per profile slot.
- One default `member_profile` per user (`is_default = true`).

## Critical migrations to read before editing

- `001_initial_schema.sql` — baseline tables, policies, triggers, RPCs.
- `008_plan_and_stack_photo_security.sql` — plan-lock trigger + `stack_photo_r2_key`. **Critical; don't bypass.**
- `013_member_profiles.sql` — the biggest refactor. Introduces the `(user_id, profile_id)` dual-key pattern. Everything after it keys on `profile_id`.
- `029_member_profiles_current_streak.sql` — streak recalculation trigger.
- `032_member_follows.sql` — social graph.
- `036_notifications_new_follower.sql` — notifications table + follow-triggered insert.
- `045a_user_stacks_stack_name_rename.sql` — the out-of-order migration (sorted between 045 and 046).
- `047_network_feed_public_visible_indexes_ai_queries_drop.sql` — drops `ai_queries`, adds indexes, updates `get_network_feed`.

## Adding a migration

1. New file: `supabase/migrations/NNN_short_name.sql` — `NNN` zero-padded, strictly monotonic.
2. Idempotent DDL: `CREATE ... IF NOT EXISTS`, `DROP ... IF EXISTS`, `CREATE OR REPLACE FUNCTION`.
3. Guard column adds with `ADD COLUMN IF NOT EXISTS`.
4. New table? Include: RLS enable, baseline policies, `updated_at` trigger.
5. Never remove a column the frontend reads. Deprecate first, delete in a follow-up after the frontend stops reading it.
6. Test locally against a branch (`supabase branches`) before production.

## Don't

- Don't update `profiles.plan` directly. Use `update_user_plan(uuid, text)` via service role.
- Don't reference `ai_queries`. It's gone.
- Don't assume `stack_name` exists on `user_stacks` — it was removed in `045a_user_stacks_stack_name_rename.sql`.
- Don't use `SECURITY DEFINER` on new RPCs unless you also set `search_path = public` and revoke from `PUBLIC`.
- Don't let Supabase's schema migrator auto-drop indexes. Always `DROP INDEX IF EXISTS` explicitly if that's the intent.
