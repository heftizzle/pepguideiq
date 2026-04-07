/**
 * Display line for compound cards / detail modal.
 * Explicit `bioavailability` on the row wins; else injectable-only routes get a standard note.
 * @param {{ bioavailability?: string, bioavailabilityWarning?: boolean, route?: string[] } | null | undefined} p
 * @returns {{ text: string, warn: boolean } | null}
 */
export function resolvePeptideBioavailability(p) {
  if (!p) return null;
  if (typeof p.bioavailability === "string" && p.bioavailability.trim()) {
    return { text: p.bioavailability.trim(), warn: Boolean(p.bioavailabilityWarning) };
  }
  const routes = Array.isArray(p.route) ? p.route.map((x) => String(x).toLowerCase()) : [];
  const s = routes.join(" | ");
  const hasInj =
    /subq|subcutaneous|intramuscular|injection|injectable|iv infusion|intravenous/.test(s) ||
    /\biv\b/.test(s) ||
    /(^|[\s,/])im([\s,/]|$)/.test(s);
  const hasOral = /\boral\b|tablet|capsule|rybelsus/.test(s);
  const hasNasal = /intranasal|nasal spray|\bnasal\b/.test(s);
  const hasTopical = /topical|transdermal|cream|gel|dermal/.test(s);
  if (hasInj && !hasOral && !hasNasal && !hasTopical) {
    return { text: "~100% (injectable)", warn: false };
  }
  return null;
}

export const BIOAVAILABILITY_WARN_TOOLTIP =
  "Low bioavailability — significantly less active compound reaches systemic circulation";
