import { API_WORKER_URL } from "./config.js";

/**
 * Normalize `member_profiles.avatar_url` for display: full https URLs unchanged;
 * R2 key paths get the Worker public `/avatars/{key}` URL (defensive for legacy rows).
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
  return `${base}/avatars/${raw}`;
}
