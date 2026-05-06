/**
 * Shared constants and pure positioning helpers.
 * Imported by both TutorialSpotlight (forced/core) and GuideSpotlight (guide flows).
 */

export const OVERLAY_Z = 9999;
export const DEFAULT_BOTTOM_NAV_RESERVE_PX = 64;
export const CARD_WIDTH = 320;
export const CARD_ESTIMATED_HEIGHT = 220;
export const CARD_MARGIN = 12;
export const TAIL_HEIGHT = 9;
export const TAIL_HALF_WIDTH = 9;
/** Keep tail this far from the card's left/right corners so it never overlaps border-radius (12px). */
export const TAIL_EDGE_PAD = 18;
export const CUTOUT_PAD = 6;
export const MEASURE_RETRY_MS = 250;
export const MEASURE_MAX_ATTEMPTS = 10;

/**
 * Tutorial targets that live in tab subtrees React only mounts on demand
 * (Settings/Profile, Protocol). They need a longer retry window because the
 * tab swap, deep-link state update, and first paint can take well over 2.5s
 * on a cold render. Add a target here only when its parent component is
 * conditionally rendered, not when it merely scrolls into view.
 */
export const SLOW_MOUNT_TARGETS = new Set([
  "settings_wake",
  "protocol_log_dose",
]);

/** ~7.5s vs default ~2.5s. Pair with SLOW_MOUNT_RETRY_MS below. */
export const SLOW_MOUNT_MAX_ATTEMPTS = 30;
export const SLOW_MOUNT_RETRY_MS = 250;
/** Wait this long before the first attempt so React can flush the lazy mount. */
export const SLOW_MOUNT_INITIAL_DELAY_MS = 100;

export function getBottomNavReservePx() {
  if (typeof document === "undefined") return DEFAULT_BOTTOM_NAV_RESERVE_PX;
  const nav = document.querySelector('nav[aria-label="Main"]');
  if (!(nav instanceof HTMLElement)) return DEFAULT_BOTTOM_NAV_RESERVE_PX;
  const height = nav.getBoundingClientRect().height;
  return Number.isFinite(height) && height > 0 ? Math.ceil(height) : DEFAULT_BOTTOM_NAV_RESERVE_PX;
}

/**
 * Card below target if estimated height fits above bottom nav; else above target.
 * "Above" uses CSS `bottom` so the card grows upward without overlapping the target.
 *
 * @param {{ rect: DOMRect, vw: number, vh: number, overlayBottom: number }}
 * @returns {{ top: number, left: number, w: number, h: number, cardTop: number | null, cardBottom: number | null, cardLeft: number, placement: "below" | "above", tailLeft: number }}
 */
export function computeCardPosition({ rect, vw, vh, overlayBottom }) {
  // Clamp to visible viewport - handles targets inside horizontal scroll containers
  const clampedLeft = Math.max(0, Math.min(rect.left, vw));
  const clampedRight = Math.max(0, Math.min(rect.right, vw));
  const clampedWidth = Math.max(1, clampedRight - clampedLeft);

  const top = rect.top - CUTOUT_PAD;
  const left = clampedLeft - CUTOUT_PAD;
  const w = clampedWidth + CUTOUT_PAD * 2;
  const h = rect.height + CUTOUT_PAD * 2;

  const cardBelowTop = rect.bottom + CARD_MARGIN;
  const fitsBelow = cardBelowTop + CARD_ESTIMATED_HEIGHT <= overlayBottom - CARD_MARGIN;
  const placement = fitsBelow ? "below" : "above";

  const cardTop = fitsBelow ? cardBelowTop : null;
  const cardBottom = fitsBelow ? null : Math.max(CARD_MARGIN, vh - rect.top + CARD_MARGIN);

  const targetCenterX = clampedLeft + clampedWidth / 2; // use clamped center
  const idealLeft = targetCenterX - CARD_WIDTH / 2;
  const cardLeft = Math.max(CARD_MARGIN, Math.min(idealLeft, vw - CARD_WIDTH - CARD_MARGIN));

  const rawTailLeft = targetCenterX - cardLeft;
  const tailLeft = Math.max(TAIL_EDGE_PAD, Math.min(rawTailLeft, CARD_WIDTH - TAIL_EDGE_PAD));

  return { top, left, w, h, cardTop, cardBottom, cardLeft, placement, tailLeft };
}

/**
 * Evenodd clip-path — dims everything outside the cutout hole.
 *
 * @param {{ top: number, left: number, w: number, h: number, vw: number, overlayBottom: number }}
 * @returns {string}
 */
export function buildClipPath({ top, left, w, h, vw, overlayBottom }) {
  const L = left;
  const T = top;
  const R = left + w;
  const B = top + h;
  return `polygon(evenodd, 0px 0px, ${vw}px 0px, ${vw}px ${overlayBottom}px, 0px ${overlayBottom}px, 0px 0px, ${L}px ${T}px, ${L}px ${B}px, ${R}px ${B}px, ${R}px ${T}px, ${L}px ${T}px)`;
}
