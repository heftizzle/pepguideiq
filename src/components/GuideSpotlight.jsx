import { createPortal } from "react-dom";
import { useTutorial } from "../context/TutorialContext.jsx";
import {
  CARD_WIDTH,
  OVERLAY_Z,
  TAIL_EDGE_PAD,
  TAIL_HALF_WIDTH,
  TAIL_HEIGHT,
  buildClipPath,
  computeCardPosition,
} from "../lib/spotlightUtils.js";

const OVERLAY_DIM = "rgba(0,0,0,0.45)";

/**
 * @param {{ rect: DOMRect | null, bottomNavReserve: number }} props
 */
function GuideSpotlightInner({ rect, bottomNavReserve }) {
  const { currentStep, steps, stepIndex, goNext, goPrev, clearFlow, highlightTarget, forced } = useTutorial();

  if (forced || !currentStep || !highlightTarget || !rect || typeof document === "undefined") return null;

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const overlayBottom = Math.max(0, vh - bottomNavReserve);

  const { top, left, w, h, cardTop, cardBottom, cardLeft, placement, tailLeft } = computeCardPosition({
    rect,
    vw,
    vh,
    overlayBottom,
  });
  const clipPath = buildClipPath({ top, left, w, h, vw, overlayBottom });

  const total = steps.length;
  const idx = stepIndex + 1;
  const isFirst = stepIndex === 0;
  const isLast = stepIndex >= total - 1;

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
      <div
        onClick={() => clearFlow()}
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
          cursor: "pointer",
        }}
      />
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
          ...(placement === "below" ? { top: cardTop } : { bottom: cardBottom }),
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
        <div
          aria-hidden
          style={{
            position: "absolute",
            [placement === "below" ? "top" : "bottom"]: -TAIL_HEIGHT,
            left: tailLeft - TAIL_HALF_WIDTH,
            width: 0,
            height: 0,
            borderLeft: `${TAIL_HALF_WIDTH}px solid transparent`,
            borderRight: `${TAIL_HALF_WIDTH}px solid transparent`,
            [placement === "below" ? "borderBottom" : "borderTop"]: `${TAIL_HEIGHT}px solid var(--color-border-default)`,
            pointerEvents: "none",
          }}
        />
        <div
          aria-hidden
          style={{
            position: "absolute",
            [placement === "below" ? "top" : "bottom"]: -(TAIL_HEIGHT - 1),
            left: tailLeft - (TAIL_HALF_WIDTH - 1),
            width: 0,
            height: 0,
            borderLeft: `${TAIL_HALF_WIDTH - 1}px solid transparent`,
            borderRight: `${TAIL_HALF_WIDTH - 1}px solid transparent`,
            [placement === "below" ? "borderBottom" : "borderTop"]: `${TAIL_HEIGHT - 1}px solid var(--color-bg-elevated)`,
            pointerEvents: "none",
          }}
        />
        {(currentStep.tooltip || currentStep.text) && (
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
        )}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
          <span
            className="mono"
            style={{ fontSize: 13, color: "var(--color-text-muted)", whiteSpace: "nowrap" }}
          >
            Step {idx} of {total}
          </span>
          <div style={{ display: "flex", gap: 8, marginLeft: "auto" }}>
            {!isFirst && (
              <button
                type="button"
                className="btn-teal"
                onClick={() => goPrev()}
                style={{ fontSize: 13, minHeight: 40, padding: "8px 14px", opacity: 0.8, whiteSpace: "nowrap" }}
              >
                ← Back
              </button>
            )}
            <button
              type="button"
              className="btn-teal"
              onClick={() => goNext()}
              style={{ fontSize: 13, minHeight: 40, padding: "8px 14px", whiteSpace: "nowrap" }}
            >
              {isLast ? "Done" : "Next →"}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

/**
 * @param {{ rect: DOMRect | null, bottomNavReserve: number }} props
 */
export default function GuideSpotlight({ rect, bottomNavReserve }) {
  return <GuideSpotlightInner rect={rect} bottomNavReserve={bottomNavReserve} />;
}
