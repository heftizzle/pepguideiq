import { createClient } from "@supabase/supabase-js";
import { isSupabaseConfigured } from "./config.js";

const url = import.meta.env.VITE_SUPABASE_URL ?? "";
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? "";

/** Browser client; `null` when env is missing (auth UI will prompt to configure). */
export const supabase = isSupabaseConfigured() ? createClient(url, anonKey) : null;

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
 * @returns {Promise<{ id: string, email: string, name: string, plan: string } | null>}
 */
export async function getCurrentUser() {
  if (!supabase) return null;
  const { data: auth } = await supabase.auth.getUser();
  const u = auth?.user;
  if (!u) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("email, name, plan")
    .eq("id", u.id)
    .maybeSingle();
  return {
    id: u.id,
    email: profile?.email ?? u.email ?? "",
    name: profile?.name ?? u.user_metadata?.name ?? u.email ?? "",
    plan: profile?.plan ?? u.user_metadata?.plan ?? "entry",
  };
}

/** Sync plan to JWT metadata and `public.profiles` (in-app upgrade / checkout). */
export async function updateUserPlan(plan) {
  if (!supabase) return { error: notConfiguredError() };
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth?.user?.id;
  if (!uid) return { error: new Error("Not signed in") };
  const { error: authErr } = await supabase.auth.updateUser({ data: { plan } });
  if (authErr) return { error: authErr };
  const { error: profileErr } = await supabase.from("profiles").update({ plan }).eq("id", uid);
  return { error: profileErr ?? null };
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
 * @returns {Promise<unknown[]>}
 */
export async function loadStack(userId) {
  if (!supabase) return [];
  const { data, error } = await supabase.from("user_stacks").select("stack").eq("user_id", userId).maybeSingle();
  if (error || !data) return [];
  return Array.isArray(data.stack) ? data.stack : [];
}

/**
 * @param {string} userId
 * @param {unknown[]} stack JSON-serializable peptide stack rows
 */
export async function saveStack(userId, stack) {
  if (!supabase) return { error: notConfiguredError() };
  const { error } = await supabase.from("user_stacks").upsert(
    { user_id: userId, stack, updated_at: new Date().toISOString() },
    { onConflict: "user_id" }
  );
  return { error: error ?? null };
}
