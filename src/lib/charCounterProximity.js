/**
 * Whether to show a current/max character counter (e.g. warning near limit).
 * Hidden until within 50 chars of max (or over max). Fields with maxLen <= 50 never show.
 *
 * @param {number} length
 * @param {number} maxLen
 * @returns {boolean}
 */
export function shouldShowCharProximityCounter(length, maxLen) {
  if (!Number.isFinite(maxLen) || maxLen <= 0) return false;
  if (!Number.isFinite(length)) return false;
  if (length > maxLen) return true;
  if (maxLen <= 50) return false;
  return length >= maxLen - 50;
}
