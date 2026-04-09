const MAX_ADVISOR_CATALOG = 153;

/** @param {{ mechanism?: string, typicalDose?: string }} p */
function oneSentenceBrief(p) {
  const m = typeof p.mechanism === "string" ? p.mechanism.trim() : "";
  if (m) {
    const first = m.split(/(?<=[.!?])\s+/)[0]?.trim() || m;
    return first.length > 160 ? `${first.slice(0, 157)}…` : first;
  }
  const t = typeof p.typicalDose === "string" ? p.typicalDose.trim() : "";
  return t.length > 120 ? `${t.slice(0, 117)}…` : t || "Research peptide.";
}

/**
 * @param {object[]} catalog
 * @param {(p: object) => string} primaryCategoryFn
 */
export function buildAdvisorCatalogPayload(catalog, primaryCategoryFn) {
  return catalog.slice(0, MAX_ADVISOR_CATALOG).map((p) => ({
    id: p.id,
    name: p.name,
    category: primaryCategoryFn(p),
    brief: oneSentenceBrief(p),
  }));
}
