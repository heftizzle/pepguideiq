/** Circumference for InBody score ring at r=30 (72px SVG). */
export const INBODY_SCORE_RING_C = 188.5;

/** @param {unknown} v */
export function inbodyToNum(v) {
  if (v == null) return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

export const INBODY_EM = "\u2014";

/** @param {unknown} raw */
export function formatInbodyScanDateLabel(raw) {
  const t = raw == null ? NaN : Date.parse(String(raw));
  if (!Number.isFinite(t)) return null;
  try {
    return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(t);
  } catch {
    return null;
  }
}

/** @param {unknown} raw @param {"short" | "medium"} [style] */
export function formatInbodyScanDateOnly(raw, style = "short") {
  const t = raw == null ? NaN : Date.parse(String(raw));
  if (!Number.isFinite(t)) return null;
  try {
    return new Intl.DateTimeFormat(undefined, { dateStyle: style }).format(t);
  } catch {
    return null;
  }
}

/**
 * Whole days between two scan_date values (DB only — never uses clock).
 * @param {unknown} olderIso
 * @param {unknown} newerIso
 * @returns {number | null}
 */
export function inbodyDaysBetweenScanDates(olderIso, newerIso) {
  const a = olderIso == null ? NaN : Date.parse(String(olderIso));
  const b = newerIso == null ? NaN : Date.parse(String(newerIso));
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  const days = Math.round(Math.abs(b - a) / 86400000);
  return Math.max(1, days);
}

/**
 * @param {number | null} score
 * @param {number} [circ]
 * @returns {number} stroke dash length for progress arc
 */
export function inbodyScoreProgressDash(score, circ = INBODY_SCORE_RING_C) {
  if (score == null) return 0;
  const c = Math.min(100, Math.max(0, score));
  return (c / 100) * circ;
}
