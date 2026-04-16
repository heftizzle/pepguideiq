import { countryNameByCode } from "../data/countries.js";

const SHIFT_SCHEDULE_LABELS = {
  days: "Days",
  swings: "Swings",
  mids: "Mids",
  nights: "Nights",
  rotating: "Rotating",
};

/**
 * @param {{ city?: unknown, state?: unknown, country?: unknown } | null | undefined} profile
 */
export function formatMemberProfileLocation(profile) {
  const city = typeof profile?.city === "string" ? profile.city.trim() : "";
  const state = typeof profile?.state === "string" ? profile.state.trim() : "";
  const countryCode = typeof profile?.country === "string" ? profile.country.trim().toUpperCase() : "";
  const countryName = countryNameByCode(countryCode);
  const parts = [];
  if (city) parts.push(city);
  if (state) parts.push(state);
  if (countryName) parts.push(countryName);
  return parts.join(", ");
}

/**
 * @param {string | null | undefined} shiftId
 */
export function formatShiftScheduleLabel(shiftId) {
  const id = typeof shiftId === "string" ? shiftId.trim().toLowerCase() : "";
  return SHIFT_SCHEDULE_LABELS[id] ?? "";
}

/**
 * @param {string | null | undefined} wakeTime
 */
export function formatWakeTimeLabel(wakeTime) {
  const raw = typeof wakeTime === "string" ? wakeTime.trim() : "";
  if (!raw) return "";
  const m = raw.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (!m) return raw;
  const h = Number(m[1]);
  const min = m[2];
  if (!Number.isFinite(h) || h < 0 || h > 23) return raw;
  const suffix = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 || 12;
  return `${hour12}:${min} ${suffix}`;
}
