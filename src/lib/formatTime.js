/**
 * Long-form relative time: "just now", "5 minutes ago", "3 days ago",
 * then falls back to a localized "Apr 22, 2026" for anything older
 * than ~45 days. Used by the public profile photo lightbox.
 *
 * @param {unknown} iso
 * @returns {string}
 */
export function formatRelativeTime(iso) {
  if (typeof iso !== "string" || !iso) return "";
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return "";
  const diffSec = Math.round((Date.now() - t) / 1000);
  if (diffSec < 45) return "just now";
  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return `${diffMin} minute${diffMin === 1 ? "" : "s"} ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hour${diffHr === 1 ? "" : "s"} ago`;
  const diffDay = Math.round(diffHr / 24);
  if (diffDay < 45) return `${diffDay} day${diffDay === 1 ? "" : "s"} ago`;
  try {
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(t);
  } catch {
    return "";
  }
}

/**
 * Short-form relative time shared by NetworkTab + NotificationsBell.
 * Output is intentionally verbatim to the previously-duplicated inline
 * helpers — do not tweak thresholds or strings without versioning.
 *
 * @param {unknown} iso
 * @returns {string}
 */
export function formatTimeAgo(iso) {
  if (typeof iso !== "string" || !iso) return "";
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return "";
  const sec = Math.max(0, Math.floor((Date.now() - t) / 1000));
  if (sec < 60) return "just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 48) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 14) return `${day}d ago`;
  const wk = Math.floor(day / 7);
  if (wk < 8) return `${wk}w ago`;
  return `${Math.floor(day / 30)}mo ago`;
}
