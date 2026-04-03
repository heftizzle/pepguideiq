export function roundToHalf(n) {
  return Math.round(n * 2) / 2;
}

export function mcgToUnits(mcg, concMcgMl) {
  if (!mcg || !concMcgMl || concMcgMl <= 0) return null;
  return roundToHalf((Number(mcg) / concMcgMl) * 100);
}

export function unitsToMcg(units, concMcgMl) {
  if (!units || !concMcgMl || concMcgMl <= 0) return null;
  return Math.round((units / 100) * concMcgMl * 10) / 10;
}
