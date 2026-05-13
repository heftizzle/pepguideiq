/**
 * Batch-sourced compound rows (pre-merge into `PEPTIDES` via catalog.js).
 * Adding a batch: create batchN.js exporting BATCHN, then add import + spread below.
 * Live merged library size (core + batches, popularity, stability) → `CATALOG_COUNT` in `catalog.js`.
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
import { BATCH10 } from "./batch10.js";
import { BATCH11 } from "./batch11.js";
import { BATCH12 } from "./batch12.js";
import { BATCH13 } from "./batch13.js";
import { BATCH14 } from "./batch14.js";
import { BATCH15 } from "./batch15.js";
import { BATCH16 } from "./batch16.js";
import { BATCH17 } from "./batch17.js";
import { BATCH18 } from "./batch18.js";
import { BATCH19 } from "./batch19.js";
import { BATCH20 } from "./batch20.js";
import { BATCH21 } from "./batch21.js";
import { BATCH22 } from "./batch22.js";
import { BATCH23 } from "./batch23.js";
import { BATCH24 } from "./batch24.js";
import { BATCH25 } from "./batch25.js";
import { BATCH26 } from "./batch26.js";
import { BATCH27 } from "./batch27.js";
import { BATCH28 } from "./batch28.js";
import { BATCH29 } from "./batch29.js";
import { BATCH30 } from "./batch30.js";
import { BATCH31 } from "./batch31.js";
import { BATCH32 } from "./batch32.js";
import { BATCH33 } from "./batch33.js";
import { BATCH34 } from "./batch34.js";
import { BATCH35 } from "./batch35.js";
import { BATCH36 } from "./batch36.js";
import { BATCH37 } from "./batch37.js";
import { BATCH38 } from "./batch38.js";
import { BATCH39 } from "./batch39.js";
import { BATCH40 } from "./batch40.js";
import { BATCH41 } from "./batch41.js";
import { BATCH42 } from "./batch42.js";
import { BATCH43 } from "./batch43.js";

const _ALL_COMPOUNDS_RAW = [
  ...BATCH1,
  ...BATCH2,
  ...BATCH3,
  ...BATCH4,
  ...BATCH5,
  ...BATCH6,
  ...BATCH7,
  ...BATCH8,
  ...BATCH9,
  ...BATCH10,
  ...BATCH11,
  ...BATCH12,
  ...BATCH13,
  ...BATCH14,
  ...BATCH15,
  ...BATCH16,
  ...BATCH17,
  ...BATCH18,
  ...BATCH19,
  ...BATCH20,
  ...BATCH21,
  ...BATCH22,
  ...BATCH23,
  ...BATCH24,
  ...BATCH25,
  ...BATCH26,
  ...BATCH27,
  ...BATCH28,
  ...BATCH29,
  ...BATCH30,
  ...BATCH31,
  ...BATCH32,
  ...BATCH33,
  ...BATCH34,
  ...BATCH35,
  ...BATCH36,
  ...BATCH37,
  ...BATCH38,
  ...BATCH39,
  ...BATCH40,
  ...BATCH41,
  ...BATCH42,
  ...BATCH43,
];

// Last occurrence wins — newer batches override older ones for the same id.
function dedupeById(rows) {
  const map = new Map();
  for (const row of rows) {
    const id = String(row?.id ?? "");
    if (!id) continue;
    if (map.has(id) && typeof console !== "undefined") {
      console.warn(`[catalog] duplicate compound id "${id}" — keeping later batch entry`);
    }
    map.set(id, row);
  }
  return Array.from(map.values());
}

export const ALL_COMPOUNDS = dedupeById(_ALL_COMPOUNDS_RAW);

/** @deprecated Prefer `ALL_COMPOUNDS` — same array reference. */
export const COMPOUNDS = ALL_COMPOUNDS;
