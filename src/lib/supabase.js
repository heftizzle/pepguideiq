import { createClient } from "@supabase/supabase-js";
import { isSupabaseConfigured } from "./config.js";

const url = import.meta.env.VITE_SUPABASE_URL ?? "";
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? "";

/** Logs PostgREST 400 bodies in dev (column/schema mismatch, RLS hints, etc.). */
function createBrowserClient() {
  const wrappedFetch = async (input, init) => {
    const res = await fetch(input, init);
    if (import.meta.env.DEV && res.status === 400) {
      try {
        const text = await res.clone().text();
        let detail = text;
        try {
          detail = JSON.parse(text);
        } catch {
          /* keep raw text */
        }
        console.error("[Supabase REST 400]", String(input), detail);
      } catch (e) {
        console.error("[Supabase REST 400]", String(input), e);
      }
    }
    return res;
  };
  return createClient(url, anonKey, { global: { fetch: wrappedFetch } });
}

/** Browser client; `null` when env is missing (auth UI will prompt to configure). */
export const supabase = isSupabaseConfigured() ? createBrowserClient() : null;

function notConfiguredError() {
  return new Error("Supabase is not configured (set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY).");
}

// ─── Auth ───────────────────────────────────────────────────────────────────

/**
 * Sign in with email + password.
 * @returns {{ user: import('@supabase/supabase-js').User | null, session: import('@supabase/supabase-js').Session | null, error: Error | null }}
 */
export async function signIn(email, password) {
  if (!supabase) return { user: null, session: null, error: notConfiguredError() };
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  return { user: data?.user ?? null, session: data?.session ?? null, error: error ?? null };
}

/**
 * Register; stores `name` and `plan` in user_metadata.
 * @returns {{ user: import('@supabase/supabase-js').User | null, error: Error | null }}
 */
export async function signUp(name, email, password, plan = "entry") {
  if (!supabase) return { user: null, error: notConfiguredError() };
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name, plan } },
  });
  return { user: data?.user ?? null, error: error ?? null };
}

export async function signOut() {
  if (!supabase) return;
  await supabase.auth.signOut();
}

/**
 * Profile row from `public.profiles` (see supabase/migrations/001_initial_schema.sql).
 * @returns {Promise<{ id: string, email: string, name: string, plan: string, stackPhotoUrl: string | null, stackPhotoKey: string | null } | null>}
 */
/** Access token for Worker JWT verification (Authorization: Bearer …). */
export async function getSessionAccessToken() {
  if (!supabase) return null;
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

export async function getCurrentUser() {
  if (!supabase) return null;
  const { data: auth } = await supabase.auth.getUser();
  const u = auth?.user;
  if (!u) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("email, name, plan, stack_photo_url, stack_photo_r2_key")
    .eq("id", u.id)
    .maybeSingle();
  const stackPhotoKey =
    profile && typeof profile.stack_photo_r2_key === "string" ? profile.stack_photo_r2_key.trim() : null;
  const stackPhotoUrlLegacy =
    profile && typeof profile.stack_photo_url === "string" ? profile.stack_photo_url.trim() : null;
  return {
    id: u.id,
    email: profile?.email ?? u.email ?? "",
    name: profile?.name ?? u.user_metadata?.name ?? u.email ?? "",
    plan: profile?.plan ?? u.user_metadata?.plan ?? "entry",
    stackPhotoUrl: stackPhotoUrlLegacy,
    stackPhotoKey,
  };
}

/**
 * @param {(session: import('@supabase/supabase-js').Session | null) => void} callback
 */
export function onAuthStateChange(callback) {
  if (!supabase) {
    return { data: { subscription: { unsubscribe() {} } } };
  }
  return supabase.auth.onAuthStateChange((_event, session) => {
    callback(session);
  });
}

// ─── Stack (`public.user_stacks` — see supabase/migrations/001_initial_schema.sql) ─

/**
 * @param {string} userId
 * @returns {Promise<{ stack: unknown[], name: string }>}
 */
export async function loadStack(userId) {
  if (!supabase) return { stack: [], name: "" };
  // Select only columns present in 001_initial_schema. Add stack_name after migration 002_user_stacks_stack_name.sql.
  const { data, error } = await supabase.from("user_stacks").select("stack").eq("user_id", userId).maybeSingle();
  if (error || !data) return { stack: [], name: "" };
  const stack = Array.isArray(data.stack) ? data.stack : [];
  const name = ""; // restore from data.stack_name after adding stack_name to select (migration 002)
  return { stack, name };
}

/**
 * @param {string} userId
 * @param {unknown[]} stack JSON-serializable peptide stack rows
 * @param {string} [stackName] optional display name for the stack
 */
export async function saveStack(userId, stack, stackName = "") {
  if (!supabase) return { error: notConfiguredError() };
  // Omit stack_name until migration 002_user_stacks_stack_name.sql is applied (column must exist for upsert).
  const { error } = await supabase.from("user_stacks").upsert(
    { user_id: userId, stack, updated_at: new Date().toISOString() },
    { onConflict: "user_id" }
  );
  return { error: error ?? null };
}

// ─── Vial tracker (`public.user_vials`, `public.dose_logs`) — migrations 005, 006 ─

/**
 * @param {string} userId
 * @param {string} peptideId
 */
export async function listVialsForPeptide(userId, peptideId) {
  if (!supabase) return { vials: [], error: notConfiguredError() };
  const { data, error } = await supabase
    .from("user_vials")
    .select("*")
    .eq("user_id", userId)
    .eq("peptide_id", peptideId)
    .order("created_at", { ascending: true });
  return { vials: data ?? [], error: error ?? null };
}

/** @param {Record<string, unknown>} row */
export async function insertUserVial(row) {
  if (!supabase) return { data: null, error: notConfiguredError() };
  const { data, error } = await supabase.from("user_vials").insert(row).select("*");
  const row0 = Array.isArray(data) ? data[0] : null;
  return { data: row0, error: error ?? null };
}

/**
 * @param {string} vialId
 * @param {string} userId
 * @param {Record<string, unknown>} patch
 */
export async function updateUserVial(vialId, userId, patch) {
  if (!supabase) return { error: notConfiguredError() };
  const { error } = await supabase.from("user_vials").update(patch).eq("id", vialId).eq("user_id", userId);
  return { error: error ?? null };
}

/**
 * @param {string} vialId
 * @param {string} userId
 */
export async function deleteUserVial(vialId, userId) {
  if (!supabase) return { error: notConfiguredError() };
  const { error } = await supabase.from("user_vials").delete().eq("id", vialId).eq("user_id", userId);
  return { error: error ?? null };
}

/**
 * @param {string} vialId
 * @param {string} userId
 * @param {number} [limit]
 */
export async function listRecentDosesForVial(vialId, userId, limit = 5) {
  if (!supabase) return { doses: [], error: notConfiguredError() };
  const { data, error } = await supabase
    .from("dose_logs")
    .select("id, dosed_at, dose_mcg, notes")
    .eq("vial_id", vialId)
    .eq("user_id", userId)
    .order("dosed_at", { ascending: false })
    .limit(limit);
  return { doses: data ?? [], error: error ?? null };
}

/**
 * @param {string} userId
 * @param {string} peptideId
 */
export async function listDoseLogsForPeptideLast30Days(userId, peptideId) {
  if (!supabase) return { doses: [], error: notConfiguredError() };
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - 29);
  const { data, error } = await supabase
    .from("dose_logs")
    .select("id, vial_id, dosed_at, dose_mcg, notes")
    .eq("user_id", userId)
    .eq("peptide_id", peptideId)
    .gte("dosed_at", start.toISOString())
    .order("dosed_at", { ascending: false });
  return { doses: data ?? [], error: error ?? null };
}

/**
 * Dose logs for a peptide in an inclusive wall-time range (ISO strings from local day bounds).
 * @param {string} userId
 * @param {string} peptideId
 * @param {string} startIso
 * @param {string} endIso
 */
export async function listDoseLogsForPeptideRange(userId, peptideId, startIso, endIso) {
  if (!supabase) return { doses: [], error: notConfiguredError() };
  const { data, error } = await supabase
    .from("dose_logs")
    .select("id, vial_id, dosed_at, dose_mcg, notes")
    .eq("user_id", userId)
    .eq("peptide_id", peptideId)
    .gte("dosed_at", startIso)
    .lte("dosed_at", endIso)
    .order("dosed_at", { ascending: false });
  return { doses: data ?? [], error: error ?? null };
}

/**
 * @param {{ user_id: string, vial_id: string, peptide_id: string, dose_mcg: number, notes?: string | null, dosed_at?: string }} row
 */
export async function insertDoseLog(row) {
  if (!supabase) return { error: notConfiguredError() };
  const { error } = await supabase.from("dose_logs").insert(row);
  return { error: error ?? null };
}

export async function listRecentDosedAtDates(userId) {
  if (!isSupabaseConfigured()) return { dates: [], error: null };
  const since = new Date();
  since.setDate(since.getDate() - 400);
  const { data, error } = await supabase
    .from("dose_logs")
    .select("dosed_at")
    .eq("user_id", userId)
    .gte("dosed_at", since.toISOString())
    .order("dosed_at", { ascending: false });
  return { dates: data?.map((r) => r.dosed_at) ?? [], error };
}
