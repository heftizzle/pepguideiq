/**
 * Batch-sourced compound rows (pre-merge into `PEPTIDES` via catalog.js).
 * Adding a batch: create batchN.js exporting BATCHN, then add import + spread below.
 */
import { BATCH1 } from "./batch1.js";
import { BATCH2 } from "./batch2.js";
import { BATCH3 } from "./batch3.js";
import { BATCH4 } from "./batch4.js";
import { BATCH5 } from "./batch5.js";
import { BATCH6 } from "./batch6.js";
import { BATCH7 } from "./batch7.js";
import { BATCH8 } from "./batch8.js";
import { BATCH9 } from "./batch9.js";

export const COMPOUNDS = [
  ...BATCH1,
  ...BATCH2,
  ...BATCH3,
  ...BATCH4,
  ...BATCH5,
  ...BATCH6,
  ...BATCH7,
  ...BATCH8,
  ...BATCH9,
];
