/** localStorage key — must match AgeGate / App / main entry. */
export const PEPV_AGE_LS = "pepv_age_verified";

export function readAgeVerifiedFromStorage() {
  try {
    return typeof localStorage !== "undefined" && localStorage.getItem(PEPV_AGE_LS) === "true";
  } catch {
    return false;
  }
}

export function setAgeVerifiedInStorage() {
  try {
    localStorage.setItem(PEPV_AGE_LS, "true");
  } catch {
    /* ignore quota / private mode */
  }
}
