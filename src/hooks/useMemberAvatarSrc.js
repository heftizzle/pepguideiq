import { useEffect, useState } from "react";
import { API_WORKER_URL } from "../lib/config.js";
import { resolveMemberAvatarDisplayUrl, resolveMemberAvatarDisplayUrlFromKey } from "../lib/memberAvatarUrl.js";
import { getSessionAccessToken } from "../lib/supabase.js";

function isHttpUrl(s) {
  return /^https?:\/\//i.test(String(s || "").trim());
}

/**
 * Resolves member avatar for `<img src>`: prefers `avatar_r2_key` (public `/avatars/{key}`).
 * Bare key-only legacy values without a public base use authenticated GET /stack-photo.
 * @param {string | undefined} userId
 * @param {string | undefined} avatarR2Key — canonical `member_profiles.avatar_r2_key`
 * @param {string | undefined} legacyAvatarUrl — full URL or legacy key string (pre-migration rows)
 * @param {boolean} workerOk
 * @returns {string | null}
 */
export function useMemberAvatarSrc(userId, avatarR2Key, legacyAvatarUrl, workerOk) {
  const [blobUrl, setBlobUrl] = useState(null);
  const k = typeof avatarR2Key === "string" ? avatarR2Key.trim() : "";
  const legacy = typeof legacyAvatarUrl === "string" ? legacyAvatarUrl.trim() : "";
  const primary = k || legacy;
  const resolvedFromKey = k ? resolveMemberAvatarDisplayUrlFromKey(k) : "";
  const resolved = k ? resolvedFromKey : resolveMemberAvatarDisplayUrl(legacy);

  useEffect(() => {
    setBlobUrl(null);
    if (!primary || !userId) return;
    if (isHttpUrl(resolved)) return;
    if (!workerOk || !API_WORKER_URL) return;
    const prefix = `${userId}/`;
    if (!resolved.startsWith(prefix) || resolved.includes("..")) return;

    let cancelled = false;
    let objectUrl = null;
    (async () => {
      const token = await getSessionAccessToken();
      if (!token || cancelled) return;
      const res = await fetch(`${API_WORKER_URL}/stack-photo?key=${encodeURIComponent(resolved)}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
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
  }, [userId, primary, resolved, workerOk]);

  if (!primary) return null;
  if (isHttpUrl(resolved)) return resolved;
  return blobUrl;
}
