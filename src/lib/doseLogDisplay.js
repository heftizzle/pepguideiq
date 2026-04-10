import { scaleBlendComponentsToVial, blendConcentrationsMgPerMl } from "./peptideMath.js";
import { mcgToUnits, unitsToMcg } from "./vialDoseMath.js";

/** @param {unknown} components */
export function isBlendCatalogComponents(components) {
  return Array.isArray(components) && components.length >= 2;
}

/**
 * Per-ingredient concentration (mcg/mL) after reconstitution, scaled to this vial.
 * @param {Record<string, unknown>} vial
 * @param {{ name: string, mg: number }[]} catalogBlendComponents
 * @returns {{ name: string, mcgMl: number }[] | null}
 */
export function blendIngredientConcMcgMlFromVial(vial, catalogBlendComponents) {
  if (!isBlendCatalogComponents(catalogBlendComponents)) return null;
  const vialMgNum = Number(vial?.vial_size_mg);
  const bacMlNum = Number(vial?.bac_water_ml);
  const recipeSum = catalogBlendComponents.reduce(
    (s, c) => s + (Number.isFinite(Number(c?.mg)) ? Number(c.mg) : 0),
    0
  );
  if (recipeSum <= 0 || !Number.isFinite(vialMgNum) || vialMgNum <= 0 || !Number.isFinite(bacMlNum) || bacMlNum <= 0) {
    return null;
  }
  const scaled = scaleBlendComponentsToVial(catalogBlendComponents, recipeSum, vialMgNum);
  const parts = blendConcentrationsMgPerMl(scaled, bacMlNum);
  if (!parts.length) return null;
  return parts
    .map((p) => ({
      name: typeof p.name === "string" ? p.name.trim() : "",
      mcgMl: Number(p.mgPerMl) * 1000,
    }))
    .filter((p) => p.name && Number.isFinite(p.mcgMl) && p.mcgMl > 0);
}

/**
 * Under 1,000 mcg → mcg; at 1,000+ → mg.
 * @param {number} mcg
 * @returns {string | null}
 */
export function formatDoseAmountFromMcg(mcg) {
  const x = Number(mcg);
  if (!Number.isFinite(x) || x <= 0) return null;
  if (x < 1000) {
    const t = Math.round(x * 10) / 10;
    return `${t.toLocaleString(undefined, { maximumFractionDigits: 1, minimumFractionDigits: 0 })} mcg`;
  }
  const mg = x / 1000;
  const rounded = Math.round(mg * 1000) / 1000;
  const nearInt = Math.abs(rounded - Math.round(rounded)) < 1e-9;
  if (nearInt) {
    return `${Math.round(rounded).toLocaleString()} mg`;
  }
  return `${rounded.toLocaleString(undefined, { maximumFractionDigits: 3, minimumFractionDigits: 0 })} mg`;
}

/**
 * Live Protocol / quick-log line: single = "N units = …", blend = "N units — A: … · B: …".
 * @param {number} units
 * @param {Record<string, unknown> | null | undefined} vial
 * @param {{ name: string, mg: number }[] | null | undefined} catalogBlendComponents
 */
export function formatProtocolInjectableDosePreview(units, vial, catalogBlendComponents) {
  const u = Number(units);
  if (!Number.isFinite(u) || u <= 0 || !vial) return "—";
  const ing = blendIngredientConcMcgMlFromVial(vial, catalogBlendComponents);
  if (ing && ing.length >= 2) {
    const parts = [];
    for (const { name, mcgMl } of ing) {
      const mcg = unitsToMcg(u, mcgMl);
      const lbl = mcg != null ? formatDoseAmountFromMcg(mcg) : null;
      if (lbl) parts.push(`${name}: ${lbl}`);
    }
    if (parts.length) return `${u} units — ${parts.join(" · ")}`;
  }
  const total = unitsToMcg(u, vial.concentration_mcg_ml);
  const lbl = formatDoseAmountFromMcg(total);
  if (!lbl) return "—";
  return `${u} units = ${lbl}`;
}

/**
 * Vial Tracker history / calendar secondary line: "N units · …" (single or blend).
 * @param {number | null | undefined} doseMcg
 * @param {Record<string, unknown> | null | undefined} vial
 * @param {{ name: string, mg: number }[] | null | undefined} catalogBlendComponents
 */
export function formatInjectableDoseHistoryAmount(doseMcg, vial, catalogBlendComponents) {
  const mcg = Number(doseMcg);
  if (!Number.isFinite(mcg) || mcg <= 0) return "—";
  const conc = Number(vial?.concentration_mcg_ml);
  if (!vial || !Number.isFinite(conc) || conc <= 0) {
    if (mcg >= 1000) {
      const mg = mcg / 1000;
      const t =
        mg % 1 === 0 ? mg.toLocaleString() : mg.toLocaleString(undefined, { maximumFractionDigits: 3 });
      return `${t} mg`;
    }
    return `${mcg.toLocaleString()} mcg`;
  }
  const units = mcgToUnits(mcg, conc);
  if (units == null) {
    return mcg >= 1000
      ? `${(mcg / 1000).toLocaleString(undefined, { maximumFractionDigits: 3 })} mg`
      : `${mcg.toLocaleString()} mcg`;
  }
  const ing = blendIngredientConcMcgMlFromVial(vial, catalogBlendComponents);
  if (ing && ing.length >= 2) {
    const parts = [];
    for (const { name, mcgMl } of ing) {
      const compMcg = unitsToMcg(units, mcgMl);
      const lbl = compMcg != null ? formatDoseAmountFromMcg(compMcg) : null;
      if (lbl) parts.push(`${name}: ${lbl}`);
    }
    if (parts.length) return `${units} units · ${parts.join(" · ")}`;
  }
  const lbl = formatDoseAmountFromMcg(mcg);
  return lbl ? `${units} units · ${lbl}` : "—";
}
