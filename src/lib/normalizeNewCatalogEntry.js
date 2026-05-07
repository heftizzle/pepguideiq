import { sanitizeVendorRefs, neutralSourcingFallback } from "./catalogVendorSanitize.js";
import { resolveStability, resolveStabilityDays } from "./catalogStability.js";
import { normalizeFinnrickProductUrl } from "./finnrickUrl.js";

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

function defaultBacWaterMlFromRaw(raw) {
  const nested = Number(raw?.reconstitution?.typicalVolumeMl);
  if (Number.isFinite(nested) && nested > 0) return nested;
  const top = Number(raw?.reconstitutionVolumeMl);
  if (Number.isFinite(top) && top > 0) return top;
  return 2;
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
  const mechanismSource =
    raw.mechanism != null && String(raw.mechanism).trim()
      ? String(raw.mechanism)
      : raw.description != null && String(raw.description).trim()
        ? String(raw.description)
        : "";
  const categories = Array.isArray(raw.category)
    ? raw.category.map(String)
    : primary != null
      ? [String(primary)]
      : [];
  const tags = [...new Set([...(Array.isArray(raw.tags) ? raw.tags : []), ...extraTags])];
  const dosing = formatDosing(raw.dosingRange);
  const warnings = Array.isArray(raw.warnings) ? raw.warnings.map((w) => sanitizeVendorRefs(String(w))) : [];
  const noteParts = [];
  if (raw.notes != null && String(raw.notes).trim()) noteParts.push(sanitizeVendorRefs(String(raw.notes)));
  if (raw.variantNote) noteParts.push(sanitizeVendorRefs(String(raw.variantNote)));
  const notesJoined = noteParts.filter(Boolean).join(" ");
  const sourcingNotesNormalized =
    raw.sourcingNotes != null && String(raw.sourcingNotes).trim()
      ? neutralSourcingFallback(String(raw.sourcingNotes))
      : "";

  const benefitsFromTags = tags
    .slice(0, 8)
    .map(tagToBenefitPhrase)
    .filter(Boolean);
  const benefitsExplicit = Array.isArray(raw.benefits) ? raw.benefits.map((b) => sanitizeVendorRefs(String(b))) : [];
  const benefits = benefitsExplicit.length ? benefitsExplicit : benefitsFromTags;

  const cycle =
    raw.cycle != null
      ? String(raw.cycle)
      : dosing.titrationNote
        ? `Per ${dosing.titrationNote}`
        : "Per protocol / research context";

  const rawForRoute = { ...raw, mechanism: mechanismSource };
  const routes =
    Array.isArray(raw.route) && raw.route.length > 0
      ? raw.route.map((r) => String(r))
      : typeof raw.route === "string" && raw.route.trim()
        ? [raw.route.trim()]
        : inferRoute(rawForRoute);
  const oralOnly = routes.length === 1 && routes[0] === "oral";
  const topicalOnly = routes.length === 1 && routes[0] === "topical";
  const storageDefault = topicalOnly
    ? "Room temperature; protect from light per formulation"
    : oralOnly
      ? "Room temperature typical for oral solids unless supplier specifies otherwise"
      : "Refrigerate or freeze lyophilized material; follow supplier COA";

  const typicalDose =
    raw.typicalDose != null && String(raw.typicalDose).trim() ? String(raw.typicalDose) : dosing.typicalDose;
  const startDose =
    raw.startDose != null && String(raw.startDose).trim() ? String(raw.startDose) : dosing.startDose;
  const titrationNote =
    raw.titrationNote != null && String(raw.titrationNote).trim()
      ? String(raw.titrationNote)
      : dosing.titrationNote;

  const sideEffectsExplicit = Array.isArray(raw.sideEffects)
    ? raw.sideEffects.map((s) => sanitizeVendorRefs(String(s)))
    : [];
  const sideEffects = sideEffectsExplicit.length ? sideEffectsExplicit : warnings.length ? warnings : ["Use under qualified oversight"];

  const reconstitution =
    typeof raw.reconstitution === "string"
      ? sanitizeVendorRefs(raw.reconstitution)
      : formatReconstitution(raw.reconstitution);

  const normalizedComponents = [];
  if (Array.isArray(raw.components) && raw.components.length > 0) {
    for (const c of raw.components) {
      const name = typeof c?.name === "string" ? c.name.trim() : "";
      if (!name) continue;
      const mg = Number(c?.mg);
      if (Number.isFinite(mg) && mg >= 0) {
        normalizedComponents.push({ name, mg });
        continue;
      }
      if (Object.prototype.hasOwnProperty.call(c, "mgPerMl")) {
        const rawMpm = c.mgPerMl;
        if (rawMpm === null) normalizedComponents.push({ name, mgPerMl: null });
        else {
          const mpm = Number(rawMpm);
          if (Number.isFinite(mpm) && mpm >= 0) normalizedComponents.push({ name, mgPerMl: mpm });
        }
      }
    }
  }
  const componentsField = normalizedComponents.length ? { components: normalizedComponents } : {};
  const dosePerInjectionField = (() => {
    const dose = Number(raw.dose_per_injection_mg);
    return Number.isFinite(dose) && dose > 0 ? { dose_per_injection_mg: dose } : {};
  })();

  const defaultBacForVial = defaultBacWaterMlFromRaw(raw);

  let reconVol = Number(raw.reconstitutionVolumeMl);
  if (!Number.isFinite(reconVol) || reconVol <= 0) {
    const nestedVol = Number(raw.reconstitution?.typicalVolumeMl);
    if (normalizedComponents.length >= 2 && Number.isFinite(nestedVol) && nestedVol > 0) {
      reconVol = nestedVol;
    }
  }
  const reconstitutionVolumeField =
    Number.isFinite(reconVol) && reconVol > 0 ? { reconstitutionVolumeMl: reconVol } : {};

  const normalizedVialSizeOptions =
    Array.isArray(raw.vialSizeOptions) && raw.vialSizeOptions.length > 0
      ? raw.vialSizeOptions
          .map((o) => {
            if (typeof o === "number" && Number.isFinite(o) && o > 0) {
              return {
                label: `${o}mg total vial`,
                totalMg: o,
                bacWaterMl: defaultBacForVial,
              };
            }
            return {
              label: typeof o?.label === "string" ? o.label.trim() : "",
              totalMg: Number(o?.totalMg),
              bacWaterMl: Number(o?.bacWaterMl),
            };
          })
          .filter(
            (opt) =>
              opt.label &&
              Number.isFinite(opt.totalMg) &&
              opt.totalMg > 0 &&
              Number.isFinite(opt.bacWaterMl) &&
              opt.bacWaterMl > 0
          )
      : [];
  const vialSizeOptionsField = normalizedVialSizeOptions.length ? { vialSizeOptions: normalizedVialSizeOptions } : {};

  const finnrickHref = normalizeFinnrickProductUrl(raw.finnrickUrl);
  const finnrickUrlField = finnrickHref ? { finnrickUrl: finnrickHref } : {};

  const entry = {
    id: String(raw.id),
    name: String(raw.name),
    category: primary,
    categories,
    aliases: Array.isArray(raw.aliases) ? raw.aliases.map(String) : [],
    mechanism: sanitizeVendorRefs(mechanismSource),
    halfLife: String(raw.halfLife ?? ""),
    route: routes,
    typicalDose,
    startDose,
    titrationNote,
    benefits: benefits.length ? benefits : ["Research / protocol context — see mechanism"],
    sideEffects,
    stacksWith: Array.isArray(raw.stacksWith) ? raw.stacksWith.map(String) : [],
    cycle,
    storage: raw.storage != null ? sanitizeVendorRefs(String(raw.storage)) : storageDefault,
    reconstitution,
    notes: notesJoined || "",
    tags,
    ...componentsField,
    ...dosePerInjectionField,
    ...reconstitutionVolumeField,
    ...vialSizeOptionsField,
    ...finnrickUrlField,
    ...(sourcingNotesNormalized ? { sourcingNotes: sourcingNotesNormalized } : {}),
    ...(raw.variantOf ? { variantOf: String(raw.variantOf) } : {}),
    ...(raw.variantNote ? { variantNote: sanitizeVendorRefs(String(raw.variantNote)) } : {}),
    ...(raw.tier != null ? { tier: String(raw.tier) } : {}),
    ...(raw.bioavailabilityNote != null && String(raw.bioavailabilityNote).trim()
      ? { bioavailabilityNote: sanitizeVendorRefs(String(raw.bioavailabilityNote)) }
      : {}),
    ...(raw.bioavailability != null && String(raw.bioavailability).trim()
      ? { bioavailability: sanitizeVendorRefs(String(raw.bioavailability)) }
      : {}),
    ...(raw.bioavailabilityWarning === true ? { bioavailabilityWarning: true } : {}),
    ...(raw.subtitle != null && String(raw.subtitle).trim()
      ? { subtitle: sanitizeVendorRefs(String(raw.subtitle).trim()) }
      : {}),
    ...(typeof raw.popularityRank === "number" && Number.isFinite(raw.popularityRank)
      ? { popularityRank: raw.popularityRank }
      : {}),
  };
  const merged = { ...entry };
  if (Object.prototype.hasOwnProperty.call(raw, "stabilityDays")) merged.stabilityDays = raw.stabilityDays;
  if (Object.prototype.hasOwnProperty.call(raw, "stabilityNote")) merged.stabilityNote = raw.stabilityNote;
  const stab = resolveStability(merged);
  return { ...entry, stabilityDays: stab.stabilityDays, stabilityNote: stab.stabilityNote };
}
