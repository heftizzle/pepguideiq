import { useEffect, useState } from "react";
import { API_WORKER_URL } from "../lib/config.js";
import { getSessionAccessToken } from "../lib/supabase.js";

function isHttpUrl(s) {
  return /^https?:\/\//i.test(String(s || "").trim());
}

/**
 * Resolves `member_profiles.avatar_url` for display: https URLs as-is, or R2 keys under `userId/` via GET /stack-photo.
 * @param {string | undefined} userId
 * @param {string | undefined} avatarUrl
 * @param {number} imageNonce — bump after upload to avoid stale cache
 * @param {boolean} workerOk
 * @returns {string | null}
 */
export function useMemberAvatarSrc(userId, avatarUrl, imageNonce, workerOk) {
  const [blobUrl, setBlobUrl] = useState(null);
  const raw = typeof avatarUrl === "string" ? avatarUrl.trim() : "";

  useEffect(() => {
    setBlobUrl(null);
    if (!raw || !userId || isHttpUrl(raw)) return;
    if (!workerOk || !API_WORKER_URL) return;
    const prefix = `${userId}/`;
    if (!raw.startsWith(prefix) || raw.includes("..")) return;

    let cancelled = false;
    let objectUrl = null;
    (async () => {
      const token = await getSessionAccessToken();
      if (!token || cancelled) return;
      const t = typeof imageNonce === "number" ? imageNonce : 0;
      const res = await fetch(
        `${API_WORKER_URL}/stack-photo?key=${encodeURIComponent(raw)}&t=${Date.now() + t}`,
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
  }, [userId, raw, imageNonce, workerOk]);

  if (!raw) return null;
  if (isHttpUrl(raw)) return raw;
  return blobUrl;
}
