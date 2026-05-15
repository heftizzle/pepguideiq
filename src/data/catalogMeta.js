/**
 * Lightweight catalog metadata — no PEPTIDES / ALL_COMPOUNDS dependency.
 * Safe to import from the entry bundle (App.jsx, nav, modals).
 *
 * CATALOG_COUNT: keep in sync with PEPTIDES.length / CATALOG_COUNT in catalog.js
 * (run from repo root: node -e "import('./src/data/catalog.js').then(m => console.log(m.CATALOG_COUNT))").
 */

export const CATALOG_COUNT = 277;

export const CATEGORIES = [
  "All",
  "Anabolics / HRT",
  "GLP / Metabolic",
  "GH Peptides",
  "Sleep",
  "Nootropic",
  "Longevity",
  "Mitochondrial",
  "Healing / Recovery",
  "Immune",
  "Skin / Hair / Nails",
  "Sexual Health",
  "Relational Performance",
  "Estrogen Control",
  "Testosterone Support",
  "Thyroid Support",
  "SARMs",
  "Khavinson Bioregulators",
];

export const GOALS = [
  "Fat Loss",
  "Muscle Building",
  "Longevity",
  "Sleep Optimization",
  "Cognitive Enhancement",
  "Recovery",
  "Hormone Optimization",
  "Immune Support",
  "Skin & Aesthetics",
  "Sexual Health",
  "Mitochondrial Health",
  "Anti-Inflammation",
];

export const CAT_COLORS = {
  "Anabolics / HRT": "#d97757",
  "GLP / Metabolic": "var(--color-accent)",
  "GH Peptides": "#3b82f6",
  Sleep: "#8b5cf6",
  Nootropic: "#a855f7",
  Longevity: "#f59e0b",
  Mitochondrial: "#10b981",
  "Healing / Recovery": "#06b6d4",
  Immune: "#84cc16",
  "Skin / Hair / Nails": "#ec4899",
  "Sexual Health": "#f97316",
  "Relational Performance": "#e11d48",
  "Estrogen Control": "#e05a8a",
  "Testosterone Support": "#e8a44a",
  "Thyroid Support": "#7ec8e3",
  SARMs: "#dc2626",
  "Khavinson Bioregulators": "#6366f1",
};

/** `r, g, b` for CSS `rgba(var(--cc-rgb), a)` on category pills. */
export function hexToRgbCsv(hex) {
  const raw = String(hex ?? "")
    .trim()
    .replace(/^#/, "");
  if (!raw) return "0, 212, 170";
  const full = raw.length === 3 ? raw.split("").map((c) => c + c).join("") : raw;
  if (full.length !== 6) return "0, 212, 170";
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  if ([r, g, b].some((n) => Number.isNaN(n))) return "0, 212, 170";
  return `${r}, ${g}, ${b}`;
}

/** Custom properties for `.pcard` / category row + `.pill--category`. */
export function getCategoryCssVars(cat) {
  const cc = CAT_COLORS[cat] ?? "var(--color-accent)";
  const base = { "--cc": cc };
  if (String(cc).trim().startsWith("var(")) return base;
  return { ...base, "--cc-rgb": hexToRgbCsv(cc) };
}
