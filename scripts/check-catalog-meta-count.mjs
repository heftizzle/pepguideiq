/**
 * Ensures src/data/catalogMeta.js CATALOG_COUNT matches catalog.js (PEPTIDES.length).
 * Run automatically before `pnpm run build`. Prevents nav badge drift after BATCH merges.
 */
import { CATALOG_COUNT as countFromCatalog } from "../src/data/catalog.js";
import { CATALOG_COUNT as countFromMeta } from "../src/data/catalogMeta.js";

if (countFromMeta !== countFromCatalog) {
  console.error(
    `[check-catalog-meta] Mismatch: catalogMeta.js has CATALOG_COUNT=${countFromMeta}, catalog.js has ${countFromCatalog}.\n` +
      "Fix: from repo root run:\n" +
      '  node -e "import(\'./src/data/catalog.js\').then(m => console.log(m.CATALOG_COUNT))"\n' +
      "Then set export const CATALOG_COUNT in src/data/catalogMeta.js to that number."
  );
  process.exit(1);
}

console.log(`[check-catalog-meta] OK — CATALOG_COUNT=${countFromMeta} (catalogMeta matches catalog.js).`);
