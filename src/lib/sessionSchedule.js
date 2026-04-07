/**
 * Infer protocol session from wall clock (legacy): morning before noon, afternoon before 18:00, etc.
 * @returns {"morning"|"afternoon"|"evening"|"night"}
 */
export function sessionFromClockFallback() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 18) return "afternoon";
  if (h < 21) return "evening";
  return "night";
}

/**
 * @param {string | null | undefined} wakeTime — Postgres TIME as "HH:MM:SS" or "HH:MM"
 * @returns {"morning"|"afternoon"|"evening"|"night"|null} null if unset or outside defined windows
 */
export function inferSessionFromWakeTime(wakeTime) {
  if (wakeTime == null || String(wakeTime).trim() === "") return null;
  const parts = parseWakeTimeParts(wakeTime);
  if (!parts) return null;
  const now = new Date();
  const anchorMs = anchorWakeMsFromParts(now, parts);
  const delta = now.getTime() - anchorMs;
  const H = 3600000;
  if (delta >= 0 && delta < 2 * H) return "morning";
  if (delta >= 4 * H && delta < 6 * H) return "afternoon";
  if (delta >= 8 * H && delta < 10 * H) return "evening";
  if (delta >= 12 * H && delta < 14 * H) return "night";
  return null;
}

/**
 * @param {string | null | undefined} wakeTime
 * @returns {"morning"|"afternoon"|"evening"|"night"}
 */
export function inferProtocolSessionForNow(wakeTime) {
  return inferSessionFromWakeTime(wakeTime) ?? sessionFromClockFallback();
}

/** @param {unknown} wakeTime */
function parseWakeTimeParts(wakeTime) {
  const m = String(wakeTime).trim().match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?/);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  const sec = m[3] != null ? Number(m[3]) : 0;
  if (!Number.isFinite(h) || !Number.isFinite(min) || !Number.isFinite(sec)) return null;
  if (h < 0 || h > 23 || min < 0 || min > 59 || sec < 0 || sec > 59) return null;
  return { h, min, sec };
}

/**
 * Most recent wake moment at or before `now` (local): today’s wake, or yesterday if `now` is before today’s wake.
 * @param {Date} now
 * @param {{ h: number, min: number, sec: number }} parts
 */
function anchorWakeMsFromParts(now, parts) {
  const anchor = new Date(now);
  anchor.setHours(parts.h, parts.min, parts.sec, 0);
  if (now.getTime() < anchor.getTime()) {
    anchor.setDate(anchor.getDate() - 1);
  }
  return anchor.getTime();
}

/**
 * Normalize for HTML time input display (HH:MM).
 * @param {string | null | undefined} wakeTime
 */
export function wakeTimeToInputValue(wakeTime) {
  if (wakeTime == null || String(wakeTime).trim() === "") return "";
  const m = String(wakeTime).trim().match(/^(\d{1,2}):(\d{2})/);
  if (!m) return "";
  const h = m[1].padStart(2, "0");
  const min = m[2].padStart(2, "0");
  return `${h}:${min}`;
}

/**
 * API / Postgres TIME (HH:MM:SS).
 * @param {string} hhmm from input type="time"
 */
export function wakeTimeFromInputToApi(hhmm) {
  const t = String(hhmm ?? "").trim();
  if (!t) return null;
  const m = t.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (!Number.isFinite(h) || !Number.isFinite(min) || h < 0 || h > 23 || min < 0 || min > 59) return null;
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}:00`;
}
