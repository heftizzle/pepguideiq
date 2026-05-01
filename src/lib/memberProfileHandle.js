/**
 * Server + DB (091): letter-first, 3–30 chars; letters, digits, underscore, hyphen only.
 */
export const MEMBER_HANDLE_PATTERN = /^[a-zA-Z][a-zA-Z0-9_-]{2,29}$/;

/**
 * Trim and strip all leading `@`; preserve casing.
 * @param {unknown} raw
 */
export function stripHandleAtPrefix(raw) {
  let s = String(raw ?? "").trim();
  while (s.startsWith("@")) s = s.slice(1).trim();
  return s;
}

/**
 * Lowercase canonical form for uniqueness / comparisons (not for display).
 * @param {unknown} raw
 */
export function normalizeHandleInput(raw) {
  return stripHandleAtPrefix(raw).toLowerCase();
}

/**
 * @param {unknown} raw
 * @returns {boolean}
 */
export function isValidMemberHandleFormat(raw) {
  return MEMBER_HANDLE_PATTERN.test(stripHandleAtPrefix(raw));
}

/**
 * @param {unknown} handle — stored canonical handle (lowercase, no @)
 * @param {unknown} [displayHandle] — optional `member_profiles.display_handle` (as typed)
 */
export function formatHandleDisplay(handle, displayHandle) {
  const canon = typeof handle === "string" ? handle.trim() : "";
  const disp = typeof displayHandle === "string" ? displayHandle.trim() : "";
  const inner = disp ? stripHandleAtPrefix(disp) : stripHandleAtPrefix(canon);
  if (!inner) return "";
  return `@${inner}`;
}
