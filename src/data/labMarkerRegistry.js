import { LAB_CATEGORIES } from "./labMarkers/categories.js";
import { LAB_MARKER_ALIAS_PATCHES } from "./labMarkers/patchAliases.js";
import { LAB_MARKERS_V1_CBC } from "./labMarkers/v1cbc.js";
import { LAB_MARKERS_V1_CMP } from "./labMarkers/v1cmp.js";
import { LAB_MARKERS_V1_FATTY_THYROID } from "./labMarkers/v1fatty_thyroid.js";
import { LAB_MARKERS_V1_HORMONES } from "./labMarkers/v1hormones.js";
import { LAB_MARKERS_V1_IMMUNOLOGY, LAB_MARKERS_V1_GENETIC } from "./labMarkers/v1immune_genetic.js";
import { LAB_MARKERS_V1_LIPIDS_INFLAMMATION } from "./labMarkers/v1lipids.js";
import { LAB_MARKERS_V1_META_VITAMINS_IRON } from "./labMarkers/v1meta_vitamins_iron.js";
import { LAB_MARKERS_V1_URINALYSIS } from "./labMarkers/v1urinalysis.js";
import { LAB_MARKERS_V2 } from "./labMarkers/v2.js";

function finalizeMarkers(markers) {
  return markers.map((m) => {
    const extra = LAB_MARKER_ALIAS_PATCHES[m.canonical_key];
    if (!extra?.length) return m;
    const seen = new Set((m.aliases || []).map((a) => String(a).trim()));
    const aliases = [...(m.aliases || [])];
    for (const a of extra) {
      const t = String(a).trim();
      if (t && !seen.has(t)) {
        seen.add(t);
        aliases.push(t);
      }
    }
    return { ...m, aliases };
  });
}

const LAB_MARKER_REGISTRY_RAW = [
  ...LAB_MARKERS_V1_CBC,
  ...LAB_MARKERS_V1_CMP,
  ...LAB_MARKERS_V1_LIPIDS_INFLAMMATION,
  ...LAB_MARKERS_V1_FATTY_THYROID,
  ...LAB_MARKERS_V1_HORMONES,
  ...LAB_MARKERS_V1_META_VITAMINS_IRON,
  ...LAB_MARKERS_V1_URINALYSIS,
  ...LAB_MARKERS_V1_IMMUNOLOGY,
  ...LAB_MARKERS_V1_GENETIC,
  ...LAB_MARKERS_V2,
];

export const LAB_MARKER_REGISTRY = finalizeMarkers(LAB_MARKER_REGISTRY_RAW);

export { LAB_CATEGORIES };

export const REGISTRY_VERSION = "2.0.0";

export const REGISTRY_SOURCES = [
  "LabCorp Dec 2018 (HEFTA,DANIEL G)",
  "LabCorp May 2020 (HEFTA,DANIEL G)",
  "Quest/Cleveland HeartLab Jan 2021 CardioIQ (HEFTA,DANIEL G)",
  "Clearwater Cardiovascular CAC Aug 2021 (HEFTA,DANIEL)",
  "Quest Jul 2021 / Aug 2022 / Jun 2023 / Dec 2023 (HEFTA,DANIEL G)",
  "Quest Apr 2026 CardioIQ (HEFTA,DANIEL G)",
  "Quest Apr 2026 full panel (HEFTA,CARISSA)",
];

export const REGISTRY_STATS = {
  version: REGISTRY_VERSION,
  total_markers: LAB_MARKER_REGISTRY.length,
  total_categories: LAB_CATEGORIES.length,
  sources: REGISTRY_SOURCES,
};

export function resolveMarkerKey(rawName) {
  if (!rawName) return null;
  const normalized = rawName.trim().toUpperCase();
  for (const marker of LAB_MARKER_REGISTRY) {
    if (marker.display_name.toUpperCase() === normalized) return marker.canonical_key;
    if (marker.short_name && marker.short_name.toUpperCase() === normalized) return marker.canonical_key;
    if (marker.aliases?.some((a) => a.toUpperCase() === normalized)) return marker.canonical_key;
  }
  return null;
}

export function getMarkerDef(canonical_key) {
  return LAB_MARKER_REGISTRY.find((m) => m.canonical_key === canonical_key) ?? null;
}
