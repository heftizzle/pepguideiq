import { sanitizeVendorRefs, neutralSourcingFallback } from "./catalogVendorSanitize.js";

function formatReconstitution(r) {
  if (r == null) return "Per supplier / protocol";
  if (typeof r === "string") return sanitizeVendorRefs(r);
  const sol = r.solvent != null ? String(r.solvent) : "";
  const parts = [];
  if (sol) parts.push(sol);
  if (r.typicalVialMg != null && r.typicalVolumeMl != null) {
    parts.push(`typical ${r.typicalVialMg}mg vial, ~${r.typicalVolumeMl}mL reconstitution volume`);
  } else if (r.typicalVialMg != null) {
    parts.push(`typical ${r.typicalVialMg}mg vial`);
  }
  return sanitizeVendorRefs(parts.join(". ")) || "Per supplier / protocol";
}

function inferRoute(raw) {
  const blob = `${raw.mechanism} ${raw.name} ${formatReconstitution(raw.reconstitution)}`.toLowerCase();
  const out = [];
  if (blob.includes("topical") || raw.name?.includes("Topical")) out.push("topical");
  if (blob.includes("intranasal") || blob.includes("nasal")) out.push("nasal");
  if (blob.includes("oral") || blob.includes("capsule") || blob.includes("tablet") || blob.includes("sublingual")) {
    out.push("oral");
  }
  if (blob.includes("iv ") || blob.includes("infusion")) out.push("IV infusion");
  if (out.length === 0) out.push("subQ injection");
  return [...new Set(out)];
}

function formatDosing(d) {
  if (!d) return { typicalDose: "", startDose: "", titrationNote: "" };
  const low = d.low != null ? String(d.low) : "";
  const medium = d.medium != null ? String(d.medium) : "";
  const high = d.high != null ? String(d.high) : "";
  const freq = d.frequency != null ? String(d.frequency) : "";
  const typicalDose =
    low && medium && high
      ? `${low}–${medium}–${high}`
      : low && high && low !== high
        ? `${low}–${high}`
        : low || high || "";
  const withFreq = freq ? `${typicalDose}${typicalDose ? " · " : ""}${freq}` : typicalDose;
  return {
    typicalDose: withFreq || typicalDose,
    startDose: low || high || "",
    titrationNote: freq,
  };
}

function mergeCategory(raw) {
  if (Array.isArray(raw.category)) {
    const [first, ...rest] = raw.category;
    return { primary: first, extraTags: rest.map((c) => c.toLowerCase()) };
  }
  return { primary: raw.category, extraTags: [] };
}

function tagToBenefitPhrase(tag) {
  const t = String(tag).trim();
  if (!t) return null;
  return t
    .split(/[\s/]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

/**
 * Map batch-file / import shape to canonical `PEPTIDES` row used by App.jsx.
 * @param {Record<string, unknown>} raw
 */
export function normalizeNewCatalogEntry(raw) {
  const { primary, extraTags } = mergeCategory(raw);
  const categories = Array.isArray(raw.category)
    ? raw.category.map(String)
    : primary != null
      ? [String(primary)]
      : [];
  const tags = [...new Set([...(Array.isArray(raw.tags) ? raw.tags : []), ...extraTags])];
  const dosing = formatDosing(raw.dosingRange);
  const warnings = Array.isArray(raw.warnings) ? raw.warnings.map((w) => sanitizeVendorRefs(String(w))) : [];
  const noteParts = [];
  if (raw.sourcingNotes) noteParts.push(neutralSourcingFallback(String(raw.sourcingNotes)));
  if (raw.variantNote) noteParts.push(sanitizeVendorRefs(String(raw.variantNote)));
  const notes = noteParts.filter(Boolean).join(" ");

  const benefits = tags
    .slice(0, 8)
    .map(tagToBenefitPhrase)
    .filter(Boolean);

  const cycle =
    raw.cycle != null
      ? String(raw.cycle)
      : dosing.titrationNote
        ? `Per ${dosing.titrationNote}`
        : "Per protocol / research context";

  const routes = inferRoute(raw);
  const oralOnly = routes.length === 1 && routes[0] === "oral";
  const storageDefault = oralOnly
    ? "Room temperature typical for oral solids unless supplier specifies otherwise"
    : "Refrigerate or freeze lyophilized material; follow supplier COA";

  return {
    id: String(raw.id),
    name: String(raw.name),
    category: primary,
    categories,
    aliases: Array.isArray(raw.aliases) ? raw.aliases.map(String) : [],
    mechanism: sanitizeVendorRefs(String(raw.mechanism ?? "")),
    halfLife: String(raw.halfLife ?? ""),
    route: inferRoute(raw),
    typicalDose: dosing.typicalDose,
    startDose: dosing.startDose,
    titrationNote: dosing.titrationNote,
    benefits: benefits.length ? benefits : ["Research / protocol context — see mechanism"],
    sideEffects: warnings.length ? warnings : ["Use under qualified oversight"],
    stacksWith: Array.isArray(raw.stacksWith) ? raw.stacksWith.map(String) : [],
    cycle,
    storage: raw.storage != null ? sanitizeVendorRefs(String(raw.storage)) : storageDefault,
    reconstitution: formatReconstitution(raw.reconstitution),
    notes: notes || neutralSourcingFallback(raw.sourcingNotes),
    tags,
    ...(raw.variantOf ? { variantOf: String(raw.variantOf) } : {}),
    ...(raw.variantNote ? { variantNote: sanitizeVendorRefs(String(raw.variantNote)) } : {}),
    ...(raw.tier != null ? { tier: String(raw.tier) } : {}),
  };
}
