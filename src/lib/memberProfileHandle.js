/** Server + DB: lowercase letters, digits, underscore; 3–20 chars. */
export const MEMBER_HANDLE_PATTERN = /^[a-z0-9_]{3,20}$/;

/**
 * Normalize user input: trim, lowercase, strip leading @.
 * @param {unknown} raw
 */
export function normalizeHandleInput(raw) {
  let s = String(raw ?? "").trim().toLowerCase();
  if (s.startsWith("@")) s = s.slice(1);
  return s;
}

/**
 * @param {unknown} raw
 * @returns {boolean}
 */
export function isValidMemberHandleFormat(raw) {
  const h = normalizeHandleInput(raw);
  return MEMBER_HANDLE_PATTERN.test(h);
}

/**
 * @param {unknown} handle — stored DB value (no @)
 */
export function formatHandleDisplay(handle) {
  if (typeof handle !== "string") return "";
  const h = normalizeHandleInput(handle);
  return h ? `@${h}` : "";
}
