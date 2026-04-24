import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { collectScrollRootElements } from "../lib/tutorialScrollRoots.js";
import { useTutorial } from "../context/TutorialContext.jsx";

const OVERLAY_DIM = "rgba(0,0,0,0.82)";
const OVERLAY_Z = 9999;
const DEFAULT_BOTTOM_NAV_RESERVE_PX = 64;
const CARD_WIDTH = 260;
const CARD_ESTIMATED_HEIGHT = 140;
const CARD_MARGIN = 12;
const MEASURE_RETRY_MS = 250;
/** Initial try plus delayed retries when the target is not in the DOM or has zero layout yet. */
const MEASURE_MAX_ATTEMPTS = 10;

function getBottomNavReservePx() {
  if (typeof document === "undefined") return DEFAULT_BOTTOM_NAV_RESERVE_PX;
  const nav = document.querySelector('nav[aria-label="Main"]');
  if (!(nav instanceof HTMLElement)) return DEFAULT_BOTTOM_NAV_RESERVE_PX;
  const height = nav.getBoundingClientRect().height;
  return Number.isFinite(height) && height > 0 ? Math.ceil(height) : DEFAULT_BOTTOM_NAV_RESERVE_PX;
}

function TutorialSpotlightInner() {
  const { currentStep, steps, stepIndex, goNext, clearFlow, forced, highlightTarget } = useTutorial();
  const [rect, setRect] = useState(/** @type {DOMRect | null} */ (null));
  const [bottomNavReserve, setBottomNavReserve] = useState(DEFAULT_BOTTOM_NAV_RESERVE_PX);
  /** When true, scroll/resize listeners can attach — stays in sync with a successful measure for this target. */
  const [targetLayoutReady, setTargetLayoutReady] = useState(false);
  const measureRetryTimeoutRef = useRef(/** @type {ReturnType<typeof setTimeout> | null} */ (null));

  const measure = useCallback(() => {
    if (measureRetryTimeoutRef.current != null) {
      clearTimeout(measureRetryTimeoutRef.current);
      measureRetryTimeoutRef.current = null;
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
          measureRetryTimeoutRef.current = setTimeout(() => {
            measureRetryTimeoutRef.current = null;
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
          measureRetryTimeoutRef.current = setTimeout(() => {
            measureRetryTimeoutRef.current = null;
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
      if (measureRetryTimeoutRef.current != null) {
        clearTimeout(measureRetryTimeoutRef.current);
        measureRetryTimeoutRef.current = null;
      }
    };
  }, [measure, stepIndex, highlightTarget, currentStep?.target]);

  useLayoutEffect(() => {
    if (typeof document === "undefined" || !highlightTarget || !targetLayoutReady) return;
    const el = document.querySelector(`[data-tutorial-target="${highlightTarget}"]`);
    if (!(el instanceof Element)) return;

    const roots = collectScrollRootElements(el);
    const onScrollOrResize = () => {
      measure();
    };

    window.addEventListener("resize", onScrollOrResize);
    window.addEventListener("scroll", onScrollOrResize, true);
    for (const r of roots) {
      r.addEventListener("scroll", onScrollOrResize, true);
    }

    let ro;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(() => measure());
      ro.observe(el);
    }

    return () => {
      window.removeEventListener("resize", onScrollOrResize);
      window.removeEventListener("scroll", onScrollOrResize, true);
      for (const r of roots) {
        r.removeEventListener("scroll", onScrollOrResize, true);
      }
      ro?.disconnect();
    };
  }, [highlightTarget, measure, targetLayoutReady]);

  if (!currentStep || !highlightTarget || !rect || typeof document === "undefined") return null;

  const pad = 6;
  const top = rect.top - pad;
  const left = rect.left - pad;
  const w = rect.width + pad * 2;
  const h = rect.height + pad * 2;

  const total = steps.length;
  const idx = stepIndex + 1;

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const overlayBottom = Math.max(0, vh - bottomNavReserve);
  const cardLeft = Math.max(CARD_MARGIN, Math.min(left, vw - CARD_WIDTH - CARD_MARGIN));
  const cardBelowTop = rect.bottom + CARD_MARGIN;
  const cardAboveTop = top - CARD_ESTIMATED_HEIGHT - CARD_MARGIN;
  const cardTop =
    cardBelowTop + CARD_ESTIMATED_HEIGHT <= overlayBottom - CARD_MARGIN
      ? cardBelowTop
      : Math.max(CARD_MARGIN, cardAboveTop);

  /** Dim layer excludes the bottom nav; cutout uses evenodd so outside the hole stays locked. */
  const L = left;
  const T = top;
  const R = left + w;
  const B = top + h;
  const clipPath = `polygon(evenodd, 0px 0px, ${vw}px 0px, ${vw}px ${overlayBottom}px, 0px ${overlayBottom}px, 0px 0px, ${L}px ${T}px, ${L}px ${B}px, ${R}px ${B}px, ${R}px ${T}px, ${L}px ${T}px)`;

  return createPortal(
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: bottomNavReserve,
        zIndex: OVERLAY_Z,
        pointerEvents: "all",
      }}
      aria-hidden={false}
    >
      {/* Dim + click capture stops above the fixed nav so active tabs remain visible. */}
      <div
        onClick={() => {
          if (!forced) clearFlow();
        }}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: OVERLAY_DIM,
          clipPath,
          WebkitClipPath: clipPath,
          pointerEvents: "all",
        }}
      />
      {/* Inside overlay, above dim: pulse ring only — no hit target */}
      <div
        style={{
          position: "fixed",
          top,
          left,
          width: w,
          height: h,
          borderRadius: 10,
          pointerEvents: "none",
          animation: "tutorialPulse 1.8s ease-in-out infinite",
        }}
      />
      <div
        style={{
          position: "fixed",
          top: cardTop,
          left: cardLeft,
          width: CARD_WIDTH,
          background: "var(--color-bg-elevated)",
          borderRadius: 12,
          padding: "12px 16px",
          boxShadow: "0 4px 24px rgba(0,0,0,0.18)",
          border: "1px solid var(--color-border-default)",
          zIndex: OVERLAY_Z + 1,
          pointerEvents: "all",
          fontFamily: "var(--font-sans)",
        }}
      >
        {(currentStep.tooltip || currentStep.text) ? (
          <p
            style={{
              fontSize: 15,
              color: "var(--color-text-primary)",
              margin: "0 0 10px 0",
              lineHeight: 1.5,
              fontFamily: "var(--font-sans)",
            }}
          >
            {currentStep.tooltip || currentStep.text}
          </p>
        ) : null}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
          <span className="mono" style={{ fontSize: 13, color: "var(--color-text-muted)" }}>
            Step {idx} of {total}
          </span>
          <button
            type="button"
            className="btn-teal"
            onClick={() => goNext()}
            style={{ fontSize: 13, minHeight: 40, padding: "8px 14px", marginLeft: "auto" }}
          >
            {stepIndex >= total - 1 ? "Done" : "Next →"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

/** Renders forced / spotlight tutorial overlay when a step is active (parent must gate on `currentStep` + `highlightTarget`). */
export default function TutorialSpotlight() {
  return <TutorialSpotlightInner />;
}
