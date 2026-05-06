/**
 * Reports catalog rows whose primary category (first in categories[]) is not a CAT_COLORS key.
 * Run: node scripts/audit-catalog-categories.mjs
 */
import { PEPTIDES, CAT_COLORS } from "../src/data/catalog.js";

function peptideCategories(p) {
  if (Array.isArray(p.categories) && p.categories.length) return p.categories;
  if (Array.isArray(p.category)) return p.category;
  if (typeof p.category === "string" && p.category) return [p.category];
  return [];
}

const valid = new Set(Object.keys(CAT_COLORS));
const bad = [];

for (const p of PEPTIDES) {
  const cats = peptideCategories(p);
  const primary = cats[0] ?? "";
  if (!primary || !valid.has(primary)) {
    bad.push({
      id: p.id,
      name: p.name,
      primary,
      categories: cats,
    });
  }
}

if (bad.length === 0) {
  console.log("OK: all", PEPTIDES.length, "compounds have canonical primary category.");
  process.exit(0);
}

console.log("Invalid or empty primary category:", bad.length, "of", PEPTIDES.length);
for (const row of bad) {
  console.log(JSON.stringify(row));
}
process.exit(1);
