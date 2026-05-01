import { ALL_COMPOUNDS } from "../data/compounds/index.js";

const DEFAULT_ROUTES = ["injection"];

export function getValidRoutes(peptideId) {
  if (!peptideId) return DEFAULT_ROUTES;
  const id = String(peptideId).trim().toLowerCase();
  const row = ALL_COMPOUNDS.find((c) => String(c?.id ?? "").toLowerCase() === id);
  const arr = Array.isArray(row?.validRoutes) ? row.validRoutes : null;
  return arr && arr.length > 0 ? arr : DEFAULT_ROUTES;
}

export function isMultiRouteCompound(peptideId) {
  return getValidRoutes(peptideId).length > 1;
}
