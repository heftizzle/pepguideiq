import { createClient } from "@supabase/supabase-js";
import { API_WORKER_URL, isApiWorkerConfigured, isSupabaseConfigured } from "./config.js";
import { generateShareId8 } from "./stackShare.js";

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
    .select(
      "email, name, plan, stack_photo_url, stack_photo_r2_key, display_name, avatar_r2_key, default_session"
    )
    .eq("id", u.id)
    .maybeSingle();
  const stackPhotoKey =
    profile && typeof profile.stack_photo_r2_key === "string" ? profile.stack_photo_r2_key.trim() : null;
  const stackPhotoUrlLegacy =
    profile && typeof profile.stack_photo_url === "string" ? profile.stack_photo_url.trim() : null;
  const legacyName = profile?.name ?? u.user_metadata?.name ?? "";
  const displayRaw = profile && typeof profile.display_name === "string" ? profile.display_name.trim() : "";
  const displayName = displayRaw || String(legacyName || "").trim() || (u.email ?? "").split("@")[0] || "";
  const ds =
    profile && typeof profile.default_session === "string" && profile.default_session.trim()
      ? profile.default_session.trim()
      : "morning";
  return {
    id: u.id,
    email: profile?.email ?? u.email ?? "",
    name: typeof legacyName === "string" ? legacyName : "",
    plan: profile?.plan ?? u.user_metadata?.plan ?? "entry",
    stackPhotoUrl: stackPhotoUrlLegacy,
    stackPhotoKey,
    displayName,
    avatarR2Key:
      profile && typeof profile.avatar_r2_key === "string" && profile.avatar_r2_key.trim()
        ? profile.avatar_r2_key.trim()
        : null,
    defaultSession: ["morning", "afternoon", "evening", "night"].includes(ds) ? ds : "morning",
    identities: Array.isArray(u.identities) ? u.identities : [],
  };
}

/**
 * Body metrics for one member profile (`public.body_metrics`).
 * @param {string} profileId — member_profiles.id
 * @returns {Promise<{ row: object | null, error: Error | null }>}
 */
export async function fetchBodyMetrics(profileId) {
  if (!supabase) return { row: null, error: notConfiguredError() };
  const pid = typeof profileId === "string" ? profileId.trim() : "";
  if (!pid) return { row: null, error: new Error("Missing profile") };
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth?.user?.id;
  if (!uid) return { row: null, error: new Error("Not signed in") };
  const { data, error } = await supabase
    .from("body_metrics")
    .select("goal, weight_lbs, height_in, body_fat_pct, weight_unit")
    .eq("user_id", uid)
    .eq("profile_id", pid)
    .maybeSingle();
  return { row: data ?? null, error: error ?? null };
}

/**
 * Partial update or first insert for `public.body_metrics` (scoped by user_id + profile_id).
 * @param {string} userId
 * @param {string} profileId
 * @param {Record<string, unknown>} patch — snake_case columns: goal, weight_lbs, height_in, body_fat_pct, weight_unit
 */
export async function upsertBodyMetrics(userId, profileId, patch) {
  if (!supabase) return { error: notConfiguredError() };
  if (!userId || !profileId) return { error: new Error("Missing user or profile") };
  const now = new Date().toISOString();
  const { data: existing, error: readErr } = await supabase
    .from("body_metrics")
    .select("id")
    .eq("user_id", userId)
    .eq("profile_id", profileId)
    .maybeSingle();
  if (readErr) return { error: readErr };
  const payload = { ...patch, updated_at: now };
  if (existing) {
    const { error } = await supabase
      .from("body_metrics")
      .update(payload)
      .eq("user_id", userId)
      .eq("profile_id", profileId);
    return { error: error ?? null };
  }
  const { error } = await supabase.from("body_metrics").insert({
    user_id: userId,
    profile_id: profileId,
    ...payload,
  });
  return { error: error ?? null };
}

/**
 * @param {Record<string, unknown>} patch — profiles columns only
 */
export async function updateUserProfile(patch) {
  if (!supabase) return { error: notConfiguredError() };
  const { data: auth } = await supabase.auth.getUser();
  const id = auth?.user?.id;
  if (!id) return { error: new Error("Not signed in") };
  const { error } = await supabase
    .from("profiles")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id);
  return { error: error ?? null };
}

/**
 * @param {string | null | undefined} profileId — active member_profiles.id; null uses default profile server-side.
 * @returns {Promise<{ doseCount: number, peptideDistinct: number, activeVials: number, daysTracked: number } | null>}
 */
export async function fetchUserProfileStats(profileId) {
  if (!supabase) return null;
  const { data, error } = await supabase.rpc("get_user_profile_stats", {
    p_profile_id: profileId && String(profileId).trim() ? String(profileId).trim() : null,
  });
  if (error || data == null || typeof data !== "object") return null;
  return {
    doseCount: typeof data.dose_count === "number" ? data.dose_count : 0,
    peptideDistinct: typeof data.peptide_distinct === "number" ? data.peptide_distinct : 0,
    activeVials: typeof data.active_vials === "number" ? data.active_vials : 0,
    daysTracked: typeof data.days_tracked === "number" ? data.days_tracked : 0,
  };
}

/**
 * Netflix-style sub-profiles for the signed-in account (table: member_profiles).
 * @returns {Promise<{ profiles: object[], error: Error | null }>}
 */
export async function listMemberProfiles(userId) {
  if (!supabase || !userId) return { profiles: [], error: notConfiguredError() };
  const { data, error } = await supabase
    .from("member_profiles")
    .select(
      "id, user_id, display_name, avatar_url, is_default, created_at, city, state, country, language, shift_schedule, wake_time, handle, demo_sessions_shown"
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: true });
  return { profiles: data ?? [], error: error ?? null };
}

/**
 * Loads member profiles via Worker GET /member-profiles when configured; otherwise Supabase.
 * @returns {Promise<{ profiles: object[], error: Error | null }>}
 */
export async function fetchMemberProfiles(userId) {
  if (!userId) return { profiles: [], error: notConfiguredError() };
  if (!isSupabaseConfigured() && !isApiWorkerConfigured()) {
    return { profiles: [], error: notConfiguredError() };
  }
  if (isApiWorkerConfigured()) {
    const token = await getSessionAccessToken();
    if (token) {
      try {
        const res = await fetch(`${API_WORKER_URL}/member-profiles`, {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const j = await res.json();
          if (j && typeof j === "object" && Array.isArray(j.profiles)) {
            return { profiles: j.profiles, error: null };
          }
        }
      } catch {
        /* fall through to Supabase */
      }
    }
  }
  return listMemberProfiles(userId);
}

/**
 * Patch one row in `member_profiles` (RLS: own rows only).
 * @param {string} profileId — member_profiles.id
 * @param {Record<string, unknown>} patch — e.g. { display_name }, { avatar_url }
 */
export async function updateMemberProfile(profileId, patch) {
  if (!supabase) return { error: notConfiguredError() };
  const pid = typeof profileId === "string" ? profileId.trim() : "";
  if (!pid) return { error: new Error("Missing profile") };
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth?.user?.id;
  if (!uid) return { error: new Error("Not signed in") };
  const { error } = await supabase
    .from("member_profiles")
    .update(patch)
    .eq("id", pid)
    .eq("user_id", uid);
  return { error: error ?? null };
}

/** Dev / testing: set `demo_sessions_shown` to 0 for the signed-in user's profile row. */
export async function resetMemberProfileDemoSessions(profileId) {
  return updateMemberProfile(profileId, { demo_sessions_shown: 0 });
}

/**
 * Atomically increment demo_sessions_shown for the active member profile (call after successful sign-in).
 * @param {string} profileId — member_profiles.id
 * @returns {Promise<{ count: number, error: Error | null }>}
 */
export async function incrementMemberProfileDemoSessions(profileId) {
  if (!supabase) return { count: 0, error: notConfiguredError() };
  const pid = typeof profileId === "string" ? profileId.trim() : "";
  if (!pid) return { count: 0, error: new Error("Missing profile") };
  const { data, error } = await supabase.rpc("increment_member_profile_demo_sessions", {
    p_profile_id: pid,
  });
  const n = typeof data === "number" ? data : Number(data);
  return { count: Number.isFinite(n) ? n : 0, error: error ?? null };
}

/** POST Worker /member-profiles — tier slot enforcement server-side. */
export async function createMemberProfileViaWorker(displayName) {
  if (!isApiWorkerConfigured()) {
    return { profile: null, error: new Error("API worker is not configured (VITE_API_WORKER_URL).") };
  }
  const token = await getSessionAccessToken();
  if (!token) return { profile: null, error: new Error("Not signed in") };
  const res = await fetch(`${API_WORKER_URL}/member-profiles`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ display_name: String(displayName ?? "").trim() }),
  });
  if (res.status === 403) {
    return { profile: null, error: new Error("Upgrade your plan to add more profiles") };
  }
  if (!res.ok) {
    let msg = "Could not create profile";
    try {
      const j = await res.json();
      if (j && typeof j.error === "string") msg = j.error;
      if (j && typeof j.details === "string" && j.details.trim()) msg = `${msg}: ${j.details.trim()}`;
      if (j && typeof j.hint === "string" && j.hint.trim()) msg = `${msg}. ${j.hint.trim()}`;
    } catch {
      /* ignore */
    }
    return { profile: null, error: new Error(msg) };
  }
  try {
    const j = await res.json();
    const p = j && typeof j === "object" && j.profile && typeof j.profile === "object" ? j.profile : null;
    return { profile: p, error: null };
  } catch {
    return { profile: null, error: new Error("Invalid response") };
  }
}

/** PATCH Worker /member-profiles/:profileId — display_name, locale, schedule, handle, etc. */
export async function patchMemberProfileViaWorker(profileId, body) {
  if (!isApiWorkerConfigured()) {
    return { error: new Error("API worker is not configured (VITE_API_WORKER_URL).") };
  }
  const token = await getSessionAccessToken();
  if (!token) return { error: new Error("Not signed in") };
  const id = typeof profileId === "string" ? profileId.trim() : "";
  if (!id) return { error: new Error("Missing profile") };
  const res = await fetch(`${API_WORKER_URL}/member-profiles/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body && typeof body === "object" ? body : {}),
  });
  if (!res.ok) {
    let msg = "Could not update profile";
    try {
      const j = await res.json();
      if (j && typeof j.error === "string") msg = j.error;
    } catch {
      /* ignore */
    }
    return { error: new Error(msg) };
  }
  return { error: null };
}

/**
 * GET Worker /member-profiles/handle-available?handle=…&exclude=…
 * @returns {Promise<{ available: boolean, reason?: string, error: Error | null }>}
 */
export async function checkMemberProfileHandleAvailable(handle, excludeProfileId) {
  if (!isApiWorkerConfigured()) {
    return { available: false, error: new Error("API worker is not configured (VITE_API_WORKER_URL).") };
  }
  const token = await getSessionAccessToken();
  if (!token) return { available: false, error: new Error("Not signed in") };
  const raw = String(handle ?? "").trim();
  if (!raw) {
    return { available: false, reason: "empty", error: null };
  }
  const params = new URLSearchParams({ handle: raw });
  if (excludeProfileId) params.set("exclude", excludeProfileId);
  try {
    const res = await fetch(`${API_WORKER_URL}/member-profiles/handle-available?${params.toString()}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      let msg = "Could not check handle";
      try {
        const j = await res.json();
        if (j && typeof j.error === "string") msg = j.error;
      } catch {
        /* ignore */
      }
      return { available: false, error: new Error(msg) };
    }
    const j = await res.json();
    const available = j && typeof j === "object" && j.available === true;
    const reason = j && typeof j === "object" && typeof j.reason === "string" ? j.reason : undefined;
    return { available, reason, error: null };
  } catch (e) {
    return { available: false, error: e instanceof Error ? e : new Error("Network error") };
  }
}

/** DELETE Worker /member-profiles/:profileId (default profile rejected server-side). */
export async function deleteMemberProfileViaWorker(profileId) {
  if (!isApiWorkerConfigured()) {
    return { error: new Error("API worker is not configured (VITE_API_WORKER_URL).") };
  }
  const token = await getSessionAccessToken();
  if (!token) return { error: new Error("Not signed in") };
  const id = typeof profileId === "string" ? profileId.trim() : "";
  if (!id) return { error: new Error("Missing profile") };
  const res = await fetch(`${API_WORKER_URL}/member-profiles/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 403) {
    return { error: new Error("Cannot delete the default profile") };
  }
  if (!res.ok) {
    let msg = "Could not delete profile";
    try {
      const j = await res.json();
      if (j && typeof j.error === "string") msg = j.error;
    } catch {
      /* ignore */
    }
    return { error: new Error(msg) };
  }
  return { error: null };
}

export async function sendPasswordResetEmail(email, redirectTo) {
  if (!supabase) return { error: notConfiguredError() };
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: redirectTo ?? (typeof window !== "undefined" ? `${window.location.origin}/` : undefined),
  });
  return { error: error ?? null };
}

export async function updateAuthEmail(newEmail) {
  if (!supabase) return { error: notConfiguredError() };
  const { error } = await supabase.auth.updateUser({ email: newEmail.trim() });
  return { error: error ?? null };
}

/** Requires Worker route POST /account/delete + service role. */
export async function deleteAccountViaWorker() {
  if (!isApiWorkerConfigured()) {
    return { error: new Error("API worker is not configured (VITE_API_WORKER_URL).") };
  }
  const token = await getSessionAccessToken();
  if (!token) return { error: new Error("Not signed in") };
  const res = await fetch(`${API_WORKER_URL}/account/delete`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    let msg = "Could not delete account";
    try {
      const j = await res.json();
      if (j && typeof j.error === "string") msg = j.error;
    } catch {
      /* ignore */
    }
    return { error: new Error(msg) };
  }
  return { error: null };
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

// ─── Stack (`public.user_stacks`: user_id PK, stack JSONB, updated_at, share_id) ─

/**
 * @param {string} userId
 * @param {string} profileId — member_profiles.id
 * @returns {Promise<{ stack: unknown[], shareId: string | null }>}
 */
export async function loadStack(userId, profileId) {
  if (!supabase || !profileId) return { stack: [], shareId: null, feedVisible: false };
  const { data, error } = await supabase
    .from("user_stacks")
    .select("stack, share_id, feed_visible")
    .eq("user_id", userId)
    .eq("profile_id", profileId)
    .maybeSingle();
  if (error || !data) return { stack: [], shareId: null, feedVisible: false };
  const stack = Array.isArray(data.stack) ? data.stack : [];
  const shareRaw = data.share_id;
  const shareId =
    typeof shareRaw === "string" && shareRaw.trim() ? shareRaw.trim() : null;
  const feedVisible = Boolean(data.feed_visible);
  return { stack, shareId, feedVisible };
}

/**
 * Partial update of `user_stacks` (RLS: own row). Used for feed_visible, etc.
 * @param {string} userId
 * @param {string} profileId
 * @param {Record<string, unknown>} patch
 */
export async function updateStack(userId, profileId, patch) {
  if (!supabase) return { error: notConfiguredError() };
  if (!userId || !profileId) return { error: new Error("Missing user or profile") };
  const { error } = await supabase
    .from("user_stacks")
    .update(patch)
    .eq("user_id", userId)
    .eq("profile_id", profileId);
  return { error: error ?? null };
}

/**
 * Authenticated network feed: stacks with feed_visible and share_id (RPC get_network_feed).
 * @returns {Promise<object[]>}
 */
export async function fetchNetworkFeed() {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase.rpc("get_network_feed");
    if (error) return [];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

/**
 * @param {string} userId
 * @param {string} profileId — member_profiles.id
 * @param {unknown[]} stack JSON-serializable peptide stack rows
 */
export async function saveStack(userId, profileId, stack) {
  if (!supabase) return { error: notConfiguredError() };
  if (!profileId) return { error: new Error("Missing profile") };
  const { error } = await supabase.from("user_stacks").upsert(
    {
      user_id: userId,
      profile_id: profileId,
      stack,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,profile_id" }
  );
  return { error: error ?? null };
}

/**
 * Create or return share_id for the user's saved stack row (migration 010).
 * @param {string} userId
 * @param {string} profileId
 * @returns {Promise<{ shareId: string | null, error: Error | null }>}
 */
export async function ensureUserStackShareId(userId, profileId) {
  if (!supabase || !userId || !profileId) return { shareId: null, error: notConfiguredError() };
  const { data: row, error: readErr } = await supabase
    .from("user_stacks")
    .select("share_id")
    .eq("user_id", userId)
    .eq("profile_id", profileId)
    .maybeSingle();
  if (readErr) return { shareId: null, error: readErr };
  const existing =
    row && typeof row.share_id === "string" && row.share_id.trim() ? row.share_id.trim() : null;
  if (existing) return { shareId: existing, error: null };

  for (let attempt = 0; attempt < 12; attempt++) {
    const candidate = generateShareId8();
    const { data: updated, error: upErr } = await supabase
      .from("user_stacks")
      .update({ share_id: candidate })
      .eq("user_id", userId)
      .eq("profile_id", profileId)
      .is("share_id", null)
      .select("share_id")
      .maybeSingle();

    if (upErr) {
      if (upErr.code === "23505") continue;
      return { shareId: null, error: upErr };
    }
    if (updated?.share_id) {
      const sid = String(updated.share_id).trim();
      return { shareId: sid || null, error: null };
    }

    const { data: again } = await supabase
      .from("user_stacks")
      .select("share_id")
      .eq("user_id", userId)
      .eq("profile_id", profileId)
      .maybeSingle();
    const sid2 =
      again && typeof again.share_id === "string" && again.share_id.trim()
        ? again.share_id.trim()
        : null;
    if (sid2) return { shareId: sid2, error: null };
  }

  return { shareId: null, error: new Error("Could not allocate share id") };
}

/**
 * Public read via RPC (anon). Returns { stack } or null data when not found.
 * @param {string} shareId
 */
export async function fetchSharedStackByShareId(shareId) {
  if (!supabase) return { data: null, error: notConfiguredError() };
  const sid = typeof shareId === "string" ? shareId.trim() : "";
  if (!sid) return { data: null, error: new Error("Invalid share id") };
  const { data, error } = await supabase.rpc("get_shared_stack", { p_share_id: sid });
  if (error) return { data: null, error };
  if (data == null || typeof data !== "object") return { data: null, error: null };
  const stack = Array.isArray(data.stack) ? data.stack : [];
  return { data: { stack }, error: null };
}

// ─── Vial tracker (`public.user_vials`, `public.dose_logs`) — migrations 005, 006, 009 ─

/**
 * R2 keys for Vials-tab hero stack shots (migration 009).
 * @param {string} userId
 * @returns {Promise<{ key1: string | null, key2: string | null, error: Error | null }>}
 */
export async function getProfileStackShotR2Keys(userId) {
  if (!supabase || !userId) return { key1: null, key2: null, error: notConfiguredError() };
  const { data, error } = await supabase
    .from("profiles")
    .select("stack_shot_1_r2_key, stack_shot_2_r2_key")
    .eq("id", userId)
    .maybeSingle();
  const k1 =
    data && typeof data.stack_shot_1_r2_key === "string" ? data.stack_shot_1_r2_key.trim() : "";
  const k2 =
    data && typeof data.stack_shot_2_r2_key === "string" ? data.stack_shot_2_r2_key.trim() : "";
  return { key1: k1 || null, key2: k2 || null, error: error ?? null };
}

/**
 * @param {string} userId
 * @param {string} profileId
 * @param {string[]} peptideIds — deduped non-empty strings; single id uses `.eq`, multiple uses `.in`
 */
export async function listVialsForPeptideIds(userId, profileId, peptideIds) {
  const ids = [...new Set((peptideIds ?? []).map((id) => String(id ?? "").trim()).filter(Boolean))];
  if (!supabase || !profileId) return { vials: [], error: notConfiguredError() };
  if (ids.length === 0) return { vials: [], error: null };
  let q = supabase
    .from("user_vials")
    .select("*")
    .eq("user_id", userId)
    .eq("profile_id", profileId);
  q = ids.length === 1 ? q.eq("peptide_id", ids[0]) : q.in("peptide_id", ids);
  const { data, error } = await q.order("created_at", { ascending: true });
  return { vials: data ?? [], error: error ?? null };
}

/**
 * @param {string} userId
 * @param {string} profileId
 * @param {string} peptideId
 */
export async function listVialsForPeptide(userId, profileId, peptideId) {
  return listVialsForPeptideIds(userId, profileId, [peptideId]);
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
export async function updateUserVial(vialId, userId, profileId, patch) {
  if (!supabase) return { error: notConfiguredError() };
  if (!profileId) return { error: new Error("Missing profile") };
  const { error } = await supabase
    .from("user_vials")
    .update(patch)
    .eq("id", vialId)
    .eq("user_id", userId)
    .eq("profile_id", profileId);
  return { error: error ?? null };
}

/**
 * @param {string} vialId
 * @param {string} userId
 * @param {string} profileId
 */
export async function deleteUserVial(vialId, userId, profileId) {
  if (!supabase) return { error: notConfiguredError() };
  if (!profileId) return { error: new Error("Missing profile") };
  const { error } = await supabase
    .from("user_vials")
    .delete()
    .eq("id", vialId)
    .eq("user_id", userId)
    .eq("profile_id", profileId);
  return { error: error ?? null };
}

/**
 * @param {string} vialId
 * @param {string} userId
 * @param {string} profileId
 * @param {number} [limit]
 */
export async function listRecentDosesForVial(vialId, userId, profileId, limit = 5) {
  if (!supabase || !profileId) return { doses: [], error: notConfiguredError() };
  const { data, error } = await supabase
    .from("dose_logs")
    .select("id, dosed_at, dose_mcg, notes")
    .eq("vial_id", vialId)
    .eq("user_id", userId)
    .eq("profile_id", profileId)
    .order("dosed_at", { ascending: false })
    .limit(limit);
  return { doses: data ?? [], error: error ?? null };
}

/**
 * @param {string} userId
 * @param {string} profileId
 * @param {string} peptideId
 */
export async function listDoseLogsForPeptideLast30Days(userId, profileId, peptideId) {
  if (!supabase || !profileId) return { doses: [], error: notConfiguredError() };
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - 29);
  const { data, error } = await supabase
    .from("dose_logs")
    .select("id, vial_id, dosed_at, dose_mcg, notes, dose_count, dose_unit, protocol_session")
    .eq("user_id", userId)
    .eq("profile_id", profileId)
    .eq("peptide_id", peptideId)
    .gte("dosed_at", start.toISOString())
    .order("dosed_at", { ascending: false });
  return { doses: data ?? [], error: error ?? null };
}

/**
 * Distinct peptide_ids with any dose on a local calendar day (Protocol "already logged today").
 * @param {string} ymd `YYYY-MM-DD` (use same local Y/M/D as `todayYmd()` in the app)
 */
export async function listPeptideIdsWithDosesOnLocalDay(userId, profileId, ymd) {
  if (!supabase || !profileId) return { peptideIds: [], error: notConfiguredError() };
  const [Y, Mo, D] = String(ymd)
    .split("-")
    .map((x) => parseInt(x, 10));
  if (!Y || !Mo || !D) return { peptideIds: [], error: null };
  const start = new Date(Y, Mo - 1, D, 0, 0, 0, 0);
  const end = new Date(Y, Mo - 1, D, 23, 59, 59, 999);
  const { data, error } = await supabase
    .from("dose_logs")
    .select("peptide_id")
    .eq("user_id", userId)
    .eq("profile_id", profileId)
    .gte("dosed_at", start.toISOString())
    .lte("dosed_at", end.toISOString());
  if (error) return { peptideIds: [], error };
  const peptideIds = [
    ...new Set((data ?? []).map((r) => r.peptide_id).filter((id) => typeof id === "string" && id)),
  ];
  return { peptideIds, error: null };
}

/**
 * Dose logs for a peptide in an inclusive wall-time range (ISO strings from local day bounds).
 * @param {string} userId
 * @param {string} profileId
 * @param {string} peptideId
 * @param {string} startIso
 * @param {string} endIso
 */
/**
 * @param {string[]} peptideIds
 */
export async function listDoseLogsForPeptideIdsRange(userId, profileId, peptideIds, startIso, endIso) {
  const ids = [...new Set((peptideIds ?? []).map((id) => String(id ?? "").trim()).filter(Boolean))];
  if (!supabase || !profileId) return { doses: [], error: notConfiguredError() };
  if (ids.length === 0) return { doses: [], error: null };
  let q = supabase
    .from("dose_logs")
    .select("id, vial_id, peptide_id, dosed_at, dose_mcg, notes, dose_count, dose_unit, protocol_session")
    .eq("user_id", userId)
    .eq("profile_id", profileId)
    .gte("dosed_at", startIso)
    .lte("dosed_at", endIso);
  q = ids.length === 1 ? q.eq("peptide_id", ids[0]) : q.in("peptide_id", ids);
  const { data, error } = await q.order("dosed_at", { ascending: false });
  return { doses: data ?? [], error: error ?? null };
}

export async function listDoseLogsForPeptideRange(userId, profileId, peptideId, startIso, endIso) {
  return listDoseLogsForPeptideIdsRange(userId, profileId, [peptideId], startIso, endIso);
}

/**
 * Injectable: vial_id + dose_mcg required (profile_id when using member profiles).
 * Non-injectable: vial_id null, dose_mcg null, dose_count + dose_unit + protocol_session (optional).
 * @param {{ user_id: string, profile_id?: string | null, vial_id?: string | null, peptide_id: string, dose_mcg?: number | null, dose_count?: number | null, dose_unit?: string | null, protocol_session?: string | null, notes?: string | null, dosed_at?: string }} row
 */
export async function insertDoseLog(row) {
  if (!supabase) return { error: notConfiguredError() };
  const { error } = await supabase.from("dose_logs").insert(row);
  return { error: error ?? null };
}

export async function listRecentDosedAtDates(userId, profileId) {
  if (!isSupabaseConfigured()) return { dates: [], error: null };
  if (!profileId) return { dates: [], error: null };
  const since = new Date();
  since.setDate(since.getDate() - 400);
  const { data, error } = await supabase
    .from("dose_logs")
    .select("dosed_at")
    .eq("user_id", userId)
    .eq("profile_id", profileId)
    .gte("dosed_at", since.toISOString())
    .order("dosed_at", { ascending: false });
  return { dates: data?.map((r) => r.dosed_at) ?? [], error };
}
