/**
 * Classify catalog compounds for protocol logging (injectable vial vs cap/spray/app counts).
 * @param {unknown} peptide — catalog row with optional `route: string[]`
 */

function routeStrings(peptide) {
  if (!peptide || !Array.isArray(peptide.route)) return [];
  return peptide.route.map((x) => String(x).toLowerCase());
}

/** True if any route suggests injectable / IV use. */
export function hasInjectableRoute(peptide) {
  const parts = routeStrings(peptide);
  if (parts.length === 0) return false;
  const s = parts.join(" | ");
  return (
    /\bsubq\b/.test(s) ||
    /subcutaneous/.test(s) ||
    /\bsub\s*q\b/.test(s) ||
    /intramuscular/.test(s) ||
    /\bim injection\b/.test(s) ||
    /(^|[\s,/])im([\s,/]|$)/.test(s) ||
    /injection/.test(s) ||
    /injectable/.test(s) ||
    /\biv\b/.test(s) ||
    /iv infusion/.test(s) ||
    /intravenous/.test(s)
  );
}

/**
 * When logging without a vial: oral / intranasal / topical count row.
 * @returns {{ routeKind: 'oral' | 'intranasal' | 'topical', unitLabel: string } | null}
 */
export function inferNonInjectableLogProfile(peptide) {
  const parts = routeStrings(peptide);
  if (parts.length === 0) return null;
  const s = parts.join(" | ");
  const injectable = hasInjectableRoute(peptide);

  const oral = /oral|capsule|tablet|sublingual|liposomal/.test(s);
  const nasal = /intranasal|nasal spray|\bnasal\b/.test(s);
  const topical = /topical|transdermal|cream\b|serum\b/.test(s);

  const pickOral = () => ({
    routeKind: /** @type {const} */ ("oral"),
    unitLabel: /tablet/.test(s) ? "tablets" : "caps",
  });
  const pickNasal = () => ({
    routeKind: /** @type {const} */ ("intranasal"),
    unitLabel: "sprays",
  });
  const pickTopical = () => ({
    routeKind: /** @type {const} */ ("topical"),
    unitLabel: "applications",
  });

  if (!injectable) {
    if (oral) return pickOral();
    if (nasal) return pickNasal();
    if (topical) return pickTopical();
    return null;
  }

  if (oral) return pickOral();
  if (nasal) return pickNasal();
  if (topical) return pickTopical();
  return null;
}
