/**
 * Catalog filter helpers — pure functions; pass compound rows as arguments (no PEPTIDES import).
 */

/** All catalog categories for a row (multi-label imports use `categories[]`; core rows use string `category`). */
export function peptideCategories(p) {
  if (Array.isArray(p.categories) && p.categories.length) return p.categories;
  if (Array.isArray(p.category)) return p.category;
  if (typeof p.category === "string" && p.category) return [p.category];
  return [];
}

/** Each filter pill value maps to one or more data `category` / `categories` strings. */
export const CATEGORY_FILTER_MAP = {
  Longevity: ["Longevity", "Antioxidant", "Methylation"],
  Nootropic: ["Nootropic", "Cognitive"],
  Healing: ["Healing / Recovery", "Healing"],
  "GLP / Metabolic": ["GLP / Metabolic", "Metabolic"],
  "Anabolics / HRT": ["Anabolics / HRT", "HRT", "TRT", "Hormone Replacement", "Hormone"],
  "Khavinson Bioregulators": ["Khavinson Bioregulators", "Bioregulator"],
  "Skin / Hair / Nails": ["Skin / Hair / Nails", "Cosmetic"],
  "Diabetes Management": ["Diabetes Management"],
  Cardiovascular: ["Cardiovascular"],
  Adaptogen: ["Adaptogen"],
  Performance: ["Performance"],
  Foundational: ["Foundational", "Foundational Supplement"],
  "Sexual Health": ["Sexual Health", "Relational Performance", "Sexual Function"],
};

export function matchesCategory(p, activeCategory) {
  if (activeCategory === "All") return true;
  const filterStrings = CATEGORY_FILTER_MAP[activeCategory] ?? [activeCategory];
  const pCats = [
    ...(Array.isArray(p.category) ? p.category : p.category ? [p.category] : []),
    ...(Array.isArray(p.categories) ? p.categories : p.categories ? [p.categories] : []),
  ];
  return filterStrings.some((f) => pCats.includes(f));
}

export function primaryCategory(p) {
  return peptideCategories(p)[0] ?? "";
}

/** Route-of-administration filter keys; one active at a time, stacks with category + search. */
export function peptideMatchesRouteFilter(p, routeKey) {
  if (!routeKey) return true;
  const parts = Array.isArray(p.route) ? p.route.map((x) => String(x).toLowerCase()) : [];
  const s = parts.join(" | ");
  switch (routeKey) {
    case "injectable":
      return (
        /subq|subcutaneous|intramuscular|injection|injectable|iv infusion|intravenous|nebulized/.test(s) ||
        /\biv\b/.test(s) ||
        /(^|[\s,/])im([\s,/]|$)/.test(s)
      );
    case "intranasal":
      return /intranasal|nasal|nasal spray/.test(s);
    case "oral":
      return /\boral\b|tablet|capsule/.test(s);
    case "topical":
      return /topical|cream|serum|transdermal/.test(s);
    default:
      return true;
  }
}
