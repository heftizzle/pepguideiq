/**
 * Allow only https URLs on finnrick.com (library badge / external link).
 * @param {unknown} raw
 * @returns {string | null}
 */
export function normalizeFinnrickProductUrl(raw) {
  if (raw == null || typeof raw !== "string") return null;
  const s = raw.trim();
  if (!s) return null;
  try {
    const u = new URL(s);
    if (u.protocol !== "https:") return null;
    const host = u.hostname.toLowerCase();
    if (host !== "finnrick.com" && host !== "www.finnrick.com") return null;
    return u.href;
  } catch {
    return null;
  }
}
