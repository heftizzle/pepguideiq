# Supabase Row Level Security audit

**Scope:** `public` schema as defined in `supabase/migrations` in this repository.  
**Date:** 2026-03-31  

A live Supabase project may add grants or policies outside this repo; confirm with **Database → Roles**, **Tables**, and **SQL** in the Dashboard or `pg_policies` / `information_schema` if the deployed database differs.

**Anon role (direct tables):** Migrations do not include `GRANT ... ON <table> ... TO anon` for any audited table. RLS policies that apply to `PUBLIC` (no `TO` clause) still require predicates like `auth.uid() = user_id` or membership checks, so unauthenticated clients see **no matching rows** and cannot satisfy `WITH CHECK` for inserts/updates. Effective outcome for end-user data: **denied** unless your project grants extra privileges and adds permissive policies (verify in production).

---

### profiles

- RLS enabled: yes (`001_initial_schema.sql`, `008_plan_and_stack_photo_security.sql` trigger only)
- anon SELECT: denied (policies require `auth.uid() = id`; no rows for anon)
- anon INSERT: denied (no INSERT policy for clients; rows created via `handle_new_user` trigger / service paths)
- anon UPDATE: denied (`auth.uid() = id` in `profiles: update own`)
- anon DELETE: denied (no DELETE policy)
- authenticated: `profiles: select own` — SELECT own row; `profiles: update own` — UPDATE own row; `profiles_enforce_plan_change` trigger blocks direct `plan` changes except via `update_user_plan` (service role only per `008`)
- Status: ✅ OK
- Notes: Plan column protected by trigger + `update_user_plan` restricted to `service_role` in `008`.

---

### user_stacks (saved stacks; product “stacks”)

- RLS enabled: yes
- anon SELECT: denied (scoped “own” policies require `auth.uid()`; network-feed policy is `TO authenticated` only)
- anon INSERT: denied
- anon UPDATE: denied
- anon DELETE: denied
- authenticated: `user_stacks: select|insert|update|delete own` — CRUD only for rows where `user_id = auth.uid()` and `profile_id` belongs to the user via `member_profiles`; **plus** `user_stacks: select network feed` (`023_network_feed.sql`) — **SELECT** any row with `feed_visible = true` (other users’ feed-visible stacks)
- Status: ⚠️ REVIEW
- Notes: Network feed policy intentionally exposes metadata/stack JSON for opted-in stacks to all signed-in users. Public share links use `get_shared_stack(TEXT)` (see below), not direct table access.

---

### user_vials (product “vials”)

- RLS enabled: yes (`005_user_vials.sql`, policies replaced in `013_member_profiles.sql`)
- anon SELECT: denied
- anon INSERT: denied
- anon UPDATE: denied
- anon DELETE: denied
- authenticated: `Users own their vials` — `FOR ALL` with `USING`/`WITH CHECK` requiring `auth.uid() = user_id`, non-null `profile_id`, and matching `member_profiles` row; `GRANT ALL ON public.user_vials TO authenticated` (`005`) — **RLS** still limits rows
- Status: ✅ OK
- Notes: Table privilege is broad; access is constrained by RLS.

---

### dose_logs

- RLS enabled: yes (`006_dose_logs.sql`, policies replaced in `013_member_profiles.sql`)
- anon SELECT: denied
- anon INSERT: denied
- anon UPDATE: denied
- anon DELETE: denied
- authenticated: `Users own their dose logs` — same scoped pattern as `user_vials`; `GRANT ALL` to `authenticated` (`006`)
- Status: ✅ OK
- Notes: `020_dose_logs_non_injectable.sql` alters columns only; RLS unchanged.

---

### member_profiles

- RLS enabled: yes (`013_member_profiles.sql`)
- anon SELECT: denied
- anon INSERT: denied (no INSERT policy; creation via service role / triggers as documented in migration comments)
- anon UPDATE: denied (`member_profiles: update own`)
- anon DELETE: denied (no DELETE policy)
- authenticated: `member_profiles: select own` — SELECT own rows; `member_profiles: update own` — UPDATE own rows; `GRANT SELECT, UPDATE ... TO authenticated`
- Status: ✅ OK
- Notes: INSERT intentionally not granted to `authenticated` in migrations.

---

### body_metrics

- RLS enabled: yes (`013_member_profiles.sql`; policies replaced in `016_body_metrics_columns.sql`)
- anon SELECT: denied
- anon INSERT: denied
- anon UPDATE: denied
- anon DELETE: denied
- authenticated: `body_metrics: select|insert|update|delete scoped` — each operation requires `auth.uid() = user_id` and a valid `member_profiles` link for `profile_id`; `GRANT ALL ON public.body_metrics TO authenticated`
- Status: ✅ OK

---

### ai_queries

- **Removed** in `047_network_feed_public_visible_indexes_ai_queries_drop.sql` (unused; Worker uses KV + `query_log` for usage). `get_daily_ai_count` now counts from `query_log`.

---

### query_log

- RLS enabled: yes (`003_query_log.sql`)
- anon SELECT: denied
- anon INSERT: denied (no INSERT policy for `authenticated`)
- anon UPDATE: denied
- anon DELETE: denied
- authenticated: `Users can view own query log` — SELECT only where `auth.uid() = user_id`
- Status: ✅ OK
- Notes: Inserts expected from backend/service role paths only.

---

### stacks / vials / stack_compounds / progress_photos / scan_uploads / subscriptions

- RLS enabled: n/a — **these table names are not created** in `supabase/migrations`.
- anon SELECT / INSERT / UPDATE / DELETE: n/a
- authenticated: n/a
- Status: n/a
- Notes: Use **`user_stacks`** and **`user_vials`** above. If these names exist only in production, audit them there.

---

## Non-table: RPCs affecting anon

These are not RLS policies on tables but affect what **anon** can read.

| RPC | Granted to | Risk |
|-----|------------|------|
| `get_shared_stack(TEXT)` | `anon`, `authenticated` (`010_stack_sharing.sql`, `011_user_stacks_public_share_no_stack_name.sql`) | ⚠️ **RISK** — Returns stack JSON for a matching `share_id` without auth (by design for share links). Not unrestricted table access; mitigated by opaque `share_id` and no list/enumeration via RLS. |
| `get_network_feed()` | `authenticated` only (`023_network_feed.sql`) | Not anon-accessible. |

---

## Summary

| Severity | Item |
|----------|------|
| 🔴 CRITICAL | **None** — every table defined in migrations has `ENABLE ROW LEVEL SECURITY`. |
| ⚠️ REVIEW | **`user_stacks`**: `user_stacks: select network feed` allows any **authenticated** user to SELECT rows with `feed_visible = true` (cross-user visibility by design). |
| ⚠️ RISK | **`get_shared_stack(TEXT)`** for **anon**: intentional public read of one stack by `share_id`; ensure `share_id` is unguessable and rate-limit at the edge if needed. |

---

## Changes Applied

**None.** No table in this repository’s migrations has RLS disabled, so **Part 3** (enable RLS + default-deny for anon on user tables) did not require a new migration. Re-run this audit after any out-of-band Dashboard or SQL changes in production.
