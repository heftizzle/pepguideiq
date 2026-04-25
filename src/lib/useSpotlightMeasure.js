import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { collectScrollRootElements } from "./tutorialScrollRoots.js";
import {
  DEFAULT_BOTTOM_NAV_RESERVE_PX,
  MEASURE_MAX_ATTEMPTS,
  MEASURE_RETRY_MS,
  getBottomNavReservePx,
} from "./spotlightUtils.js";

/**
 * Finds the target element, retries until it has layout, then tracks it through
 * scroll and resize. Re-measures when the step changes (same target, new layout).
 *
 * @param {string | null} highlightTarget
 * @param {number} stepIndex
 * @returns {{ rect: DOMRect | null, bottomNavReserve: number }}
 */
export function useSpotlightMeasure(highlightTarget, stepIndex) {
  const [rect, setRect] = useState(/** @type {DOMRect | null} */ (null));
  const [bottomNavReserve, setBottomNavReserve] = useState(DEFAULT_BOTTOM_NAV_RESERVE_PX);
  const [targetLayoutReady, setTargetLayoutReady] = useState(false);
  const retryRef = useRef(/** @type {ReturnType<typeof setTimeout> | null} */ (null));

  const measure = useCallback(() => {
    if (retryRef.current != null) {
      clearTimeout(retryRef.current);
      retryRef.current = null;
    }
    if (typeof document === "undefined" || !highlightTarget) {
      setRect(null);
      setTargetLayoutReady(false);
      return;
    }
    const tryMeasure = (attempt) => {
      const el = document.querySelector(`[data-tutorial-target="${highlightTarget}"]`);
      if (!(el instanceof Element)) {
        if (attempt + 1 < MEASURE_MAX_ATTEMPTS) {
          retryRef.current = setTimeout(() => {
            retryRef.current = null;
            tryMeasure(attempt + 1);
          }, MEASURE_RETRY_MS);
        } else {
          setRect(null);
          setTargetLayoutReady(false);
        }
        return;
      }
      const r = el.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) {
        if (attempt + 1 < MEASURE_MAX_ATTEMPTS) {
          retryRef.current = setTimeout(() => {
            retryRef.current = null;
            tryMeasure(attempt + 1);
          }, MEASURE_RETRY_MS);
        } else {
          setRect(null);
          setTargetLayoutReady(false);
        }
        return;
      }
      setRect(r);
      setBottomNavReserve(getBottomNavReservePx());
      setTargetLayoutReady(true);
    };
    tryMeasure(0);
  }, [highlightTarget]);

  useLayoutEffect(() => {
    setTargetLayoutReady(false);
    measure();
    return () => {
      if (retryRef.current != null) {
        clearTimeout(retryRef.current);
        retryRef.current = null;
      }
    };
  }, [highlightTarget, stepIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  useLayoutEffect(() => {
    if (typeof document === "undefined" || !highlightTarget || !targetLayoutReady) return;
    const el = document.querySelector(`[data-tutorial-target="${highlightTarget}"]`);
    if (!(el instanceof Element)) return;

    const roots = collectScrollRootElements(el);
    const onScrollOrResize = () => measure();

    window.addEventListener("resize", onScrollOrResize);
    window.addEventListener("scroll", onScrollOrResize, true);
    for (const r of roots) r.addEventListener("scroll", onScrollOrResize, true);

    let ro;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(() => measure());
      ro.observe(el);
    }

    return () => {
      window.removeEventListener("resize", onScrollOrResize);
      window.removeEventListener("scroll", onScrollOrResize, true);
      for (const r of roots) r.removeEventListener("scroll", onScrollOrResize, true);
      ro?.disconnect();
    };
  }, [highlightTarget, measure, targetLayoutReady]);

  return { rect, bottomNavReserve };
}
