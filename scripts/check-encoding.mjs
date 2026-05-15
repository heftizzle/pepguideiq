/**
 * Fail the build if src/App.jsx contains known UTF-8/Latin-1 mojibake signatures.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appPath = path.join(__dirname, "..", "src", "App.jsx");

/** Mojibake prefixes (UTF-8 bytes misread as Windows-1252 / Latin-1). */
const MOJIBAKE_PATTERNS = ["ðŸ", "â€", "Â·", "â†", "â¬", "Ã", "â˜"];

const text = fs.readFileSync(appPath, "utf8");
const lines = text.split(/\r?\n/);

/** @type {Map<string, number[]>} */
const hits = new Map();
for (const pattern of MOJIBAKE_PATTERNS) {
  hits.set(pattern, []);
}

for (let i = 0; i < lines.length; i += 1) {
  const line = lines[i];
  for (const pattern of MOJIBAKE_PATTERNS) {
    if (line.includes(pattern)) {
      hits.get(pattern).push(i + 1);
    }
  }
}

let failed = false;
for (const pattern of MOJIBAKE_PATTERNS) {
  const lineNums = hits.get(pattern);
  if (lineNums.length > 0) {
    failed = true;
    console.error(`pattern ${JSON.stringify(pattern)} -> lines: ${lineNums.join(", ")}`);
  }
}

if (failed) {
  console.error(`[check:encoding] FAIL — mojibake signatures found in ${path.relative(process.cwd(), appPath)}`);
  process.exit(1);
}

console.log("[check:encoding] OK — no mojibake detected");
process.exit(0);
