import { API_WORKER_URL } from "./config.js";

/**
 * Build a public `/avatars/{key}` URL from a stored R2 object key (no cache-bust params).
 * @param {string | undefined | null} key
 * @returns {string}
 */
export function resolveMemberAvatarDisplayUrlFromKey(key) {
  const raw = typeof key === "string" ? key.trim() : "";
  if (!raw) return "";
  const base = String(API_WORKER_URL || "").replace(/\/$/, "");
  if (!base) return raw;
  if (raw.includes("..")) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.startsWith("/avatars/")) return `${base}${raw}`;
  if (raw.startsWith("avatars/")) return `${base}/${raw}`;
  return `${base}/avatars/${raw}`;
}

/**
 * Normalize `member_profiles.avatar_url` for display:
 *   • full https URLs → unchanged
 *   • leading "/avatars/{key}" → prepend Worker origin
 *   • bare R2 key like "{uid}/member-profiles/{mpId}/avatar.jpg" → prepend `${base}/avatars/`
 *   • empty → ""
 * Defensive against legacy rows that stored just an R2 key instead of a full URL.
 * @param {string | undefined | null} avatarUrl
 * @returns {string}
 */
export function resolveMemberAvatarDisplayUrl(avatarUrl) {
  const raw = typeof avatarUrl === "string" ? avatarUrl.trim() : "";
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  const base = String(API_WORKER_URL || "").replace(/\/$/, "");
  if (!base) return raw;
  if (raw.includes("..")) return raw;
  if (raw.startsWith("/avatars/")) return `${base}${raw}`;
  if (raw.startsWith("avatars/")) return `${base}/${raw}`;
  return `${base}/avatars/${raw}`;
}
