import { normalizeHandleInput } from "./memberProfileHandle.js";

/**
 * GET Worker `/member-profiles/public?handle=` — no auth.
 * @param {string} workerUrl
 * @param {string} rawHandle
 * @returns {Promise<{ profile: object | null, error: Error | null }>}
 */
export async function fetchPublicMemberProfileByHandle(workerUrl, rawHandle) {
  const base = String(workerUrl ?? "").replace(/\/$/, "");
  if (!base) {
    return { profile: null, error: new Error("API worker URL is not configured.") };
  }
  const h = normalizeHandleInput(rawHandle);
  if (!h || h.length < 3) {
    return { profile: null, error: new Error("Invalid handle.") };
  }
  try {
    const res = await fetch(`${base}/member-profiles/public?handle=${encodeURIComponent(h)}`);
    const j = await res.json().catch(() => ({}));
    if (res.status === 404) {
      return { profile: null, error: null };
    }
    if (!res.ok) {
      const msg = j && typeof j.error === "string" ? j.error : `Request failed (${res.status})`;
      return { profile: null, error: new Error(msg) };
    }
    const profile = j && typeof j === "object" && j.profile != null ? j.profile : null;
    return { profile, error: null };
  } catch (e) {
    return { profile: null, error: e instanceof Error ? e : new Error("Network error") };
  }
}
