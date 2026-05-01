import { listRecentDosesForVial, listVialsForPeptideIds } from "./supabase.js";
import { vialQueryPeptideIds } from "./resolveStackCatalogPeptide.js";
import { hasInjectableRoute, inferNonInjectableLogProfile } from "./doseRouteKind.js";
import { mcgToUnits, roundToHalf } from "./vialDoseMath.js";

function stripTimeLocal(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function vialActiveOnYmd(vial, ymd) {
  const [Y, Mo, D] = ymd.split("-").map((x) => parseInt(x, 10));
  if (!Y || !Mo || !D) return false;
  const dayStart = new Date(Y, Mo - 1, D, 0, 0, 0, 0);
  const dayEnd = new Date(Y, Mo - 1, D, 23, 59, 59, 999);
  const reconDay = stripTimeLocal(new Date(vial.reconstituted_at)).getTime();
  if (reconDay > dayEnd.getTime()) return false;
  if (vial.status === "depleted") return true;
  const expDay = stripTimeLocal(new Date(vial.expires_at)).getTime();
  if (expDay < dayStart.getTime()) return false;
  return true;
}

function clampUnits(u) {
  return Math.max(0.5, Math.min(300, roundToHalf(Number(u) || 0.5)));
}

/**
 * @param {string} userId
 * @param {string} profileId
 * @param {string} peptideId
 * @param {string} name
 * @param {{ route?: string[] } | null | undefined} peptideCatalog
 * @param {string} ymd
 */
export async function buildProtocolDoseRow(userId, profileId, peptideId, name, peptideCatalog, ymd) {
  const injectable = hasInjectableRoute(peptideCatalog ?? { route: [] });
  const ids = vialQueryPeptideIds(peptideId, peptideCatalog);
  const { vials } = await listVialsForPeptideIds(userId, profileId, ids);
  const active = (vials ?? []).filter((v) => vialActiveOnYmd(v, ymd));

  if (injectable && active.length > 0) {
    const pick =
      active.length === 1
        ? active[0]
        : (active.find((v) => v.desired_dose_mcg != null && Number(v.desired_dose_mcg) > 0) ?? active[0]);
    const rawDm =
      typeof pick.delivery_method === "string" ? pick.delivery_method.trim().toLowerCase() : "";
    const dm = rawDm === "intranasal_spray" || rawDm === "oral" ? rawDm : "injection";

    if (dm === "intranasal_spray") {
      const sprayVolumeMl = Number(pick.spray_volume_ml) || 0.10;
      return {
        kind: /** @type {const} */ ("intranasal_spray"),
        peptideId,
        name,
        vials: active,
        selectedVialId: pick.id,
        sprays: 1,
        spraySizePerDose: 1,
        sprayVolumeMl,
      };
    }
    if (dm === "oral") {
      return {
        kind: /** @type {const} */ ("oral_vial"),
        peptideId,
        name,
        vials: active,
        selectedVialId: pick.id,
        doseMl: 0.5,
      };
    }

    const { doses } = await listRecentDosesForVial(pick.id, userId, profileId, 5);
    const recentDoses = doses ?? [];
    const lastMcg = recentDoses.length > 0 ? recentDoses[0].dose_mcg : null;
    const units =
      mcgToUnits(lastMcg, pick.concentration_mcg_ml) ??
      mcgToUnits(pick.desired_dose_mcg, pick.concentration_mcg_ml) ??
      10;
    return {
      kind: /** @type {const} */ ("injectable"),
      peptideId,
      name,
      vials: active,
      selectedVialId: pick.id,
      units: clampUnits(units),
    };
  }

  const nj = inferNonInjectableLogProfile(peptideCatalog ?? { route: [] });
  if (nj) {
    return {
      kind: /** @type {const} */ ("nonInjectable"),
      peptideId,
      name,
      routeKind: nj.routeKind,
      unitLabel: nj.unitLabel,
      doseCount: 1,
    };
  }

  if (injectable) {
    return { kind: /** @type {const} */ ("missingVial"), peptideId, name };
  }

  return { kind: /** @type {const} */ ("missingVial"), peptideId, name };
}
