import { useEffect, useState } from "react";
import { API_WORKER_URL } from "../lib/config.js";
import { resolveMemberAvatarDisplayUrl } from "../lib/memberAvatarUrl.js";
import { getSessionAccessToken } from "../lib/supabase.js";

function isHttpUrl(s) {
  return /^https?:\/\//i.test(String(s || "").trim());
}

function withCacheVersion(url, imageNonce) {
  const n = typeof imageNonce === "number" ? imageNonce : 0;
  if (!n) return url;
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}v=${n}`;
}

/**
 * Resolves `member_profiles.avatar_url` for display: https URLs (or Worker `/avatars/{key}`) as <img src>;
 * legacy key-only values use resolveMemberAvatarDisplayUrl, or authenticated GET /stack-photo when no public base.
 * @param {string | undefined} userId
 * @param {string | undefined} avatarUrl
 * @param {number} imageNonce — bump after upload to avoid stale cache
 * @param {boolean} workerOk
 * @returns {string | null}
 */
export function useMemberAvatarSrc(userId, avatarUrl, imageNonce, workerOk) {
  const [blobUrl, setBlobUrl] = useState(null);
  const raw = typeof avatarUrl === "string" ? avatarUrl.trim() : "";
  const resolved = resolveMemberAvatarDisplayUrl(raw);

  useEffect(() => {
    setBlobUrl(null);
    if (!raw || !userId) return;
    if (isHttpUrl(resolved)) return;
    if (!workerOk || !API_WORKER_URL) return;
    const prefix = `${userId}/`;
    if (!resolved.startsWith(prefix) || resolved.includes("..")) return;

    let cancelled = false;
    let objectUrl = null;
    (async () => {
      const token = await getSessionAccessToken();
      if (!token || cancelled) return;
      const t = typeof imageNonce === "number" ? imageNonce : 0;
      const res = await fetch(
        `${API_WORKER_URL}/stack-photo?key=${encodeURIComponent(resolved)}&t=${Date.now() + t}`,
        { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }
      );
      if (!res.ok || cancelled) return;
      const blob = await res.blob();
      if (cancelled) return;
      objectUrl = URL.createObjectURL(blob);
      setBlobUrl(objectUrl);
    })();
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [userId, raw, resolved, imageNonce, workerOk]);

  if (!raw) return null;
  if (isHttpUrl(resolved)) return withCacheVersion(resolved, imageNonce);
  return blobUrl;
}
