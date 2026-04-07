/**
 * Blend vial: per-component mass in a draw from reconstituted solution.
 * Per component: (component.mg / totalMg) × (drawMl / bacWaterMl) × totalMg → component.mg × drawMl / bacWaterMl
 * when totalMg matches the sum of component masses.
 *
 * @param {{ name: string, mg: number }[]} components
 * @param {number} totalMg — total lyophilized mass in the vial (mg); used as in the canonical formula; if ≤0, sum of component mg is used
 * @param {number} bacWaterMl — bacteriostatic water volume (mL)
 * @param {number} drawMl — volume drawn (mL)
 * @returns {{
 *   rows: { name: string, mgPerVial: number, mgPerDraw: number, mcgPerDraw: number }[],
 *   totalMgPerDraw: number,
 *   totalMcgPerDraw: number,
 * }}
 */
export function calculateBlendDose(components, totalMg, bacWaterMl, drawMl) {
  const bac = Number(bacWaterMl);
  const draw = Number(drawMl);
  if (!Array.isArray(components) || components.length === 0 || !Number.isFinite(bac) || bac <= 0 || !Number.isFinite(draw) || draw < 0) {
    return { rows: [], totalMgPerDraw: 0, totalMcgPerDraw: 0 };
  }

  const sumComp = components.reduce((s, c) => {
    const m = Number(c?.mg);
    return s + (Number.isFinite(m) && m >= 0 ? m : 0);
  }, 0);
  const total = Number.isFinite(totalMg) && totalMg > 0 ? totalMg : sumComp;
  if (total <= 0) {
    return { rows: [], totalMgPerDraw: 0, totalMcgPerDraw: 0 };
  }

  const rows = [];
  for (const c of components) {
    const mgVial = Number(c?.mg);
    if (!Number.isFinite(mgVial) || mgVial < 0) continue;
    const name = typeof c?.name === "string" ? c.name.trim() : "";
    if (!name) continue;
    const mgPerDraw = (mgVial / total) * (draw / bac) * total;
    rows.push({
      name,
      mgPerVial: mgVial,
      mgPerDraw,
      mcgPerDraw: mgPerDraw * 1000,
    });
  }

  const totalMgPerDraw = rows.reduce((s, r) => s + r.mgPerDraw, 0);
  return { rows, totalMgPerDraw, totalMcgPerDraw: totalMgPerDraw * 1000 };
}

/**
 * Per-component concentration (mg/mL) after reconstitution.
 * component.mg / bacWaterMl (component masses are the amounts in the reconstituted vial).
 *
 * @param {{ name: string, mg: number }[]} components
 * @param {number} bacWaterMl — BAC water (mL)
 * @returns {{ name: string, mgPerMl: number }[]}
 */
/**
 * Scale catalog recipe component masses to match actual vial total (mg).
 * @param {{ name: string, mg: number }[]} components
 * @param {number} recipeTotalMg — sum of catalog component mg (reference vial)
 * @param {number} vialMg — user vial lyophilized total (mg)
 */
export function scaleBlendComponentsToVial(components, recipeTotalMg, vialMg) {
  const tot = Number(recipeTotalMg);
  const v = Number(vialMg);
  if (!Array.isArray(components) || components.length === 0 || !Number.isFinite(tot) || tot <= 0 || !Number.isFinite(v) || v <= 0) {
    return [];
  }
  const f = v / tot;
  const out = [];
  for (const c of components) {
    const mg = Number(c?.mg);
    const name = typeof c?.name === "string" ? c.name.trim() : "";
    if (!name || !Number.isFinite(mg) || mg < 0) continue;
    out.push({ name, mg: mg * f });
  }
  return out;
}

export function blendConcentrationsMgPerMl(components, bacWaterMl) {
  const bac = Number(bacWaterMl);
  if (!Array.isArray(components) || components.length === 0 || !Number.isFinite(bac) || bac <= 0) {
    return [];
  }
  const out = [];
  for (const c of components) {
    const mg = Number(c?.mg);
    const name = typeof c?.name === "string" ? c.name.trim() : "";
    if (!name || !Number.isFinite(mg) || mg < 0) continue;
    out.push({
      name,
      mgPerMl: mg / bac,
    });
  }
  return out;
}
