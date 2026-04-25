/**
 * Shared constants and pure positioning helpers.
 * Imported by both TutorialSpotlight (forced/core) and GuideSpotlight (guide flows).
 */

export const OVERLAY_Z = 9999;
export const DEFAULT_BOTTOM_NAV_RESERVE_PX = 64;
export const CARD_WIDTH = 320;
export const CARD_ESTIMATED_HEIGHT = 140;
export const CARD_MARGIN = 12;
export const CUTOUT_PAD = 6;
export const MEASURE_RETRY_MS = 250;
export const MEASURE_MAX_ATTEMPTS = 10;

export function getBottomNavReservePx() {
  if (typeof document === "undefined") return DEFAULT_BOTTOM_NAV_RESERVE_PX;
  const nav = document.querySelector('nav[aria-label="Main"]');
  if (!(nav instanceof HTMLElement)) return DEFAULT_BOTTOM_NAV_RESERVE_PX;
  const height = nav.getBoundingClientRect().height;
  return Number.isFinite(height) && height > 0 ? Math.ceil(height) : DEFAULT_BOTTOM_NAV_RESERVE_PX;
}

/**
 * Simple above/below rule — restored from 46de739 baseline.
 * No quadrant branching. Card goes below if it fits, above otherwise.
 * cardLeft is horizontal-clamp only.
 *
 * @param {{ rect: DOMRect, vw: number, overlayBottom: number }}
 * @returns {{ top: number, left: number, w: number, h: number, cardTop: number, cardLeft: number }}
 */
export function computeCardPosition({ rect, vw, overlayBottom }) {
  const top = rect.top - CUTOUT_PAD;
  const left = rect.left - CUTOUT_PAD;
  const w = rect.width + CUTOUT_PAD * 2;
  const h = rect.height + CUTOUT_PAD * 2;

  const cardBelowTop = rect.bottom + CARD_MARGIN;
  const cardAboveTop = top - CARD_ESTIMATED_HEIGHT - CARD_MARGIN;

  const fitsBelow = cardBelowTop + CARD_ESTIMATED_HEIGHT <= overlayBottom - CARD_MARGIN;
  const cardTop = fitsBelow ? cardBelowTop : Math.max(CARD_MARGIN, cardAboveTop);
  const cardLeft = Math.max(CARD_MARGIN, Math.min(left, vw - CARD_WIDTH - CARD_MARGIN));

  return { top, left, w, h, cardTop, cardLeft };
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
