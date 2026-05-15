/**
 * Emits workers/labMarkersRegistry.generated.json for Worker-side alias resolution.
 * Run from repo root: node scripts/generateLabRegistry.js
 * Wired into pnpm run build before vite build.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
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

/** Stable newline-terminated blob for compare + write. */
function formatPayload(markerRows) {
  return `${JSON.stringify({ marker_count: markerRows.length, markers: markerRows })}\n`;
}

/** LF-only for compare (Windows CRLF checkouts should not force churn). */
function normalizeEol(s) {
  return String(s).replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

const nextContent = formatPayload(markers);
const nextNorm = normalizeEol(nextContent);

let skipWrite = false;
if (existsSync(outPath)) {
  try {
    const raw = readFileSync(outPath, "utf8");
    if (normalizeEol(raw) === nextNorm) skipWrite = true;
  } catch {
    // Malformed or unreadable — rewrite
  }
}

if (skipWrite) {
  console.log(
    `[generateLabRegistry] unchanged (${markers.length} markers), skip write → workers/labMarkersRegistry.generated.json`,
  );
} else {
  writeFileSync(outPath, nextContent, "utf8");
  console.log(`[generateLabRegistry] wrote ${markers.length} markers → workers/labMarkersRegistry.generated.json`);
}
