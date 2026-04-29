/**
 * Strip BATCH## / batch## references from export array body only (catalog hygiene).
 * Does not modify JSDoc above `export const BATCHn = [`.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

function processBody(body) {
  let s = body;
  let prev;

  // Pre-clean (edge cases where generic sweeps would mangle prose)
  s = s.replace(/ covered in BATCH\d+ —/g, " —");
  s = s.replace(
    /See Pterostilbene entry \(pending in batch\d+\) for full discussion\./g,
    "See the Pterostilbene entry for full discussion.",
  );
  // Epitalon notes: must run before Sweep 4 — `BATCH1 ` would strip "BATCH1 " from "BATCH1 contains"
  s = s.replace(
    /## Epitalon vs N-Acetyl Epitalon Amidate — The Catalog's Two Forms\nBATCH1 contains \*\*N-Acetyl Epitalon Amidate\*\*/g,
    "## Epitalon vs N-Acetyl Epitalon Amidate — The Catalog's Two Forms\nThe catalog also contains **N-Acetyl Epitalon Amidate**",
  );
  s = s.replace(/\nBATCH1 contains \*\*/g, "\nThe catalog also contains **");
  // Before Sweep 4 — strip `(in BATCH1)` so `BATCH1 ` is not partially deleted
  s = s.replace(/\(in BATCH\d+\)/g, "");

  // Sweep 1 — ` (BATCH12)` style
  s = s.replace(/ \(BATCH\d+\)/g, "");

  // Sweep 2 — `(BATCH9 — foo` → `(foo`
  s = s.replace(/\(BATCH\d+\s*[—:-]\s*/g, "(");

  // Sweep 3 — `(BATCH22 foo` → `(foo` (repeat)
  do {
    prev = s;
    s = s.replace(/\(BATCH\d+ /g, "(");
  } while (s !== prev);

  // Sweep 3b — `(BATCH18-19 foo` → `(foo`
  do {
    prev = s;
    s = s.replace(/\(BATCH\d+-\d+\s+/g, "(");
  } while (s !== prev);

  // Sweep 4 — bare `BATCH26 ` prefix in prose
  s = s.replace(/BATCH\d+ /g, "");

  // Sweep 5 — ` (batch9)`
  s = s.replace(/ \(batch\d+\)/g, "");

  // Sweep 6 — `(batch1, ` / `(batch9 `
  do {
    prev = s;
    s = s.replace(/\(batch\d+, /g, "(");
    s = s.replace(/\(batch\d+ /g, "(");
  } while (s !== prev);

  // Sweep 7 — `**Base Semax (batch1):**`
  s = s.replace(/\*\*([^*]+) \(batch\d+\):\*\*/g, "**$1:**");

  // Sweep 8 — `**Title (BATCH1):**`
  s = s.replace(/\*\*([^*]+) \(BATCH\d+\):\*\*/g, "**$1:**");

  // Sweep 9 — duplicate `(in BATCH#)` (already in pre-clean; keep for idempotent re-runs)
  s = s.replace(/\(in BATCH\d+\)/g, "");

  // Sweep 10 — ` in BATCH22)` end of paren phrase (e.g. SS-31 in BATCH22)
  s = s.replace(/ in BATCH\d+\)/g, ")");

  // Sweep 11 — ` in batch19)` lowercase
  s = s.replace(/ in batch\d+\)/g, ")");

  return s;
}

for (let n = 10; n <= 28; n++) {
  const rel = `src/data/compounds/batch${n}.js`;
  const p = path.join(root, rel);
  let content = fs.readFileSync(p, "utf8");
  const m = content.match(/^([\s\S]*?)(export const BATCH\d+ = )(\[[\s\S]*)$/);
  if (!m) {
    console.error("parse failed:", rel);
    process.exit(1);
  }
  const [, prefix, exportKw, bodyWithBracket] = m;
  const newBody = processBody(bodyWithBracket);
  fs.writeFileSync(p, prefix + exportKw + newBody);
  console.log("updated", rel);
}
