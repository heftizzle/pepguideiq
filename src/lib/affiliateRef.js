import { formatPrice, getTier } from "./tiers.js";

const STORAGE_KEY = "pepguide_ref";

/** Recognized affiliate refs (Rewardful / Stripe). Keys are lowercase for case-insensitive match. */
const AFFILIATE_REF_BY_LOWER = Object.freeze({
  primo15: "Primo15",
  pete15: "Pete15",
  tsource15: "Tsource15",
  edon15: "EDON15",
  ironresolve15: "ironresolve15",
  elite15: "Elite15",
  otmen15: "OTMen15",
  palmer15: "Palmer15",
  ryba15: "Ryba15",
  fire15: "Fire15",
  lake15: "Lake15",
  vitality15: "Vitality15",
  chad15: "Chad15",
});

/** @param {unknown} raw */
export function normalizeAffiliateRef(raw) {
  if (raw == null) return null;
  const s = String(raw).trim();
  if (!s) return null;
  const lower = s.toLowerCase();
  return AFFILIATE_REF_BY_LOWER[lower] ?? null;
}

export function getRewardfulReferral() {
  try {
    if (window.Rewardful && window.Rewardful.referral) {
      return window.Rewardful.referral;
    }
  } catch (_) {}
  return null;
}

/** Read `?ref=` from the current URL and persist recognized codes to localStorage. */
export function captureAffiliateRefFromLocation() {
  if (typeof window === "undefined") return;
  try {
    const params = new URLSearchParams(window.location.search);
    const ref = normalizeAffiliateRef(params.get("ref"));
    if (ref) window.localStorage.setItem(STORAGE_KEY, ref);
  } catch {
    /* ignore quota / private mode */
  }
}

/** @returns {string | null} */
export function getStoredAffiliateRef() {
  if (typeof window === "undefined") return null;
  try {
    return normalizeAffiliateRef(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    return null;
  }
}

export function clearStoredAffiliateRef() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * @param {{ plan?: string | null }} [opts]
 * @returns {string} Path + query for signup (e.g. `/signup?plan=pro&ref=EDON15`).
 */
export function buildSignupHref(opts = {}) {
  const params = new URLSearchParams();
  const plan = typeof opts.plan === "string" ? opts.plan.trim().toLowerCase() : "";
  if (plan === "pro" || plan === "elite" || plan === "goat") params.set("plan", plan);
  const ref = getStoredAffiliateRef();
  if (ref) params.set("ref", ref);
  const q = params.toString();
  return q ? `/signup?${q}` : "/signup";
}

/**
 * @param {string} planId
 * @param {boolean} hasDiscount
 * @returns {{ main: string; strike: string | null; suffix: string }}
 */
export function getAffiliatePriceDisplay(planId, hasDiscount) {
  const t = getTier(planId);
  if (t.price === 0) {
    return { main: formatPrice(planId), strike: null, suffix: "" };
  }
  if (!hasDiscount) {
    return { main: formatPrice(planId), strike: null, suffix: "" };
  }
  const orig = t.price;
  const discounted = Math.round(orig * 0.85 * 100) / 100;
  return {
    main: `$${discounted.toFixed(2)}`,
    strike: formatPrice(planId),
    suffix: "/mo",
  };
}
