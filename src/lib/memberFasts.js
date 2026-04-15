import { isValidFastTypeId } from "../data/fastTypes.js";

/**
 * @param {string | null | undefined} iso
 * @returns {number | null}
 */
export function parseFastIsoMs(iso) {
  if (typeof iso !== "string" || !iso.trim()) return null;
  const t = Date.parse(iso);
  return Number.isFinite(t) ? t : null;
}

/**
 * @param {number} elapsedMs
 * @returns {string}
 */
export function formatElapsedDuration(elapsedMs) {
  if (!Number.isFinite(elapsedMs) || elapsedMs < 0) return "0s";
  const totalSec = Math.floor(elapsedMs / 1000);
  const d = Math.floor(totalSec / 86400);
  const h = Math.floor((totalSec % 86400) / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

/**
 * @param {string | null | undefined} startedAt
 * @param {string | null | undefined} endedAt
 * @returns {string}
 */
export function formatCompletedFastDuration(startedAt, endedAt) {
  const a = parseFastIsoMs(startedAt);
  const b = parseFastIsoMs(endedAt);
  if (a == null || b == null || b < a) return "—";
  return formatElapsedDuration(b - a);
}

/**
 * @param {unknown} targetHours
 * @param {"hours"|"days"} unit
 * @returns {number}
 */
export function targetHoursFromAmountAndUnit(targetHours, unit) {
  const n = typeof targetHours === "number" ? targetHours : Number(targetHours);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return unit === "days" ? n * 24 : n;
}

/**
 * @param {string | null | undefined} startedAtIso
 * @param {unknown} targetHours
 * @param {number} [nowMs]
 * @returns {{ elapsedMs: number, progressPct: number, overTarget: boolean }}
 */
/**
 * @param {unknown} targetHours
 * @returns {string}
 */
export function formatTargetSummary(targetHours) {
  const h = Number(targetHours);
  if (!Number.isFinite(h)) return "";
  if (h >= 24 && h % 24 === 0) {
    const d = h / 24;
    return `${d} day${d === 1 ? "" : "s"}`;
  }
  return `${h} hour${h === 1 ? "" : "s"}`;
}

export function computeFastProgressState(startedAtIso, targetHours, nowMs = Date.now()) {
  const start = parseFastIsoMs(startedAtIso);
  const th = Number(targetHours);
  const targetMs = (Number.isFinite(th) && th > 0 ? th : 1) * 3600 * 1000;
  if (start == null) return { elapsedMs: 0, progressPct: 0, overTarget: false };
  const elapsedMs = Math.max(0, nowMs - start);
  const raw = (elapsedMs / targetMs) * 100;
  return {
    elapsedMs,
    progressPct: Math.min(100, raw),
    overTarget: raw > 100,
  };
}

/**
 * @param {import("@supabase/supabase-js").SupabaseClient} supabase
 * @param {string} userId
 * @param {string} profileId
 * @returns {Promise<{ active: object | null, history: object[], error: Error | null }>}
 */
export async function fetchMemberFastsForProfile(supabase, userId, profileId) {
  if (!supabase || !userId || !profileId) return { active: null, history: [], error: new Error("Missing profile") };
  const { data: activeRows, error: activeErr } = await supabase
    .from("member_fasts")
    .select("id, fast_type, started_at, target_hours, ended_at, notes, public_visible, created_at")
    .eq("member_profile_id", profileId)
    .is("ended_at", null)
    .order("started_at", { ascending: false })
    .limit(1);
  if (activeErr) return { active: null, history: [], error: activeErr };
  const active = Array.isArray(activeRows) && activeRows[0] ? activeRows[0] : null;

  const { data: histRows, error: histErr } = await supabase
    .from("member_fasts")
    .select("id, fast_type, started_at, target_hours, ended_at, notes, public_visible, created_at")
    .eq("member_profile_id", profileId)
    .not("ended_at", "is", null)
    .order("ended_at", { ascending: false })
    .limit(5);
  if (histErr) return { active, history: [], error: histErr };
  const history = Array.isArray(histRows) ? histRows : [];
  return { active, history, error: null };
}

/**
 * @param {import("@supabase/supabase-js").SupabaseClient} supabase
 * @param {string} userId
 * @param {string} profileId
 * @param {{
 *   fast_type: string,
 *   started_at: string,
 *   target_hours: number,
 *   notes?: string | null,
 *   public_visible?: boolean,
 * }} payload
 */
export async function insertMemberFast(supabase, userId, profileId, payload) {
  if (!supabase) return { data: null, error: new Error("Supabase is not configured.") };
  if (!userId || !profileId) return { data: null, error: new Error("Missing profile") };
  if (!isValidFastTypeId(payload.fast_type)) {
    return { data: null, error: new Error("Invalid fast type.") };
  }
  const th = Number(payload.target_hours);
  if (!Number.isFinite(th) || th <= 0 || th > 2160) {
    return { data: null, error: new Error("Target must be between 0 and 2160 hours (90 days).") };
  }
  const started = typeof payload.started_at === "string" ? payload.started_at.trim() : "";
  if (!started) return { data: null, error: new Error("Start time is required.") };
  let notes = null;
  if (typeof payload.notes === "string") {
    const t = payload.notes.trim().slice(0, 2000);
    notes = t === "" ? null : t;
  } else if (payload.notes === null) {
    notes = null;
  }
  const publicVisible = Boolean(payload.public_visible);
  const { data, error } = await supabase
    .from("member_fasts")
    .insert({
      user_id: userId,
      member_profile_id: profileId,
      fast_type: payload.fast_type,
      started_at: started,
      target_hours: th,
      ended_at: null,
      notes: notes && notes.length > 0 ? notes : null,
      public_visible: publicVisible,
    })
    .select("id")
    .maybeSingle();
  return { data, error: error ?? null };
}

/**
 * @param {import("@supabase/supabase-js").SupabaseClient} supabase
 * @param {string} profileId
 * @param {string} fastId
 * @param {Record<string, unknown>} patch — notes, public_visible
 */
export async function updateMemberFast(supabase, profileId, fastId, patch) {
  if (!supabase) return { error: new Error("Supabase is not configured.") };
  if (!profileId || !fastId) return { error: new Error("Missing fast id") };
  const allowed = {};
  if (Object.prototype.hasOwnProperty.call(patch, "notes")) {
    const v = patch.notes;
    if (v === null) allowed.notes = null;
    else if (typeof v === "string") {
      const t = v.trim().slice(0, 2000);
      allowed.notes = t === "" ? null : t;
    } else return { error: new Error("notes must be string or null") };
  }
  if (Object.prototype.hasOwnProperty.call(patch, "public_visible")) {
    allowed.public_visible = Boolean(patch.public_visible);
  }
  if (Object.keys(allowed).length === 0) return { error: new Error("Nothing to update") };
  const { error } = await supabase.from("member_fasts").update(allowed).eq("id", fastId).eq("member_profile_id", profileId);
  return { error: error ?? null };
}

/**
 * Sets ended_at to now (complete fast).
 * @param {import("@supabase/supabase-js").SupabaseClient} supabase
 * @param {string} profileId
 * @param {string} fastId
 */
export async function endMemberFast(supabase, profileId, fastId) {
  if (!supabase) return { error: new Error("Supabase is not configured.") };
  if (!profileId || !fastId) return { error: new Error("Missing fast id") };
  const endedAt = new Date().toISOString();
  const { error } = await supabase
    .from("member_fasts")
    .update({ ended_at: endedAt })
    .eq("id", fastId)
    .eq("member_profile_id", profileId)
    .is("ended_at", null);
  return { error: error ?? null };
}
