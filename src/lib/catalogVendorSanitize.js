/** Neutral sourcing copy after vendor-specific text is removed. */
const NEUTRAL_SHORT = "Widely available from research vendors.";
const NEUTRAL_RATED = "Available from A-rated vendors.";

/**
 * Strip vendor-specific references, pricing, and URLs from catalog text.
 * Keeps numeric purity context; normalizes Finnrick mentions to independent verification language.
 * @param {string | null | undefined} text
 * @returns {string}
 */
export function sanitizeVendorRefs(text) {
  if (text == null) return "";
  let t = String(text);

  const replacements = [
    [/Swiss\s*Chems?/gi, ""],
    [/swisschems\.is/gi, ""],
    [/Penguin\s*Peptides?/gi, ""],
    [/\bPenguin\b/gi, ""],
    [/penguinpeptides\.com/gi, ""],
    [/Peptide\s*Partners?/gi, ""],
    [/Peptide\s*Sciences?/gi, ""],
    [/Pure\s*Rawz/gi, ""],
    [/Finnrick-verified/gi, "Independently verified"],
    [/Finnrick\s*avg/gi, "Independently verified avg"],
    [/Finnrick-tested/gi, "Independently tested"],
    [/\bFinnrick\b/gi, ""],
    [/Dan's\s+stack:?/gi, "Common protocol:"],
    [/Dan's\s+recommendation/gi, "Often recommended"],
    [/Codeage\s+[^\s.,]+/gi, "enhanced-bioavailability supplement formulations"],
  ];

  for (const [re, rep] of replacements) {
    t = t.replace(re, rep);
  }

  t = t.replace(/\$\d+(?:\.\d{2})?\s*(?:\/\s*vial)?/gi, "");
  t = t.replace(/\bUSD\s*\d+(?:\.\d{2})?/gi, "");
  t = t.replace(/https?:\/\/[^\s)\],]+/gi, "");
  t = t.replace(/\s{2,}/g, " ").trim();
  t = t.replace(/^\s*[,;:.]+\s*/g, "").replace(/\s*[,;:.]+\s*$/g, "");
  t = t.replace(/\(\s*\)/g, "").replace(/\[\s*\]/g, "");
  t = t.replace(/\s*[-–—]\s*$/g, "").trim();

  t = t.replace(/\bavg\s+(\d+(?:\.\d+)?)(?!\s*\/\s*10)(?!\.\d)/gi, "avg $1/10 purity");

  if (!t || t.length < 6 || /^[.,;:\-–]+$/.test(t)) {
    return NEUTRAL_RATED;
  }
  if (t.endsWith(".") === false && !t.includes("?")) {
    t += ".";
  }
  return t.trim();
}

export function neutralSourcingFallback(s) {
  const x = sanitizeVendorRefs(s);
  if (!x || x.length < 12) return NEUTRAL_SHORT;
  return x;
}
