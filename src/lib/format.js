/**
 * Compact number display: 340, 1.2K, 1.2M, 1.2B.
 * @param {unknown} n
 * @returns {string}
 */
export function formatCompactNumber(n) {
  const value = Number(n);
  if (!Number.isFinite(value)) return "0";

  const abs = Math.abs(value);
  if (abs < 1000) return String(Math.round(value));

  const units = [
    { v: 1e9, s: "B" },
    { v: 1e6, s: "M" },
    { v: 1e3, s: "K" },
  ];
  const unit = units.find((u) => abs >= u.v) ?? units[units.length - 1];
  const compact = value / unit.v;
  const rounded = Math.round(compact * 10) / 10;
  const text = Number.isInteger(rounded) ? String(Math.trunc(rounded)) : rounded.toFixed(1);
  return `${text}${unit.s}`;
}
