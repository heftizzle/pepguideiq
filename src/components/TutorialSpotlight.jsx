import { useCallback, useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";
import { collectScrollRootElements } from "../lib/tutorialScrollRoots.js";
import { useTutorial } from "../context/TutorialContext.jsx";

function TutorialSpotlightInner() {
  const { currentStep, steps, stepIndex, goNext, highlightTarget } = useTutorial();
  const [rect, setRect] = useState(/** @type {DOMRect | null} */ (null));

  const measure = useCallback(() => {
    if (typeof document === "undefined" || !highlightTarget) {
      setRect(null);
      return;
    }
    const el = document.querySelector(`[data-tutorial-target="${highlightTarget}"]`);
    if (!(el instanceof Element)) {
      setRect(null);
      return;
    }
    setRect(el.getBoundingClientRect());
  }, [highlightTarget]);

  useLayoutEffect(() => {
    measure();
  }, [measure, stepIndex, highlightTarget, currentStep?.target]);

  useLayoutEffect(() => {
    if (typeof document === "undefined" || !highlightTarget) return;
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
  }, [highlightTarget, measure]);

  if (!currentStep || !highlightTarget || !rect || typeof document === "undefined") return null;

  const tooltip = typeof currentStep.tooltip === "string" ? currentStep.tooltip.trim() : "";
  const pad = 6;
  const top = rect.top - pad;
  const left = rect.left - pad;
  const w = rect.width + pad * 2;
  const h = rect.height + pad * 2;
  const tooltipAbove = rect.top > 200;
  const cardWidth = 260;
  const cardLeft = Math.max(12, Math.min(left, window.innerWidth - cardWidth - 12));
  const cardTop = tooltipAbove ? top - 110 : rect.bottom + 12;

  const total = steps.length;
  const idx = stepIndex + 1;

  return createPortal(
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        pointerEvents: "all",
      }}
      aria-hidden={false}
    >
      <div
        style={{
          position: "fixed",
          top,
          left,
          width: w,
          height: h,
          borderRadius: 10,
          boxShadow: "0 0 0 9999px rgba(0,0,0,0.65)",
          pointerEvents: "none",
          animation: "tutorialPulse 1.8s ease-in-out infinite",
        }}
      />
      <div
        style={{
          position: "fixed",
          top: cardTop,
          left: cardLeft,
          width: cardWidth,
          background: "var(--color-bg-elevated)",
          borderRadius: 12,
          padding: "12px 16px",
          boxShadow: "0 4px 24px rgba(0,0,0,0.18)",
          border: "1px solid var(--color-border-default)",
          zIndex: 10000,
          pointerEvents: "all",
        }}
      >
        {tooltip ? (
          <p
            style={{
              fontSize: 13,
              color: "var(--color-text-primary)",
              margin: "0 0 10px",
              lineHeight: 1.5,
              fontFamily: "'Outfit', sans-serif",
            }}
          >
            {tooltip}
          </p>
        ) : null}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <span className="mono" style={{ fontSize: 11, color: "var(--color-text-muted)" }}>
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
