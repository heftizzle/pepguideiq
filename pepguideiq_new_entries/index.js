/**
 * Raw catalog batch imports (pre-merge). Vendor names in strings are stripped in `normalizeNewCatalogEntry`.
 * `stabilityDays` / `stabilityNote` are set in `normalizeNewCatalogEntry` via `resolveStability` (src/lib/catalogStability.js);
 * set either field on a raw entry to override the automatic rules.
 */
import { BATCH1 } from "./batch1.js";
import { BATCH2 } from "./batch2.js";
import { BATCH3 } from "./batch3.js";
import { BATCH4 } from "./batch4.js";
import { BATCH5 } from "./batch5.js";
import { BATCH6 } from "./batch6.js";
import { BATCH7 } from "./batch7.js";

export const NEW_PEPTIDES = [...BATCH1, ...BATCH2, ...BATCH3, ...BATCH4, ...BATCH5, ...BATCH6, ...BATCH7];
