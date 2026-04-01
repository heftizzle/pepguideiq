/**
 * Raw catalog batch imports (pre-merge). Vendor names in strings are stripped in `normalizeNewCatalogEntry`.
 */
import { BATCH1 } from "./batch1.js";
import { BATCH2 } from "./batch2.js";
import { BATCH3 } from "./batch3.js";
import { BATCH4 } from "./batch4.js";
import { BATCH5 } from "./batch5.js";
import { BATCH6 } from "./batch6.js";

export const NEW_PEPTIDES = [...BATCH1, ...BATCH2, ...BATCH3, ...BATCH4, ...BATCH5, ...BATCH6];
