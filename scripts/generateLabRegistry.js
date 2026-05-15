/**
 * Emits workers/labMarkersRegistry.generated.json for Worker-side alias resolution.
 * Run from repo root: node scripts/generateLabRegistry.js
 * Wired into pnpm run build before vite build.
 */
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { LAB_MARKER_REGISTRY } from "../src/data/labMarkerRegistry.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outPath = join(__dirname, "..", "workers", "labMarkersRegistry.generated.json");

const markers = LAB_MARKER_REGISTRY.map((m) => ({
  canonical_key: m.canonical_key,
  display_name: m.display_name,
  short_name: m.short_name ?? null,
  aliases: Array.isArray(m.aliases) ? m.aliases : [],
}));

const payload = {
  generated_at: new Date().toISOString(),
  marker_count: markers.length,
  markers,
};

writeFileSync(outPath, `${JSON.stringify(payload)}\n`, "utf8");
console.log(`[generateLabRegistry] wrote ${markers.length} markers → workers/labMarkersRegistry.generated.json`);
