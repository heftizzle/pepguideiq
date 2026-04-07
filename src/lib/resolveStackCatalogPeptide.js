import { PEPTIDES } from "../data/catalog.js";

/**
 * Match a saved stack row to the live catalog by `id` or case-insensitive alias
 * (e.g. stack still has "cjc-ipa" while catalog id is "cjc-ipa-combo").
 * @param {{ id?: unknown } | null | undefined} stackRow
 */
export function findCatalogPeptideForStackRow(stackRow) {
  const id = String(stackRow?.id ?? "").trim();
  if (!id) return null;
  const direct = PEPTIDES.find((c) => c.id === id);
  if (direct) return direct;
  const lower = id.toLowerCase();
  return (
    PEPTIDES.find(
      (c) => Array.isArray(c.aliases) && c.aliases.some((a) => String(a).toLowerCase() === lower)
    ) ?? null
  );
}

/**
 * `user_vials.peptide_id` may match either the stack row id or the canonical catalog id.
 * Query both when they differ so existing vials stay visible after catalog normalization.
 * @param {string | undefined | null} stackPeptideId
 * @param {{ id?: unknown } | null | undefined} catalogRow
 * @returns {string[]}
 */
export function vialQueryPeptideIds(stackPeptideId, catalogRow) {
  const s = new Set();
  const a = String(stackPeptideId ?? "").trim();
  if (a) s.add(a);
  const rawCanon = catalogRow?.id;
  const b = rawCanon != null && String(rawCanon).trim() ? String(rawCanon).trim() : "";
  if (b && b !== a) s.add(b);
  return [...s];
}

/**
 * Prefer canonical catalog id for new vials so rows align with the library.
 * @param {string | undefined | null} stackPeptideId
 * @param {{ id?: unknown } | null | undefined} catalogRow
 */
export function persistVialPeptideId(stackPeptideId, catalogRow) {
  const raw = catalogRow?.id;
  const canon = raw != null && String(raw).trim() ? String(raw).trim() : "";
  return canon || String(stackPeptideId ?? "").trim();
}
