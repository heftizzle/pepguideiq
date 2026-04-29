import { getTierPlanCardBullets, TIERS, formatPrice } from "../lib/tiers.js";
import { ALL_COMPOUNDS } from "./compounds/index.js";
import { normalizeNewCatalogEntry } from "../lib/normalizeNewCatalogEntry.js";
import { sanitizeVendorRefs } from "../lib/catalogVendorSanitize.js";
import { resolveStability } from "../lib/catalogStability.js";
import { attachPopularityRanks } from "./popularityRank.js";
import { normalizeFinnrickProductUrl } from "../lib/finnrickUrl.js";

/**
 * Peptide catalog row schema (merged `PEPTIDES`):
 * - id, name, aliases, mechanism, halfLife, route[], typicalDose, startDose, titrationNote, benefits[], sideEffects[],
 * - form?: string — dosage form (e.g. Injectable + reconstitution context); shown in Library detail when set.
 * - unit?: string — primary dosing unit label (e.g. mcg, mg); shown in Library detail when set.
 *   stacksWith[], cycle, storage, reconstitution, notes, tags[]
 * - category: string — primary category (pill color, display); legacy core rows use this only.
 * - categories?: string[] — full category list for multi-label rows (filter matches any entry).
 * - secondaryCategory?: string[] — optional, not populated yet; reserved for dual-tag filter mode (see App.jsx).
 * - variantOf?: string — optional parent peptide id; UI shows “Variant of: [parent name]”.
 * - variantNote?: string — optional difference vs parent; card shows as tooltip on the variant line.
 * - tier?: string — optional entitlements / catalog tier hint.
 * - stabilityDays?: number | null — reconstituted vial fridge stability (days); null = no vial tracking (see catalogStability.js).
 * - popularityRank?: number — Library "Popular" sort; lower = more popular (see popularityRank.js); missing/999 sinks to bottom.
 * - bioavailability?: string — shown on library cards / detail (see peptideBioavailability.js).
 * - bioavailabilityWarning?: boolean — amber ⚠ + tooltip when true (low systemic exposure).
 * - components?: { name: string, mg: number }[] — optional blend breakdown for VialTracker blend calculator (e.g. KLOW).
 * - reconstitutionVolumeMl?: number — optional default BAC water volume (mL) for blends; pre-fills add-vial form.
 * - vialSizeOptions?: { label: string, totalMg: number, bacWaterMl: number }[] — optional add-vial size presets (VialTracker).
 * - finnrickUrl?: string — optional https://…finnrick.com/… product page when verified testing exists; library tile shows “Verified by Finnrick ↗”.
 */

/** Strip vendor URLs, brand sourcing, prices from text fields (all rows). */
function sanitizeEntryText(entry) {
  const out = { ...entry };
  const finn = normalizeFinnrickProductUrl(out.finnrickUrl);
  if (finn) out.finnrickUrl = finn;
  else delete out.finnrickUrl;
  if (typeof out.notes === "string") out.notes = sanitizeVendorRefs(out.notes);
  if (typeof out.mechanism === "string") out.mechanism = sanitizeVendorRefs(out.mechanism);
  if (typeof out.bioavailabilityNote === "string") out.bioavailabilityNote = sanitizeVendorRefs(out.bioavailabilityNote);
  if (typeof out.bioavailability === "string") out.bioavailability = sanitizeVendorRefs(out.bioavailability);
  if (Array.isArray(out.sideEffects)) {
    out.sideEffects = out.sideEffects.map((s) => sanitizeVendorRefs(String(s)));
  }
  return out;
}

const PEPTIDES_CORE = [
  // Canonical IDs (45) + new glp3-rc entry. Existing entries preserved; only IDs/aliases normalized where needed.

];

/** IDs present in batch compounds — those rows win over legacy `PEPTIDES_CORE` when both define the same `id`. */
const compoundIds = new Set(ALL_COMPOUNDS.map((raw) => String(raw.id)));
const mergedFromCompounds = ALL_COMPOUNDS.map((raw) => sanitizeEntryText(normalizeNewCatalogEntry(raw)));
const coreOnly = PEPTIDES_CORE.filter((p) => !compoundIds.has(String(p.id))).map(sanitizeEntryText);

export const PEPTIDES = attachPopularityRanks(
  [...mergedFromCompounds, ...coreOnly].map((p) => {
    const stab = resolveStability(p);
    return {
      ...p,
      stabilityDays: Object.prototype.hasOwnProperty.call(p, "stabilityDays") ? p.stabilityDays : stab.stabilityDays,
      stabilityNote: Object.prototype.hasOwnProperty.call(p, "stabilityNote") ? p.stabilityNote : stab.stabilityNote,
    };
  })
);

/** Merged catalog row count (batches + legacy core-only rows). Use in UI instead of hardcoding. */
export const CATALOG_COUNT = PEPTIDES.length;

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

const PLAN_CONFIG = [
  {
    id: "entry",
    period: "forever",
    color: TIERS.entry.cardAccent,
    features: getTierPlanCardBullets("entry", CATALOG_COUNT),
  },
  {
    id: "pro",
    period: "/mo",
    color: TIERS.pro.cardAccent,
    popular: true,
    features: getTierPlanCardBullets("pro", CATALOG_COUNT),
  },
  {
    id: "elite",
    period: "/mo",
    color: TIERS.elite.cardAccent,
    features: getTierPlanCardBullets("elite", CATALOG_COUNT),
  },
  {
    id: "goat",
    period: "/mo",
    color: TIERS.goat.cardAccent,
    features: getTierPlanCardBullets("goat", CATALOG_COUNT),
  },
];

export const PLANS = PLAN_CONFIG.map((plan) => ({
  ...plan,
  label: TIERS[plan.id]?.name ?? TIERS.entry.name,
  price: formatPrice(plan.id),
}));
