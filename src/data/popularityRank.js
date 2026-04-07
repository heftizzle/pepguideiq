/**
 * Library "Popular" sort: lower popularityRank = more popular.
 * Tiers 1–3 are explicit (1–50). Tier 4 = 51–100, tier 5 = 101–143, unlisted = 999.
 *
 * Top ordering informed by US prescription volume context (e.g. TRT esters 11M+ cypionate
 * scripts class-wide; tadalafil multi-million Rx; GLP-1 class mainstream) plus peptide-community use.
 * Placeholder ids (testosterone-*, nandrolone-decanoate) apply when those rows exist in the catalog.
 */

/** @type {Record<string, number>} */
const EXPLICIT_RANK = {
  // 1–20 — revised headline order
  semaglutide: 1,
  tirzepatide: 2,
  "testosterone-cypionate": 3,
  tadalafil: 4,
  "bpc-157": 5,
  sildenafil: 6,
  retatrutide: 7,
  "tb-500": 8,
  "ghk-cu": 9,
  "nad-plus": 10,
  "testosterone-enanthate": 11,
  "testosterone-topical": 12,
  ipamorelin: 13,
  "cjc-1295-no-dac": 14,
  sermorelin: 15,
  "glp3-rc": 16,
  "mk-677": 17,
  "pt-141": 18,
  "thymosin-alpha-1": 19,
  epitalon: 20,

  // 21–37 — former tier-2 / adjacent (preserved relative density)
  liraglutide: 21,
  "n-acetyl-semax-amidate": 22,
  "n-acetyl-selank-amidate": 23,
  dihexa: 24,
  dsip: 25,
  "mots-c": 26,
  "ss-31": 27,
  "mt-2": 28,
  nmn: 29,
  cagrilintide: 30,
  "hgh-191aa": 31,
  "igf-1-lr3": 32,
  "peg-mgf": 33,
  hexarelin: 34,
  "ghrp-2": 35,
  "ghrp-6": 36,
  kpv: 37,

  "testosterone-propionate": 38,

  ll37: 39,
  "lipo-c": 40,
  "5-amino-1mq": 41,

  "testosterone-undecanoate": 42,

  tesamorelin: 43,
  "glp-1-cs": 44,
  oxytocin: 45,
  kisspeptin: 46,
  "nandrolone-decanoate": 47,
  bromantane: 48,
  bemethyl: 49,
  pinealon: 50,

  nr: 51,
  cortagen: 52,
  vilon: 53,
  humanin: 54,
  thymalin: 55,
  gonadorelin: 56,
  "cjc-ipa-combo": 57,
  glow: 58,
  klow: 59,

  // 60–71 — gap for future inserts; AOD stays offset from NR block
  aod9604: 65,

  "testosterone-suspension": 72,
};

const TIER4_MIN = 51;
const TIER4_MAX = 100;
const TIER5_MIN = 101;
const TIER5_MAX = 143;
const SINK = 999;

/** @param {readonly { id: string }[]} peptides */
export function attachPopularityRanks(peptides) {
  const used = new Set(Object.values(EXPLICIT_RANK));
  /** @type {number[]} */
  const tier4Pool = [];
  for (let r = TIER4_MIN; r <= TIER4_MAX; r++) {
    if (!used.has(r)) tier4Pool.push(r);
  }
  /** @type {number[]} */
  const tier5Pool = [];
  for (let r = TIER5_MIN; r <= TIER5_MAX; r++) {
    if (!used.has(r)) tier5Pool.push(r);
  }

  let i4 = 0;
  let i5 = 0;

  return peptides.map((p) => {
    const id = p.id;
    if (EXPLICIT_RANK[id] != null) {
      return { ...p, popularityRank: EXPLICIT_RANK[id] };
    }
    if (typeof p.popularityRank === "number" && Number.isFinite(p.popularityRank)) {
      return { ...p, popularityRank: p.popularityRank };
    }
    if (i4 < tier4Pool.length) {
      const rank = tier4Pool[i4++];
      used.add(rank);
      return { ...p, popularityRank: rank };
    }
    if (i5 < tier5Pool.length) {
      const rank = tier5Pool[i5++];
      used.add(rank);
      return { ...p, popularityRank: rank };
    }
    return { ...p, popularityRank: SINK };
  });
}
