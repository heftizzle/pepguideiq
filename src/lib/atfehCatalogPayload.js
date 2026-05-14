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
 * Builds the compact catalog payload sent to AI Atfeh Chat and Stack Picks.
 * Returns ALL compounds in the catalog — no cap, no hardcoded length.
 * The catalog count is derived from PEPTIDES.length at call time and grows
 * automatically as new compounds ship in catalog batches.
 *
 * Prompt caching (cache_control: ephemeral) on the Worker side keeps token
 * cost bounded after the first hit per session.
 *
 * @param {object[]} catalog — PEPTIDES from src/data/catalog.js (length is dynamic)
 * @param {(p: object) => string} primaryCategoryFn
 */
export function buildAtfehCatalogPayload(catalog, primaryCategoryFn) {
  return catalog.map((p) => ({
    id: p.id,
    name: p.name,
    category: primaryCategoryFn(p),
    brief: oneSentenceBrief(p),
  }));
}

/** @deprecated Use `buildAtfehCatalogPayload`. Kept as alias for any legacy import sites. */
export const buildAdvisorCatalogPayload = buildAtfehCatalogPayload;
