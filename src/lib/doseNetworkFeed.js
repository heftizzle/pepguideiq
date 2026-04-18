import { formatProtocolInjectableDosePreview } from "./doseLogDisplay.js";
import { inferNonInjectableLogProfile } from "./doseRouteKind.js";
import { resolveCatalogBlendBacRefMl } from "./peptideMath.js";

/**
 * One-line preview: compound name + dose (matches protocol / quick-log UI).
 * Injectable path uses `formatProtocolInjectableDosePreview` with `catalogPeptide` (IU compounds like HGH 191AA).
 * @param {{
 *   kind: "injectable",
 *   name: string,
 *   units: number,
 *   vials: object[],
 *   selectedVialId?: string | null,
 * } | {
 *   kind: "nonInjectable",
 *   name: string,
 *   doseCount: number,
 *   unitLabel: string,
 * }} row
 * @param {{ kind: "injectable", mcg: number } | { kind: "nonInjectable", doseCount: number, doseUnit: string }} payload
 * @param {Record<string, unknown> | null | undefined} catalogPeptide
 */
export function buildDoseNetworkPreviewLine(row, payload, catalogPeptide) {
  if (payload.kind === "injectable" && row.kind === "injectable") {
    const vial = row.vials.find((v) => v.id === row.selectedVialId) ?? row.vials[0];
    const blend = catalogPeptide && Array.isArray(catalogPeptide.components) ? catalogPeptide.components : null;
    const bacRef = resolveCatalogBlendBacRefMl(catalogPeptide);
    const dosePart = formatProtocolInjectableDosePreview(row.units, vial, blend, bacRef, catalogPeptide);
    return `${row.name} · ${dosePart}`;
  }
  if (payload.kind === "nonInjectable" && row.kind === "nonInjectable") {
    return `${row.name} · ${payload.doseCount} ${payload.doseUnit}`;
  }
  return row.name ?? "Dose";
}

/**
 * @param {Record<string, unknown> | null | undefined} catalogPeptide
 * @param {"injectable" | "nonInjectable"} payloadKind
 */
export function buildDoseNetworkRouteLabel(catalogPeptide, payloadKind) {
  if (payloadKind === "injectable") return "injectable";
  const inferred = catalogPeptide ? inferNonInjectableLogProfile(catalogPeptide) : null;
  return inferred?.routeKind ?? "non_injectable";
}

/**
 * Builds `network_feed` insert fields. `feedVisible` sets initial `public_visible` (Protocol / Stack quick log
 * insert private first, then `updateNetworkFeedPostPublicVisible` when the user taps "Post It").
 * @param {{
 *   userId: string,
 *   doseLogId: string,
 *   peptideId: string,
 *   row: { kind: "injectable" } | { kind: "nonInjectable" },
 *   payload: { kind: "injectable", mcg: number } | { kind: "nonInjectable", doseCount: number, doseUnit: string },
 *   session: string | null,
 *   stackRowId: string | null,
 *   catalogPeptide: Record<string, unknown> | null | undefined,
 *   feedVisible?: boolean | null,
 * }} args
 */
export function buildNetworkFeedInsertRow({
  userId,
  doseLogId,
  peptideId,
  payload,
  session,
  stackRowId,
  catalogPeptide,
  feedVisible,
}) {
  const route = buildDoseNetworkRouteLabel(catalogPeptide, payload.kind);
  if (payload.kind === "injectable") {
    return {
      user_id: userId,
      dose_log_id: doseLogId,
      compound_id: peptideId,
      dose_amount: payload.mcg,
      dose_unit: "mcg",
      route,
      session_label: session && String(session).trim() ? String(session).trim() : null,
      stack_id: stackRowId,
      public_visible: feedVisible ?? false,
    };
  }
  return {
    user_id: userId,
    dose_log_id: doseLogId,
    compound_id: peptideId,
    dose_amount: payload.doseCount,
    dose_unit: payload.doseUnit,
    route,
    session_label: session && String(session).trim() ? String(session).trim() : null,
    stack_id: stackRowId,
    public_visible: feedVisible ?? false,
  };
}
