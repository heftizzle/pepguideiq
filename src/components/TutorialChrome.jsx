import { useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { NETWORK_TAB_EMOJI, TUTORIAL_TARGET, useTutorial } from "../context/TutorialContext.jsx";

const BOTTOM_NAV_OFFSET = "calc(64px + env(safe-area-inset-bottom, 0px))";
const HELP_MENU_MIN_W = 220;
const HELP_MENU_MAX_W = 280;
const hit44 = {
  minWidth: 44,
  minHeight: 44,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
};

const HELP_MENU_ROW = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  width: "100%",
  textAlign: "left",
  padding: "12px 12px",
  minHeight: 44,
  border: "none",
  borderRadius: 10,
  background: "transparent",
  color: "var(--color-text-primary)",
  cursor: "pointer",
  fontFamily: "'Outfit', sans-serif",
  fontSize: 14,
  textDecoration: "none",
  boxSizing: "border-box",
};

/** No in-app `/support` route yet — use mailto until one exists. */
const SUPPORT_HREF =
  "mailto:hello@pepguideiq.com?subject=" + encodeURIComponent("pepguideIQ Support");

export function TutorialHelpButton() {
  const { helpMenuOpen, setHelpMenuOpen, startFlow, HELP_SECTIONS: sections, currentStep, highlightTarget } = useTutorial();
  const buttonRef = useRef(null);
  const menuRef = useRef(null);
  const [menuRect, setMenuRect] = useState(/** @type {{ top: number; left: number; width: number } | null} */ (null));

  useLayoutEffect(() => {
    if (!helpMenuOpen) {
      setMenuRect(null);
      return;
    }
    const update = () => {
      const el = buttonRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const width = Math.min(HELP_MENU_MAX_W, Math.max(HELP_MENU_MIN_W, window.innerWidth - 16));
      let left = r.right - width;
      left = Math.max(8, Math.min(left, window.innerWidth - width - 8));
      const top = r.bottom + 6;
      setMenuRect({ top, left, width });
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [helpMenuOpen]);

  useLayoutEffect(() => {
    if (!helpMenuOpen) return;
    const onDoc = (e) => {
      const t = e.target;
      if (!(t instanceof Node)) return;
      if (buttonRef.current?.contains(t)) return;
      if (menuRef.current?.contains(t)) return;
      setHelpMenuOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") setHelpMenuOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [helpMenuOpen, setHelpMenuOpen]);

  if (currentStep && highlightTarget && highlightTarget !== TUTORIAL_TARGET.nav_help) return null;

  const menuPortal =
    helpMenuOpen &&
    menuRect &&
    typeof document !== "undefined" &&
    createPortal(
      <div
        ref={menuRef}
        role="menu"
        style={{
          position: "fixed",
          top: menuRect.top,
          left: menuRect.left,
          width: menuRect.width,
          zIndex: 50,
          padding: 8,
          borderRadius: 12,
          border: "1px solid var(--color-border-tab)",
          background: "var(--color-bg-sunken)",
          boxShadow: "0 12px 40px rgba(0,0,0,0.55)",
        }}
      >
        {sections.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            role="menuitem"
            onClick={() => startFlow(key)}
            style={{ ...HELP_MENU_ROW, display: "block" }}
          >
            {label}
          </button>
        ))}
        <div
          role="separator"
          style={{
            height: 1,
            margin: "8px 4px 6px",
            background: "rgba(30, 42, 56, 0.95)",
            border: "none",
            padding: 0,
          }}
        />
        <a
          href={SUPPORT_HREF}
          role="menuitem"
          onClick={() => setHelpMenuOpen(false)}
          style={HELP_MENU_ROW}
        >
          <span aria-hidden style={{ color: "var(--color-accent-subtle-50)", fontSize: 15, lineHeight: 1, flexShrink: 0 }}>
            ✉
          </span>
          <span>Support</span>
        </a>
      </div>,
      document.body
    );

  return (
    <>
      <div style={{ display: "inline-flex", flexShrink: 0 }}>
        <button
          ref={buttonRef}
          type="button"
          className="pepv-header-action-btn pepv-header-action-btn--icon"
          data-tutorial-target={TUTORIAL_TARGET.nav_help}
          data-active={helpMenuOpen ? "true" : undefined}
          aria-label="Help and guided tour"
          aria-expanded={helpMenuOpen}
          aria-haspopup="menu"
          onClick={() => setHelpMenuOpen((o) => !o)}
        >
          <span className="pepv-emoji" aria-hidden style={{ fontSize: 18, lineHeight: 1 }}>
            ❓
          </span>
        </button>
      </div>
      {menuPortal}
    </>
  );
}

export function TutorialBar() {
  const {
    stripVisible,
    showCollapsedTeaser,
    showFullPanel,
    dismissBar,
    expandFromCollapsed,
    flowKey,
    currentStep,
    highlightTarget,
    stepIndex,
    steps,
    goNext,
    goPrev,
    sessionCount,
    forced,
  } = useTutorial();

  if (currentStep && highlightTarget) return null;
  if (!stripVisible) return null;

  if (showCollapsedTeaser) {
    return (
      <div
        id="pepv-tutorial-strip"
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: BOTTOM_NAV_OFFSET,
          zIndex: 39,
          padding: "0 12px 6px",
          pointerEvents: "none",
        }}
        data-network-tab-emoji={NETWORK_TAB_EMOJI}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            pointerEvents: "auto",
          }}
        >
          <button
            type="button"
            onClick={() => expandFromCollapsed()}
            style={{
              width: "100%",
              minHeight: 44,
              padding: "10px 14px",
              borderRadius: 12,
              border: "1px solid var(--color-border-default)",
              background: "var(--color-accent-subtle-10)",
              color: "var(--color-accent)",
              cursor: "pointer",
              fontFamily: "'Outfit', sans-serif",
              fontSize: 14,
              fontWeight: 600,
              textAlign: "center",
            }}
          >
            Show me how →
          </button>
        </div>
      </div>
    );
  }

  if (!showFullPanel) return null;

  const total = steps.length;
  const label =
    flowKey && currentStep
      ? currentStep.text
      : sessionCount != null && sessionCount >= 1 && sessionCount <= 5
        ? "Use Next/Back to step through the walkthrough, or ? for more tours."
        : "Pick a topic from ? above to highlight controls in the app.";

  return (
    <div
      id="pepv-tutorial-strip"
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: BOTTOM_NAV_OFFSET,
        zIndex: 39,
        padding: "0 12px 6px",
        pointerEvents: "none",
      }}
      data-network-tab-emoji={NETWORK_TAB_EMOJI}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          pointerEvents: "auto",
          borderRadius: 14,
          border: "1px solid var(--color-accent-subtle-40)",
          background: "rgba(7, 9, 14, 0.96)",
          boxShadow: "0 -4px 24px rgba(0,0,0,0.35)",
          padding: "12px 12px 10px",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
          <div style={{ flex: "1 1 auto", minWidth: 0 }}>
            <div className="mono" style={{ fontSize: 11, color: "var(--color-text-secondary)", letterSpacing: "0.08em", marginBottom: 4 }}>
              PEPGUIDE IQ · {flowKey ? `${stepIndex + 1} / ${total}` : "Tips"}
            </div>
            {sessionCount === 1 ? (
              <div style={{ marginBottom: 10 }}>
                <div
                  style={{
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: 15,
                    fontWeight: 600,
                    color: "var(--color-text-primary)",
                    lineHeight: 1.35,
                    marginBottom: 6,
                  }}
                >
                  👋 Welcome to pepguideIQ — here's a quick tour
                </div>
                <div
                  style={{
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: 12,
                    color: "var(--color-text-secondary)",
                    lineHeight: 1.4,
                    marginBottom: 8,
                  }}
                >
                  {forced ? "Tap Next to follow along." : "Tap Next to follow along, or × to explore on your own"}
                </div>
                <div style={{ fontSize: 14, color: "var(--color-text-primary)", lineHeight: 1.45 }}>{label}</div>
              </div>
            ) : (
              <div style={{ fontSize: 14, color: "var(--color-text-primary)", lineHeight: 1.45 }}>{label}</div>
            )}
          </div>
          {!forced ? (
            <button
              type="button"
              aria-label="Dismiss tutorial bar"
              onClick={() => dismissBar()}
              style={{
                flexShrink: 0,
                ...hit44,
                padding: 0,
                borderRadius: 10,
                border: "1px solid var(--color-border-emphasis)",
                background: "rgba(255,255,255,0.04)",
                color: "var(--color-text-secondary)",
                cursor: "pointer",
                fontSize: 20,
                lineHeight: 1,
              }}
            >
              ×
            </button>
          ) : null}
        </div>
        {flowKey && total > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12, alignItems: "center" }}>
            {!forced ? (
              <button
                type="button"
                className="btn-teal"
                disabled={stepIndex <= 0}
                onClick={() => goPrev()}
                style={{ fontSize: 13, minHeight: 44, padding: "8px 16px", opacity: stepIndex <= 0 ? 0.4 : 1 }}
              >
                Back
              </button>
            ) : null}
            <button type="button" className="btn-teal" onClick={() => goNext()} style={{ fontSize: 13, minHeight: 44, padding: "8px 16px" }}>
              {stepIndex >= total - 1 ? "Done" : "Next"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
