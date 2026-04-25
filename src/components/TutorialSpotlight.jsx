import { createPortal } from "react-dom";
import { useTutorial } from "../context/TutorialContext.jsx";
import { CARD_WIDTH, OVERLAY_Z, buildClipPath, computeCardPosition } from "../lib/spotlightUtils.js";

const OVERLAY_DIM = "rgba(0,0,0,0.82)";

/**
 * @param {{ rect: DOMRect | null, bottomNavReserve: number }} props
 */
function TutorialSpotlightInner({ rect, bottomNavReserve }) {
  const { currentStep, steps, stepIndex, goNext, highlightTarget, forced } = useTutorial();

  if (!forced || !currentStep || !highlightTarget || !rect || typeof document === "undefined") return null;

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const overlayBottom = Math.max(0, vh - bottomNavReserve);

  const { top, left, w, h, cardTop, cardLeft } = computeCardPosition({ rect, vw, overlayBottom });
  const clipPath = buildClipPath({ top, left, w, h, vw, overlayBottom });

  const total = steps.length;
  const idx = stepIndex + 1;

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
          <button
            type="button"
            className="btn-teal"
            onClick={() => goNext()}
            style={{
              fontSize: 13,
              minHeight: 40,
              padding: "8px 14px",
              marginLeft: "auto",
              whiteSpace: "nowrap",
            }}
          >
            {stepIndex >= total - 1 ? "Done" : "Next →"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

/**
 * @param {{ rect: DOMRect | null, bottomNavReserve: number }} props
 */
export default function TutorialSpotlight({ rect, bottomNavReserve }) {
  return <TutorialSpotlightInner rect={rect} bottomNavReserve={bottomNavReserve} />;
}
