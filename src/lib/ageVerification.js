/** Current acknowledgment payload version — bump when disclaimer copy changes to require re-acknowledgment. */
export const PEPV_AGE_ACK_VERSION = 1;

/** localStorage key for v2 acknowledgment `{ t: number, v: number }` — must match AgeGate / App / main entry. */
export const PEPV_AGE_VERIFIED_V2 = "pepv_age_verified_v2";

/** @deprecated Legacy boolean; removed when user acknowledges under v2. */
export const PEPV_AGE_LS = "pepv_age_verified";

/**
 * @returns {boolean}
 */
export function readAgeVerifiedFromStorage() {
  try {
    if (typeof localStorage === "undefined") return false;
    const raw = localStorage.getItem(PEPV_AGE_VERIFIED_V2);
    if (raw) {
      const j = JSON.parse(raw);
      const t =
        typeof j?.t === "number"
          ? j.t
          : typeof j?.acknowledgedAt === "number"
            ? j.acknowledgedAt
            : NaN;
      if (!Number.isFinite(t) || t <= 0) return false;
      const v = typeof j?.v === "number" ? j.v : 1;
      if (v < PEPV_AGE_ACK_VERSION) return false;
      return true;
    }
    return localStorage.getItem(PEPV_AGE_LS) === "true";
  } catch {
    return false;
  }
}

/**
 * @param {{ remember?: boolean }} [options] — `remember: false` skips persistence (this session only; parent still dismisses overlay).
 */
export function setAgeVerifiedInStorage(options = {}) {
  const remember = options.remember !== false;
  try {
    if (typeof localStorage === "undefined") return;
    if (remember) {
      localStorage.setItem(
        PEPV_AGE_VERIFIED_V2,
        JSON.stringify({ t: Date.now(), v: PEPV_AGE_ACK_VERSION })
      );
      localStorage.removeItem(PEPV_AGE_LS);
    } else {
      localStorage.removeItem(PEPV_AGE_VERIFIED_V2);
      localStorage.removeItem(PEPV_AGE_LS);
    }
  } catch {
    /* ignore quota / private mode */
  }
}
