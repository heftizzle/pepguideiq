/**
 * Display-only string for library `.pcard` half-life footer. Does not mutate catalog data.
 *
 * @param {unknown} raw
 * @returns {string | null}
 */
export function formatLibraryCardHalfLifeDisplay(raw) {
  if (raw == null || typeof raw !== "string") return null;
  let s = raw.trim();
  if (!s) return null;

  // Parenthetical (plasma)
  s = s.replace(/\(\s*plasma\s*\)/gi, "");

  // Leading "Plasma half-life of …" / "Plasma half-life …"
  s = s.replace(/^plasma\s+half-life\s+(?:of\s+)?/i, "");

  // Leading standalone "Plasma " (e.g. "Plasma ~1 hour; …")
  s = s.replace(/^plasma\s+/i, "");

  // Trailing " plasma" immediately before semicolon
  s = s.replace(/\s+plasma\s*(?=;)/gi, "");

  // Remaining standalone plasma tokens (word boundary)
  s = s.replace(/\bplasma\b/gi, "");

  s = s.replace(/\s+/g, " ").trim();
  s = s.replace(/^[,;]+|[,;]+$/g, "").trim();

  if (s.includes(";")) {
    s = s.split(";")[0].trim();
  }

  s = s.replace(/\s+/g, " ").trim();
  if (!s) return null;
  return s;
}
