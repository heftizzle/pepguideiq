import { createClient } from "@supabase/supabase-js";
import { PEPTIDES } from "../data/catalog.js";
import { getStoredAffiliateRef, normalizeAffiliateRef } from "./affiliateRef.js";
import { API_WORKER_URL, isApiWorkerConfigured, isSupabaseConfigured } from "./config.js";
import { generateShareId8 } from "./stackShare.js";
import { stripHandleAtPrefix } from "./memberProfileHandle.js";

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

function browserIanaTimeZone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

/**
 * Ensures PATCH payloads include a browser-detected IANA zone unless the caller set `timezone` explicitly.
 * @param {Record<string, unknown>} body
 */
function withWorkerMemberProfileTimezone(body) {
  const b = body && typeof body === "object" && !Array.isArray(body) ? { ...body } : {};
  const raw = Object.prototype.hasOwnProperty.call(b, "timezone") ? b.timezone : undefined;
  const has =
    raw !== null &&
    raw !== undefined &&
    (typeof raw !== "string" || String(raw).trim() !== "");
  if (!has) {
    b.timezone = browserIanaTimeZone();
  }
  return b;
}

// ─── Password policy ───────────────────────────────────────────────────────

const PASSWORD_SPECIAL_RE = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/;

/**
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validatePassword(password) {
  const s = typeof password === "string" ? password : "";
  const errors = [];
  if (s.length < 12) {
    errors.push("Use at least 12 characters.");
  }
  if (!/[A-Z]/.test(s)) {
    errors.push("Include at least one uppercase letter.");
  }
  if (!/[a-z]/.test(s)) {
    errors.push("Include at least one lowercase letter.");
  }
  if (!/[0-9]/.test(s)) {
    errors.push("Include at least one number.");
  }
  if (!PASSWORD_SPECIAL_RE.test(s)) {
    errors.push("Include at least one special character (!@#$%^&* etc.).");
  }
  return { valid: errors.length === 0, errors };
}

/**
 * @returns {Promise<{ pwned: boolean }>}
 */
// k-anonymity: only 5-char SHA-1 prefix sent, full password never leaves client
export async function checkPwnedPassword(password) {
  if (typeof password !== "string" || password.length === 0) {
    return { pwned: false };
  }
  try {
    const enc = new TextEncoder().encode(password);
    const buf = await crypto.subtle.digest("SHA-1", enc);
    const bytes = new Uint8Array(buf);
    const hash = [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("").toUpperCase();
    const prefix = hash.slice(0, 5);
    const suffix = hash.slice(5);
    const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
    if (!res.ok) {
      return { pwned: false };
    }
    const text = await res.text();
    const lines = text.split(/\n/);
    for (const line of lines) {
      const trimmed = line.replace(/\r$/, "");
      if (!trimmed) continue;
      const colon = trimmed.indexOf(":");
      const suf = colon === -1 ? trimmed : trimmed.slice(0, colon);
      if (suf.toUpperCase() === suffix) {
        return { pwned: true };
      }
    }
    return { pwned: false };
  } catch {
    return { pwned: false };
  }
}

// ─── Auth ───────────────────────────────────────────────────────────────────

function browserTurnstileSiteKeyConfigured() {
  return Boolean(String(import.meta.env.VITE_TURNSTILE_SITE_KEY ?? "").trim());
}

/** Worker signup/reset enforce Turnstile only when both Worker URL and site key are set (matches AuthScreen). */
function workerTurnstileEnforced() {
  return isApiWorkerConfigured() && browserTurnstileSiteKeyConfigured();
}

/**
 * @returns {{ user: import('@supabase/supabase-js').User | null, session: import('@supabase/supabase-js').Session | null, error: Error | null }}
 */
// enumeration-safe: always returns generic message regardless of supabase error
export async function authSignIn(email, password) {
  if (!supabase) return { user: null, session: null, error: notConfiguredError() };
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return { user: null, session: null, error: new Error("Invalid email or password") };
  }
  return { user: data?.user ?? null, session: data?.session ?? null, error: null };
}

/**
 * @param {{ name?: string, plan?: string, affiliate_ref?: string }} [meta]
 * @param {string | null | undefined} turnstileToken
 * @returns {{ user: import('@supabase/supabase-js').User | null, error: Error | null }}
 */
// enumeration-safe: upstream failures map to a generic message (except Worker bot / rate-limit copy).
export async function authSignUp(email, password, meta = {}, turnstileToken) {
  if (!supabase) return { user: null, error: notConfiguredError() };
  const policy = validatePassword(password);
  if (!policy.valid) {
    return { user: null, error: new Error(policy.errors[0] ?? "Password does not meet requirements.") };
  }
  const name = typeof meta.name === "string" ? meta.name : "";
  const plan = typeof meta.plan === "string" ? meta.plan : "entry";
  const affiliateRef =
    normalizeAffiliateRef(meta.affiliate_ref) ?? getStoredAffiliateRef();
  /** @type {Record<string, string>} */
  const userData = { name, plan };
  if (affiliateRef) userData.affiliate_ref = affiliateRef;

  const tok = typeof turnstileToken === "string" ? turnstileToken.trim() : "";
  /* Worker path only when Turnstile token present; if Worker + Turnstile are configured but token is missing,
   * fall through to direct Supabase signup — same graceful pattern as login (non-blocking Turnstile). */
  if (workerTurnstileEnforced() && tok) {
    const res = await fetch(`${API_WORKER_URL}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, turnstileToken: tok, userData }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      const errMsg = body && typeof body.error === "string" ? body.error : "";
      const passThrough = new Set([
        "Bot verification required",
        "Bot verification failed",
        "Too many signup attempts. Try again later.",
        "Auth service not configured",
        "Missing email or password",
        "Invalid JSON",
      ]);
      if (passThrough.has(errMsg)) {
        return { user: null, error: new Error(errMsg || "Unable to create account. Try again or sign in.") };
      }
      return { user: null, error: new Error("Unable to create account. Try again or sign in.") };
    }
    const access_token = body?.access_token;
    const refresh_token = body?.refresh_token;
    const user = body?.user ?? null;
    if (typeof access_token === "string" && typeof refresh_token === "string" && access_token && refresh_token) {
      const { error: sesErr } = await supabase.auth.setSession({ access_token, refresh_token });
      if (sesErr && import.meta.env.DEV) {
        console.warn("[authSignUp] setSession after Worker signup", sesErr);
      }
    }
    return { user, error: null };
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: userData },
  });
  if (error) {
    return { user: null, error: new Error("Unable to create account. Try again or sign in.") };
  }
  return { user: data?.user ?? null, error: null };
}

/**
 * @param {string} [redirectTo]
 * @param {string | null | undefined} turnstileToken — required when Worker + Turnstile are configured (public forgot-password).
 * @returns {{ error: Error | null }} `error` is only set when Supabase is not configured.
 */
// enumeration-safe: does not reveal whether the email exists (Supabase path swallows; Worker path uses generic copy for upstream errors).
export async function authResetPassword(email, redirectTo, turnstileToken) {
  if (!supabase) return { error: notConfiguredError() };
  const resolvedRedirect =
    redirectTo ?? (typeof window !== "undefined" ? `${window.location.origin}/` : undefined);

  const useWorkerReset = isApiWorkerConfigured() && browserTurnstileSiteKeyConfigured();
  if (useWorkerReset) {
    const tok = typeof turnstileToken === "string" ? turnstileToken.trim() : "";
    if (!tok) {
      return {
        error: new Error("Please complete bot verification before requesting a reset."),
      };
    }
    const res = await fetch(`${API_WORKER_URL}/auth/password-reset`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        turnstileToken: tok,
        ...(resolvedRedirect ? { redirectTo: resolvedRedirect } : {}),
      }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      const errMsg = body && typeof body.error === "string" ? body.error : "";
      const passThrough = new Set([
        "Bot verification required",
        "Bot verification failed",
        "Too many reset attempts. Try again later.",
        "Auth service not configured",
        "Missing email",
        "Invalid JSON",
      ]);
      if (passThrough.has(errMsg)) {
        return { error: new Error(errMsg || "Unable to process request. Try again later.") };
      }
      return { error: new Error("Unable to process request. Try again later.") };
    }
    return { error: null };
  }

  try {
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: resolvedRedirect,
    });
  } catch {
    /* swallow — caller treats as success for enumeration safety */
  }
  return { error: null };
}

/**
 * Sign in with email + password.
 * @returns {{ user: import('@supabase/supabase-js').User | null, session: import('@supabase/supabase-js').Session | null, error: Error | null }}
 */
export async function signIn(email, password) {
  return authSignIn(email, password);
}

/**
 * Register; stores `name` and `plan` in user_metadata.
 * @param {string | null | undefined} turnstileToken
 * @param {{ turnstileWidgetUnavailable?: boolean }} [opts] — when true with no token, skip Worker Turnstile signup (widget failed to load).
 * @returns {{ user: import('@supabase/supabase-js').User | null, error: Error | null }}
 */
export async function signUp(name, email, password, plan = "entry", turnstileToken, opts = {}) {
  const meta = { name, plan };
  if (opts.turnstileWidgetUnavailable) meta.__pepv_turnstileUnavailable = true;
  return authSignUp(email, password, meta, turnstileToken);
}

export async function signOut() {
  if (!supabase) return;
  await supabase.auth.signOut();
}

/** Access token for Worker JWT verification (Authorization: Bearer …). */
export async function getSessionAccessToken() {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  const session = data?.session;
  return session?.access_token ?? null;
}

/** @param {unknown} raw — PostgREST date / timestamptz string */
function normalizeProfileDateOfBirth(raw) {
  if (raw == null) return null;
  if (typeof raw !== "string") return null;
  const s = raw.trim().slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null;
}

/**
 * Raw column from profiles row (missing key → undefined, not null).
 * @param {Record<string, unknown> | null | undefined} profile
 * @param {string} snakeKey
 * @param {string} camelKey
 */
function profileFieldRaw(profile, snakeKey, camelKey) {
  if (!profile || typeof profile !== "object") return undefined;
  if (Object.prototype.hasOwnProperty.call(profile, snakeKey)) return profile[snakeKey];
  if (Object.prototype.hasOwnProperty.call(profile, camelKey)) return profile[camelKey];
  return undefined;
}

/**
 * Read a text-ish column from a profiles row (PostgREST uses snake_case; tolerate camelCase).
 * Treats undefined, null, and "" as empty (same as missing).
 * @param {Record<string, unknown> | null | undefined} profile
 * @param {string} snakeKey
 * @param {string} camelKey
 */
function profileTextLower(profile, snakeKey, camelKey) {
  const v = profileFieldRaw(profile, snakeKey, camelKey);
  if (v === undefined || v === null || v === "") return "";
  if (typeof v === "string") return v.trim().toLowerCase();
  return String(v).trim().toLowerCase();
}

export async function getCurrentUser() {
  if (!supabase) return null;
  const { data: auth } = await supabase.auth.getUser();
  const u = auth?.user;
  if (!u) return null;
  // Use * so one missing migration column does not fail the whole row (explicit list → REST 400 → profile null).
  const { data: profile, error: profileErr } = await supabase.from("profiles").select("*").eq("id", u.id).maybeSingle();
  if (profileErr && import.meta.env.DEV) {
    console.warn("[getCurrentUser] profiles:", profileErr.message);
  }
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
    biological_sex: (() => {
      const bs = profileTextLower(profile, "biological_sex", "biologicalSex");
      return bs === "male" || bs === "female" || bs === "prefer_not_to_say" ? bs : null;
    })(),
    cycle_tracking_enabled:
      profile && typeof profile.cycle_tracking_enabled === "boolean" ? profile.cycle_tracking_enabled : null,
    date_of_birth: profile ? normalizeProfileDateOfBirth(profile.date_of_birth) : null,
    training_experience: (() => {
      const te = profileTextLower(profile, "training_experience", "trainingExperience");
      return te === "beginner" || te === "intermediate" || te === "advanced" || te === "elite" ? te : null;
    })(),
    identities: Array.isArray(u.identities) ? u.identities : [],
  };
}

/**
 * After Stripe Checkout return (`?checkout=success`): refresh the auth session from GoTrue,
 * then load `profiles` (including `plan`) so the UI matches the webhook-updated row instead of stale client session hints.
 * @returns {Promise<Awaited<ReturnType<typeof getCurrentUser>>>}
 */
export async function getCurrentUserFreshAfterCheckout() {
  if (!supabase) return null;
  try {
    const { error } = await supabase.auth.refreshSession();
    if (error && import.meta.env.DEV) {
      console.warn("[getCurrentUserFreshAfterCheckout] refreshSession:", error.message);
    }
  } catch (e) {
    if (import.meta.env.DEV) console.warn("[getCurrentUserFreshAfterCheckout]", e);
  }
  return getCurrentUser();
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
 * Latest saved InBody-style scan (cadence + profile previews).
 * @param {string} profileId — member_profiles.id
 * @returns {Promise<{ row: Record<string, unknown> | null, error: Error | null }>}
 */
export async function fetchLatestInbodyScanHistory(profileId) {
  if (!supabase) return { row: null, error: notConfiguredError() };
  const pid = typeof profileId === "string" ? profileId.trim() : "";
  if (!pid) return { row: null, error: new Error("Missing profile") };
  const { data, error } = await supabase
    .from("inbody_scan_history")
    .select(
      "id, created_at, scan_date, weight_lbs, smm_lbs, pbf_pct, inbody_score, lean_mass_lbs, bmr_kcal, fat_mass_lbs"
    )
    .eq("profile_id", pid)
    .order("scan_date", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return { row: data ?? null, error: error ?? null };
}

/**
 * All InBody scan rows for a profile (newest `scan_date` first, then `created_at`).
 * @param {string} profileId
 * @returns {Promise<{ rows: Record<string, unknown>[], error: Error | null }>}
 */
export async function fetchAllInbodyScanHistory(profileId) {
  if (!supabase) return { rows: [], error: notConfiguredError() };
  const pid = typeof profileId === "string" ? profileId.trim() : "";
  if (!pid) return { rows: [], error: new Error("Missing profile") };
  const { data, error } = await supabase
    .from("inbody_scan_history")
    .select("*")
    .eq("profile_id", pid)
    .order("scan_date", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });
  return { rows: Array.isArray(data) ? data : [], error: error ?? null };
}

/**
 * @param {Record<string, unknown>} row — `public.inbody_scan_history` insert payload
 * @returns {Promise<{ error: Error | null }>}
 */
export async function insertInbodyScanHistory(row) {
  if (!supabase) return { error: notConfiguredError() };
  const { error } = await supabase.from("inbody_scan_history").insert(row);
  return { error: error ?? null };
}

/**
 * Deletes one `inbody_scan_history` row by id (RLS: own row; migration 057).
 * @param {string} scanRowId
 * @returns {Promise<{ error: Error | null }>}
 */
export async function deleteInbodyScanHistoryRow(scanRowId) {
  if (!supabase) return { error: notConfiguredError() };
  const id = typeof scanRowId === "string" ? scanRowId.trim() : "";
  if (!id) return { error: new Error("Missing scan id") };
  const { error } = await supabase.from("inbody_scan_history").delete().eq("id", id);
  return { error: error ?? null };
}

/** @type {Map<string, string> | null} */
let _peptideNameByIdCache = null;
function peptideDisplayNameFromCatalog(peptideId) {
  if (!_peptideNameByIdCache) {
    _peptideNameByIdCache = new Map(PEPTIDES.map((p) => [p.id, typeof p.name === "string" ? p.name : p.id]));
  }
  const id = typeof peptideId === "string" ? peptideId.trim() : "";
  if (!id) return "Unknown";
  return _peptideNameByIdCache.get(id) ?? id;
}

/**
 * @param {Record<string, unknown>} row
 * @returns {{ n: number, unit: string } | null}
 */
function doseLogComparableMagnitude(row) {
  const mcg = row.dose_mcg;
  if (mcg != null && Number.isFinite(Number(mcg))) {
    const n = Number(mcg);
    if (n > 0) return { n, unit: "mcg" };
  }
  const c = row.dose_count;
  if (c != null && Number.isFinite(Number(c))) {
    const n = Number(c);
    const unit = typeof row.dose_unit === "string" && row.dose_unit.trim() ? row.dose_unit.trim() : "units";
    return { n, unit };
  }
  return null;
}

/** Vendor-style peptide ids → display names before catalog / list copy. */
const PEPTIDE_TREND_DISPLAY_NAMES = {
  klow: "KLOW blend",
  "nad-plus": "NAD+",
  "hgh-191aa": "HGH 191AA",
};

function peptideTrendDisplayName(peptideId) {
  const id = typeof peptideId === "string" ? peptideId.trim() : "";
  if (!id) return "Unknown";
  if (Object.prototype.hasOwnProperty.call(PEPTIDE_TREND_DISPLAY_NAMES, id)) {
    return PEPTIDE_TREND_DISPLAY_NAMES[id];
  }
  return peptideDisplayNameFromCatalog(peptideId);
}

/**
 * Earliest dose per compound plus at most one titration per compound — the largest
 * relative dose swing (>15%, same unit). Each `label` is human text (e.g. `Started Retatrutide`, `Retatrutide ↑`)
 * for InBody trends UI and `/inbody-scan/interpret`.
 * @param {string} userId
 * @param {string} profileId
 * @returns {Promise<{ events: Array<{ date: string, label: string, type: 'start' | 'titration' }>, error: Error | null }>}
 */
export async function fetchProtocolEventsForTrends(userId, profileId) {
  if (!supabase || !userId || !profileId) return { events: [], error: notConfiguredError() };
  const { data, error } = await supabase
    .from("dose_logs")
    .select("peptide_id, dosed_at, dose_mcg, dose_count, dose_unit")
    .eq("user_id", userId)
    .eq("profile_id", profileId)
    .order("dosed_at", { ascending: true });
  if (error) return { events: [], error: error ?? null };

  /** @type {Map<string, Record<string, unknown>[]>} */
  const byPeptide = new Map();
  for (const row of data ?? []) {
    const pid = typeof row.peptide_id === "string" ? row.peptide_id.trim() : "";
    if (!pid) continue;
    const list = byPeptide.get(pid) ?? [];
    list.push(row);
    byPeptide.set(pid, list);
  }

  /** @type {Array<{ date: string, label: string, type: 'start' | 'titration', sortKey: number }>} */
  const acc = [];

  for (const [peptideId, rows] of byPeptide) {
    rows.sort((a, b) => {
      const ta = Date.parse(String(a.dosed_at ?? ""));
      const tb = Date.parse(String(b.dosed_at ?? ""));
      return (Number.isFinite(ta) ? ta : 0) - (Number.isFinite(tb) ? tb : 0);
    });
    const name = peptideTrendDisplayName(peptideId);
    const first = rows[0];
    const d0 = first && typeof first.dosed_at === "string" ? first.dosed_at.slice(0, 10) : "";
    if (d0 && first) {
      acc.push({
        date: d0,
        label: `Started ${name}`,
        type: "start",
        sortKey: Date.parse(String(first.dosed_at)) || 0,
      });
    }
    /** @type {{ date: string, sortKey: number, pctRel: number, up: boolean, down: boolean }[]} */
    const titCandidates = [];
    for (let i = 1; i < rows.length; i++) {
      const prev = rows[i - 1];
      const cur = rows[i];
      const a = doseLogComparableMagnitude(prev);
      const b = doseLogComparableMagnitude(cur);
      if (!a || !b || a.unit !== b.unit) continue;
      if (a.n <= 0 || b.n <= 0) continue;
      const rel = Math.abs(b.n - a.n) / a.n;
      if (rel > 0.15) {
        const d = typeof cur.dosed_at === "string" ? cur.dosed_at.slice(0, 10) : "";
        if (!d) continue;
        const sk = Date.parse(String(cur.dosed_at)) || 0;
        titCandidates.push({
          date: d,
          sortKey: sk,
          pctRel: rel,
          up: b.n > a.n,
          down: b.n < a.n,
        });
      }
    }
    if (titCandidates.length > 0) {
      const best = titCandidates.reduce((winner, cur) => {
        if (cur.pctRel > winner.pctRel) return cur;
        if (cur.pctRel === winner.pctRel && cur.sortKey > winner.sortKey) return cur;
        return winner;
      });
      const arrow = best.up ? " ↑" : best.down ? " ↓" : "";
      acc.push({
        date: best.date,
        label: `${name}${arrow}`,
        type: "titration",
        sortKey: best.sortKey,
      });
    }
  }

  acc.sort((x, y) => x.sortKey - y.sortKey);
  const events = acc.map(({ date, label, type }) => ({ date, label, type }));
  return { events, error: null };
}

/**
 * @param {Record<string, unknown>} patch — profiles columns only
 */
export async function updateUserProfile(patch) {
  if (!supabase) return { error: notConfiguredError() };
  const {
    data: { session },
    error: sessionErr,
  } = await supabase.auth.getSession();
  if (sessionErr) return { error: sessionErr };
  const token = session?.access_token;
  const id = session?.user?.id;
  if (!id || !token) return { error: new Error("Not signed in") };
  // Use the same Supabase origin + anon key as the singleton client, but send JWT explicitly.
  // Some flows validated auth via getUser() while PostgREST PATCH omitted Authorization (403 RLS).
  const supabaseUrl = url.replace(/\/$/, "");
  const payload = { ...patch, updated_at: new Date().toISOString() };
  const restUrl = `${supabaseUrl}/rest/v1/profiles?id=eq.${encodeURIComponent(id)}`;
  const res = await fetch(restUrl, {
    method: "PATCH",
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    let msg = `Request failed (${res.status})`;
    try {
      const errBody = await res.json();
      if (errBody && typeof errBody === "object" && typeof errBody.message === "string") {
        msg = errBody.message;
      } else if (typeof errBody === "string") {
        msg = errBody;
      }
    } catch {
      try {
        const t = await res.text();
        if (t) msg = t.length > 400 ? `${t.slice(0, 400)}…` : t;
      } catch {
        /* ignore */
      }
    }
    return { error: new Error(msg) };
  }
  return { error: null };
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
      "id, user_id, display_name, avatar_r2_key, timezone, is_default, created_at, city, state, country, language, shift_schedule, wake_time, handle, display_handle, demo_sessions_shown, bio, instagram_handle, tiktok_handle, facebook_handle, snapchat_handle, linkedin_handle, x_handle, youtube_handle, rumble_handle, experience_level, goals, body_scan_r2_key, body_scan_uploaded_at, body_scan_ocr_pending, progress_photo_front_r2_key, progress_photo_front_at, progress_photo_side_r2_key, progress_photo_side_at, progress_photo_back_r2_key, progress_photo_back_at, progress_photo_sets, current_streak"
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
 * @param {Record<string, unknown>} patch — e.g. { display_name }, { avatar_r2_key }
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
    body: JSON.stringify({
      display_name: String(displayName ?? "").trim(),
      timezone: browserIanaTimeZone(),
    }),
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
  const rawBody = body && typeof body === "object" ? body : {};
  const payload =
    rawBody && rawBody.archive_progress_photo_set === true ? rawBody : withWorkerMemberProfileTimezone(rawBody);
  const res = await fetch(`${API_WORKER_URL}/member-profiles/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
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

/** PATCH Worker: archive current front/side/back trio into `progress_photo_sets` and clear slots. */
export async function archiveProgressPhotoSetViaWorker(profileId) {
  return patchMemberProfileViaWorker(profileId, { archive_progress_photo_set: true });
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
  const forQuery = stripHandleAtPrefix(raw);
  if (!forQuery) {
    return { available: false, reason: "empty", error: null };
  }
  const params = new URLSearchParams({ handle: forQuery });
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

/** Logged-in settings path — no Turnstile widget; stays on direct Supabase (session already exists). */
export async function sendPasswordResetEmail(email, redirectTo) {
  if (!supabase) return { error: notConfiguredError() };
  try {
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectTo ?? (typeof window !== "undefined" ? `${window.location.origin}/` : undefined),
    });
  } catch {
    /* swallow — enumeration safety */
  }
  return { error: null };
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
  return supabase.auth.onAuthStateChange((event, session) => {
    if (
      event === "SIGNED_IN" &&
      typeof window !== "undefined" &&
      window.location.hash &&
      window.location.hash.includes("access_token")
    ) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
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
 * @returns {Promise<{ rows: object[], error: Error | null }>}
 */
export async function fetchNetworkFeed() {
  if (!supabase) return { rows: [], error: notConfiguredError() };
  try {
    const { data, error } = await supabase.rpc("get_network_feed", {});
    if (error) return { rows: [], error };
    return { rows: Array.isArray(data) ? data : [], error: null };
  } catch (error) {
    return { rows: [], error: error instanceof Error ? error : new Error("Could not load network feed.") };
  }
}

/**
 * Live dose posts (non-expired), enriched via RPC — max 50, newest first.
 * @returns {Promise<{ rows: object[], error: Error | null }>}
 */
export async function fetchPublicNetworkDoseFeed() {
  if (!supabase) return { rows: [], error: notConfiguredError() };
  try {
    const { data, error } = await supabase.rpc("get_public_network_dose_feed", {});
    if (error) return { rows: [], error };
    if (data == null) return { rows: [], error: null };
    if (Array.isArray(data)) return { rows: data, error: null };
    if (typeof data === "string") {
      try {
        const parsed = JSON.parse(data);
        return { rows: Array.isArray(parsed) ? parsed : [], error: null };
      } catch {
        return { rows: [], error: new Error("Could not parse dose feed response.") };
      }
    }
    if (data != null && typeof data === "object") return { rows: [data], error: null };
    return { rows: [], error: null };
  } catch (error) {
    return { rows: [], error: error instanceof Error ? error : new Error("Could not load dose feed.") };
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
 * R2 keys for Vial Tracker hero stack shots (migration 009).
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
  const nextLocalMidnight = new Date(Y, Mo - 1, D + 1, 0, 0, 0, 0);
  const { data, error } = await supabase
    .from("dose_logs")
    .select("peptide_id")
    .eq("user_id", userId)
    .eq("profile_id", profileId)
    .gte("dosed_at", start.toISOString())
    .lt("dosed_at", nextLocalMidnight.toISOString());
  if (error) return { peptideIds: [], error };
  const peptideIds = [
    ...new Set((data ?? []).map((r) => r.peptide_id).filter((id) => typeof id === "string" && id)),
  ];
  return { peptideIds, error: null };
}

/**
 * Latest `dosed_at` per peptide on a local calendar day (interim 2h log cooldown after last dose).
 * @param {string} ymd `YYYY-MM-DD` (same local Y/M/D as `localTodayYmd()` in the app)
 * @returns {Promise<{ latestByPeptide: Record<string, string>, error: Error | null }>}
 */
export async function listLatestDosedAtByPeptideOnLocalDay(userId, profileId, ymd) {
  if (!supabase || !profileId) return { latestByPeptide: {}, error: notConfiguredError() };
  const [Y, Mo, D] = String(ymd)
    .split("-")
    .map((x) => parseInt(x, 10));
  if (!Y || !Mo || !D) return { latestByPeptide: {}, error: null };
  const start = new Date(Y, Mo - 1, D, 0, 0, 0, 0);
  const nextLocalMidnight = new Date(Y, Mo - 1, D + 1, 0, 0, 0, 0);
  const { data, error } = await supabase
    .from("dose_logs")
    .select("peptide_id, dosed_at")
    .eq("user_id", userId)
    .eq("profile_id", profileId)
    .gte("dosed_at", start.toISOString())
    .lt("dosed_at", nextLocalMidnight.toISOString())
    .order("dosed_at", { ascending: false });
  if (error) return { latestByPeptide: {}, error };
  /** @type {Record<string, string>} */
  const latestByPeptide = {};
  for (const r of data ?? []) {
    const pid = r.peptide_id;
    if (typeof pid !== "string" || !pid) continue;
    if (latestByPeptide[pid]) continue;
    const at = r.dosed_at;
    if (typeof at === "string" && at) latestByPeptide[pid] = at;
  }
  return { latestByPeptide, error: null };
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
/**
 * Earliest `dosed_at` across the given peptides (for calendar scroll-back limit).
 * @param {string} userId
 * @param {string} profileId
 * @param {string[]} peptideIds
 * @returns {Promise<{ dosedAt: string | null, error: Error | null }>}
 */
export async function getEarliestDosedAtForPeptideIds(userId, profileId, peptideIds) {
  const ids = [...new Set((peptideIds ?? []).map((id) => String(id ?? "").trim()).filter(Boolean))];
  if (!supabase || !profileId) return { dosedAt: null, error: notConfiguredError() };
  if (ids.length === 0) return { dosedAt: null, error: null };
  let q = supabase
    .from("dose_logs")
    .select("dosed_at")
    .eq("user_id", userId)
    .eq("profile_id", profileId)
    .order("dosed_at", { ascending: true })
    .limit(1);
  q = ids.length === 1 ? q.eq("peptide_id", ids[0]) : q.in("peptide_id", ids);
  const { data, error } = await q;
  const row = Array.isArray(data) && data.length > 0 ? data[0] : null;
  const raw = row && typeof row.dosed_at === "string" ? row.dosed_at : null;
  return { dosedAt: raw, error: error ?? null };
}

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

/**
 * Dose logs for one or more vial ids in an inclusive wall-time range.
 * Useful for tracker/calendar views where vial identity is more authoritative than peptide_id.
 * @param {string} userId
 * @param {string} profileId
 * @param {string[]} vialIds
 * @param {string} startIso
 * @param {string} endIso
 */
export async function listDoseLogsForVialIdsRange(userId, profileId, vialIds, startIso, endIso) {
  const ids = [...new Set((vialIds ?? []).map((id) => String(id ?? "").trim()).filter(Boolean))];
  if (!supabase || !profileId) return { doses: [], error: notConfiguredError() };
  if (ids.length === 0) return { doses: [], error: null };
  let q = supabase
    .from("dose_logs")
    .select("id, vial_id, peptide_id, dosed_at, dose_mcg, notes, dose_count, dose_unit, protocol_session")
    .eq("user_id", userId)
    .eq("profile_id", profileId)
    .gte("dosed_at", startIso)
    .lte("dosed_at", endIso);
  q = ids.length === 1 ? q.eq("vial_id", ids[0]) : q.in("vial_id", ids);
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
 * @returns {Promise<{ data: { id: string } | null, error: Error | null }>}
 */
export async function insertDoseLog(row) {
  if (!supabase) return { data: null, error: notConfiguredError() };
  const { data, error } = await supabase.from("dose_logs").insert(row).select("id").maybeSingle();
  return { data: data ?? null, error: error ?? null };
}

/**
 * Saved stack row id for the active member profile (one row per user+profile).
 * @param {string} userId
 * @param {string} profileId
 * @returns {Promise<{ stackRowId: string | null, feedVisible: boolean, error: Error | null }>}
 */
export async function getUserStackRowId(userId, profileId) {
  if (!supabase || !userId || !profileId)
    return { stackRowId: null, feedVisible: false, error: notConfiguredError() };
  const { data, error } = await supabase
    .from("user_stacks")
    .select("id, feed_visible")
    .eq("user_id", userId)
    .eq("profile_id", profileId)
    .maybeSingle();
  const id = data && typeof data.id === "string" && data.id.trim() ? data.id.trim() : null;
  const feedVisible = Boolean(data?.feed_visible);
  return { stackRowId: id, feedVisible, error: error ?? null };
}

/**
 * Inserts a network_feed row (migration 033). `expires_at` defaults server-side (+72h).
 * @param {Record<string, unknown>} row
 * @param {boolean} [feedVisible] — fallback when `row.public_visible` is not a boolean
 * @returns {Promise<{ data: { id: string } | null; error: Error | null }>}
 */
export async function insertNetworkFeedDosePost(row, feedVisible) {
  if (!supabase) return { data: null, error: notConfiguredError() };
  const public_visible =
    typeof row.public_visible === "boolean" ? row.public_visible : (feedVisible ?? false);
  const { data, error } = await supabase
    .from("network_feed")
    .insert({ ...row, public_visible })
    .select("id")
    .maybeSingle();
  const id = data && typeof data.id === "string" && data.id.trim() ? data.id.trim() : null;
  return { data: id ? { id } : null, error: error ?? null };
}

/**
 * InBody progress share on `network_feed` (post_type inbody_progress). Requires migration 056.
 * @param {{
 *   userId: string,
 *   profileId: string,
 *   contentJson: Record<string, unknown>,
 *   publicVisible: boolean,
 * }} args
 * @returns {Promise<{ data: { id: string } | null; error: Error | null }>}
 */
export async function insertInbodyProgressNetworkPost({ userId, profileId, contentJson, publicVisible }) {
  if (!supabase) return { data: null, error: notConfiguredError() };
  const uid = typeof userId === "string" ? userId.trim() : "";
  const pid = typeof profileId === "string" ? profileId.trim() : "";
  if (!uid || !pid) return { data: null, error: new Error("Missing user or profile") };
  const { data, error } = await supabase
    .from("network_feed")
    .insert({
      user_id: uid,
      post_type: "inbody_progress",
      profile_id: pid,
      content_json: contentJson,
      public_visible: Boolean(publicVisible),
      dose_log_id: null,
      compound_id: null,
      dose_amount: null,
      dose_unit: null,
      route: null,
      session_label: null,
      stack_id: null,
    })
    .select("id")
    .maybeSingle();
  const id = data && typeof data.id === "string" && data.id.trim() ? data.id.trim() : null;
  return { data: id ? { id } : null, error: error ?? null };
}

/**
 * Sets `public_visible` on an existing dose post (e.g. after user taps "Post It"). Migration 054 RLS + GRANT.
 * @param {string} networkFeedId — `network_feed.id`, not `dose_logs.id`
 * @param {boolean} [publicVisible]
 * @returns {Promise<{ error: Error | null }>}
 */
export async function updateNetworkFeedPostPublicVisible(networkFeedId, publicVisible = true) {
  if (!supabase) return { error: notConfiguredError() };
  const id = typeof networkFeedId === "string" ? networkFeedId.trim() : "";
  if (!id) return { error: new Error("Missing network feed id.") };
  const { error } = await supabase
    .from("network_feed")
    .update({ public_visible: Boolean(publicVisible) })
    .eq("id", id);
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

// ─── Notifications (migration 036) ─────────────────────────────────────────

/**
 * @returns {Promise<{ count: number, error: Error | null }>}
 */
export async function getUnreadNotificationCount() {
  if (!supabase) return { count: 0, error: notConfiguredError() };
  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("read", false);
  return { count: typeof count === "number" ? count : 0, error: error ?? null };
}

/**
 * @param {number} [limit]
 * @returns {Promise<{ rows: object[], error: Error | null }>}
 */
export async function fetchNotificationsRecent(limit = 10) {
  if (!supabase) return { rows: [], error: notConfiguredError() };
  const { data, error } = await supabase
    .from("notifications")
    .select(
      "id, actor_id, type, read, created_at, actor_handle, actor_display_handle, actor_display_name, target_share_id, target_network_post_id"
    )
    .order("created_at", { ascending: false })
    .limit(Math.min(50, Math.max(1, limit)));
  return { rows: Array.isArray(data) ? data : [], error: error ?? null };
}

/**
 * @param {string} notificationId
 * @returns {Promise<{ error: Error | null }>}
 */
export async function markNotificationRead(notificationId) {
  if (!supabase) return { error: notConfiguredError() };
  const id = typeof notificationId === "string" ? notificationId.trim() : "";
  if (!id) return { error: new Error("Missing notification id.") };
  const { error } = await supabase.from("notifications").update({ read: true }).eq("id", id);
  return { error: error ?? null };
}

/**
 * @returns {Promise<{ error: Error | null }>}
 */
export async function markAllNotificationsRead() {
  if (!supabase) return { error: notConfiguredError() };
  const { error } = await supabase.from("notifications").update({ read: true }).eq("read", false);
  return { error: error ?? null };
}
