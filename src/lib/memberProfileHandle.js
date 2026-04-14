/**
 * Server + DB: letters, digits, underscore, period, hyphen; 3–32; no ..; cannot start or end with `.`
 * (first/last character must be alphanumeric — same rule as `member_profiles_handle_format_chk`).
 */
export const MEMBER_HANDLE_PATTERN = /^(?!.*\.\.)(?!\.)[a-zA-Z0-9](?:[a-zA-Z0-9_.-]{1,30}[a-zA-Z0-9])$/;

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
