import { useCallback, useId, useState } from "react";
import { Logo } from "./Logo.jsx";
import { setAgeVerifiedInStorage } from "../lib/ageVerification.js";

const linkStyle = {
  color: "var(--color-accent)",
  textDecoration: "underline",
  textUnderlineOffset: 3,
};

/**
 * Full-screen age + research disclaimer. Persists via `pepv_age_verified_v2` when "Remember my choice" is checked.
 */
export function AgeGate({ onConfirm, onExit }) {
  const [ageChecked, setAgeChecked] = useState(false);
  const [researchChecked, setResearchChecked] = useState(false);
  const [rememberChoice, setRememberChoice] = useState(true);
  const baseId = useId();
  const idAge = `${baseId}-age`;
  const idResearch = `${baseId}-research`;
  const idRemember = `${baseId}-remember`;

  const canEnter = ageChecked && researchChecked;

  const onAgree = useCallback(() => {
    if (!canEnter) return;
    setAgeVerifiedInStorage({ remember: rememberChoice });
    onConfirm();
  }, [canEnter, rememberChoice, onConfirm]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="pepv-age-gate-title"
      aria-describedby="pepv-age-gate-desc"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 2147483000,
        background: "var(--color-bg-page)",
        "--color-text-primary": "#dde4ef",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 20px 20px",
        boxSizing: "border-box",
        minHeight: "100dvh",
        overflow: "auto",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 440,
          display: "flex",
          flexDirection: "column",
          alignItems: "stretch",
          textAlign: "left",
          borderRadius: 14,
          border: "1px solid var(--color-border-tab)",
          background: "var(--color-bg-sunken)",
          boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "14px 20px 12px",
            borderBottom: "1px solid var(--color-accent-subtle-50)",
            background: "linear-gradient(180deg, var(--color-accent-nav-fill) 0%, var(--color-accent-subtle-0e) 100%)",
            textAlign: "center",
          }}
        >
          <div style={{ marginBottom: 12, display: "flex", justifyContent: "center" }}>
            <Logo size={22} style={{ flexDirection: "column", gap: 14 }} />
          </div>
          <h1
            id="pepv-age-gate-title"
            className="brand"
            style={{
              fontSize: "clamp(16px, 4vw, 19px)",
              fontWeight: 700,
              color: "var(--color-accent)",
              lineHeight: 1.35,
              margin: 0,
              letterSpacing: "0.04em",
            }}
          >
            Age & research acknowledgment
          </h1>
        </div>

        <div style={{ padding: "20px 20px 22px" }}>
          <p
            id="pepv-age-gate-desc"
            className="mono"
            style={{
              fontSize: "clamp(12px, 3.2vw, 13px)",
              color: "var(--color-text-secondary)",
              lineHeight: 1.55,
              marginBottom: 20,
              textAlign: "center",
            }}
          >
            PepGuideIQ is for adults researching compounds. Please confirm the following to continue.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 18 }}>
            <label
              htmlFor={idAge}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 12,
                cursor: "pointer",
                fontSize: 14,
                color: "var(--color-text-primary)",
                lineHeight: 1.45,
                fontFamily: "'Outfit', sans-serif",
              }}
            >
              <input
                id={idAge}
                type="checkbox"
                checked={ageChecked}
                onChange={(e) => setAgeChecked(e.target.checked)}
                style={{ width: 18, height: 18, marginTop: 2, flexShrink: 0, accentColor: "var(--color-accent)" }}
              />
              <span>I confirm I am 18 years of age or older.</span>
            </label>

            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 12,
                fontSize: 14,
                color: "var(--color-text-primary)",
                lineHeight: 1.45,
                fontFamily: "'Outfit', sans-serif",
              }}
            >
              <input
                id={idResearch}
                type="checkbox"
                checked={researchChecked}
                onChange={(e) => setResearchChecked(e.target.checked)}
                style={{ width: 18, height: 18, marginTop: 2, flexShrink: 0, accentColor: "var(--color-accent)" }}
              />
              <div>
                <label htmlFor={idResearch} style={{ cursor: "pointer" }}>
                  I acknowledge that all compounds and information on this platform are intended for research purposes
                  only and are not intended for human use, diagnosis, treatment, cure, or prevention of any condition. I
                  agree to the{" "}
                </label>
                <a href="/legal#terms" target="_blank" rel="noopener noreferrer" style={linkStyle}>
                  Terms of Service
                </a>
                <label htmlFor={idResearch} style={{ cursor: "pointer" }}>
                  ,{" "}
                </label>
                <a href="/legal#privacy" target="_blank" rel="noopener noreferrer" style={linkStyle}>
                  Privacy Policy
                </a>
                <label htmlFor={idResearch} style={{ cursor: "pointer" }}>
                  , and the{" "}
                </label>
                <a href="/legal#waiver" target="_blank" rel="noopener noreferrer" style={linkStyle}>
                  Research Waiver
                </a>
                <span>.</span>
              </div>
            </div>
          </div>

          <label
            htmlFor={idRemember}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 10,
              cursor: "pointer",
              fontSize: 13,
              color: "var(--color-text-secondary)",
              lineHeight: 1.4,
              marginBottom: 20,
              fontFamily: "'Outfit', sans-serif",
            }}
          >
            <input
              id={idRemember}
              type="checkbox"
              checked={rememberChoice}
              onChange={(e) => setRememberChoice(e.target.checked)}
              style={{ width: 16, height: 16, marginTop: 2, flexShrink: 0, accentColor: "var(--color-accent)" }}
            />
            <span>Remember my choice on this device</span>
          </label>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <button
              type="button"
              className="btn-teal"
              disabled={!canEnter}
              aria-disabled={!canEnter}
              onClick={onAgree}
              style={{
                width: "100%",
                background: canEnter ? "var(--color-accent)" : "#1e3d34",
                border: `1px solid ${canEnter ? "var(--color-accent)" : "var(--color-border-emphasis)"}`,
                color: canEnter ? "var(--color-bg-page)" : "#4a6670",
                fontWeight: 700,
                letterSpacing: "0.06em",
                cursor: canEnter ? "pointer" : "not-allowed",
                opacity: canEnter ? 1 : 0.75,
              }}
            >
              I Agree & Enter
            </button>
            <button
              type="button"
              onClick={onExit}
              className="mono"
              style={{
                width: "100%",
                minHeight: 44,
                padding: "10px 20px",
                borderRadius: 7,
                cursor: "pointer",
                fontFamily: "'Outfit', sans-serif",
                fontSize: 13,
                fontWeight: 500,
                letterSpacing: "0.05em",
                background: "transparent",
                border: "1px solid var(--color-upgrade-muted-border)",
                color: "var(--color-text-secondary)",
                transition: "border-color 0.2s, color 0.2s, background 0.2s",
              }}
            >
              I am under 18 — Exit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
