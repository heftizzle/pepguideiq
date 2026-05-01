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
| `hashtags` / `post_hashtags` | Lowercase tag registry + junction to `posts`; `post_count` maintained by triggers on `posts.content` / delete. |
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
| `get_network_feed()` | Feed joined with `member_profiles` + `user_stacks` for the caller. As of 073, INNER JOINs `public.posts` on `source_kind='stack' AND source_id=user_stacks.id AND visible_network=true`; emits `post_id`, `like_count`, `comment_count` per row for Network tab LikeButton / CommentsSection. |
| `get_public_network_dose_feed()` | Public dose feed (no auth). Filtered by `public_visible = true AND expires_at > now()`. |
| `get_shared_stack(text)` | Public read of a stack by share id. |
| `get_follow_counts(uuid)` | Follower + following counts for a profile. |
| `get_user_profile_stats(uuid)` | Aggregated stats for a member profile (streak, dose count, etc.). |
| `recalculate_member_profile_streak(uuid)` | Called by dose_logs trigger. |
| `increment_member_profile_demo_sessions(uuid)` | Called when user enters the main app. |
| `member_profile_public_by_handle_lookup(text)` | Case-insensitive handle resolver. |
| `handle_new_user()` | Trigger function: seeds `profiles` + empty `user_stacks` on signup. |
| `set_stack_feed_visible(uuid, boolean)` | Owner-scoped toggle for `user_stacks.feed_visible`. Mirrors into `public.posts` via partial unique index `posts_one_per_source_idx` (`source_kind = 'stack'`, `source_id` = stack id). Verifies `auth.uid() = user_stacks.user_id`; raises `42501` otherwise, `P0002` if missing. `SECURITY DEFINER`; `search_path = public`; granted to `authenticated` only. |
| `get_post_likers(uuid)` | Returns flat liker rows (`like_id, profile_id, handle, display_handle, display_name, avatar_r2_key, liker_goal_emoji, created_at`) for a post, bypassing `member_profiles` RLS. Parent post must be `visible_profile` or `visible_network` or owned by the caller. `SECURITY DEFINER`; `search_path = public`; granted to `anon, authenticated`. (074) |
| `get_comment_likers(uuid)` | Same row shape; visibility gated on the parent post via `comments` → `posts`. (074) |
| `set_vial_feed_visible(uuid, boolean)` | Owner toggles Network visibility for a vial; UPSERT into `posts` (`source_kind='vial'`, `source_id=user_vials.id`). Raises `22023` if `user_vials.archived_at` is set, `42501` if not owner, `P0002` if missing. `SECURITY DEFINER`; granted to `authenticated`. (077) |
| `get_network_vial_feed()` | Network shared vials (max 50): INNER JOIN `posts` on `source_kind='vial'` + `visible_network=true`, excludes archived vials; emits engagement ids (`post_id`, `like_count`, `comment_count`) plus vial JSON fields. `SECURITY DEFINER`; granted to `authenticated`. (078) |
| `cleanup_post_on_vial_delete()` / `cleanup_post_on_vial_archive()` | `SECURITY DEFINER` trigger helpers: delete mirrored `posts` row when a vial row is deleted or first archived (`archived_at` set from null). (077) |
| `set_updated_at()` | Generic updated_at trigger function. |
| `notify_new_follower_from_follow()` | Inserts into `notifications` on new follow. |
| `dose_logs_touch_member_streak()` | Calls streak recalculation. |
| `profiles_enforce_plan_change()` | Rejects plan updates without session flag. |

## Triggers

- `on_auth_user_created` on `auth.users` — creates `profiles` + empty `user_stacks`.
- `profiles_enforce_plan_change` on `profiles` BEFORE UPDATE — rejects plan changes unless `app.allow_plan_change = 'true'` is set.
- `profiles_updated_at`, `user_stacks_updated_at`, `shopping_lists_updated_at`, `body_metrics_updated_at`, `member_fasts_updated_at`, `notifications_updated_at`, `member_follows_updated_at`, `network_feed_updated_at` — all BEFORE UPDATE, call `set_updated_at()`.
- `dose_logs_recalc_member_streak` on `dose_logs` AFTER INSERT/UPDATE/DELETE — calls `recalculate_member_profile_streak`.
- `trg_cleanup_post_on_stack_delete` on `user_stacks` AFTER DELETE — removes the matching `posts` row (`source_kind = 'stack'`, `source_id = OLD.id`); `post_likes` / `comments` / `comment_likes` and `notifications.target_post_id` cascade via 071 FKs.
- `trg_cleanup_post_on_vial_delete` on `user_vials` AFTER DELETE — removes `posts` where `source_kind = 'vial'` and `source_id = OLD.id` (077).
- `trg_cleanup_post_on_vial_archive` on `user_vials` AFTER UPDATE OF `archived_at` — when `archived_at` becomes non-null, deletes the mirrored `posts` row so Network cards disappear (077).
- `member_follows_notify_followee` on `member_follows` AFTER INSERT — inserts `notifications` row.
- Engagement denorm sync (`sync_post_like_count`, `sync_post_comment_count`, `sync_comment_like_count` from 071; recreated `SECURITY DEFINER` in 075): triggers must bump `posts`/`comments` counters despite RLS — `posts` and `comments` have no `UPDATE` policy, so without `SECURITY DEFINER` the trigger `UPDATE`s were silently filtered to zero rows and counts stayed wrong until backfill (075). This pattern — `SECURITY DEFINER` on triggers that need to write through RLS-enabled tables without `UPDATE` policies — should be the default for any future denorm-sync trigger on tables that are read-public but not write-public (e.g. Phase 4 vial counters / `cleanup_post_on_vial_delete`-adjacent work).

## RLS model

Every table has RLS enabled. Policies are `auth.uid() = user_id` style, except:

- `member_profiles: select own` — scoped via user_id match (not profile_id).
- `network_feed: select public active` — public access filtered by `public_visible = true AND expires_at > now()`.
- `user_stacks: select network feed` — lets followers see feed-visible stacks.
- `member_follows: select authenticated` — anyone signed in can read (for counter displays).

See `docs/security/rls-audit.md` before touching policies.

## Schema invariants

- `profiles.plan` ∈ `('entry', 'pro', 'elite', 'goat')` — CHECK constraint in 001.
- `member_profiles.handle` — optional public @handle; as of `091_member_profiles_handle_strict_format.sql`: letter-first, 3–30 chars, `^[a-z][a-z0-9_-]{2,29}$`, reserved slugs blocked, enforced by `member_profiles_handle_format_chk` + global unique index on non-null `handle`.
- `member_profiles.bio` ≤ 500 chars (migration 031).
- `member_fasts.target_hours` > 0, ≤ 2160 (90 days, enforced client-side).
- `user_stacks` unique on `(user_id, profile_id)` — one stack per profile slot.
- One default `member_profile` per user (`is_default = true`).

## Polymorphic post sources (072)

`public.posts` carries a `source_kind public.post_source_kind` enum (`'media' | 'stack'`; **`'vial'` added in 076**) plus nullable `source_id uuid`. CHECK `posts_source_consistency`: `source_kind = 'media' ⇔ source_id IS NULL`.

Re-share is idempotent: partial unique index `posts_one_per_source_idx` on `(profile_id, source_kind, source_id) WHERE source_kind <> 'media'`. Hydration index: `posts_source_idx` on `(source_kind, source_id) WHERE source_kind <> 'media'`.

**Phase 1 = DB only.** The Saved Stacks UI still writes `feed_visible` through `updateStack` in the client (`user_stacks` is source of truth). **Phase 2** switches the toggle to `rpc('set_stack_feed_visible', { p_stack_id, p_visible })` so `posts` stays in sync. **Phase 3 (073)** wires `get_network_feed()` to JOIN `posts` and emit `post_id` / `like_count` / `comment_count` so the Network tab can render likes and comments on stack-share cards.

**Migration 074** adds `get_post_likers` / `get_comment_likers` RPCs so `LikersModal` no longer relies on PostgREST `member_profiles!inner(...)` (that embed dropped likers whose profile rows were hidden by RLS). **Migration 075** fixes denormalized counters (`posts.like_count`, `posts.comment_count`, `comments.like_count`, `comments.reply_count`) by making the 071 sync trigger functions `SECURITY DEFINER` (same root cause as invisible updates under RLS without `UPDATE` policies) and backfills counts from actual rows.

**Migrations 076–078 (Phase 4 — vials)** extend the same pattern to vials: enum label `'vial'` (076); `user_vials.archived_at`, `user_vials.share_notes_to_network`, cleanup triggers + `set_vial_feed_visible` (077); `get_network_vial_feed()` for the Network tab (078).

### Vial lifecycle (077+)

Active vials stay in the tracker list (`archived_at IS NULL`). Archiving sets `archived_at` and deletes the mirrored `posts` row via trigger — engagement survives only while the post exists; unsharing toggles `visible_network` without deleting the post row until archive/delete. Unarchive clears `archived_at` so the vial returns to the active list; resharing uses `set_vial_feed_visible` again (fresh UPSERT after archive removed the prior post).

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
