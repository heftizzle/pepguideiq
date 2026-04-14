import { Logo } from "./Logo.jsx";

/**
 * Full-screen 18+ verification overlay. Dismiss permanently per browser via `pepv_age_verified` in localStorage.
 */
export function AgeGate({ onConfirm, onExit }) {
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
        background: "#07090e",
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
          maxWidth: 420,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
        }}
      >
        <div style={{ marginBottom: 28 }}>
          <Logo size={22} style={{ flexDirection: "column", gap: 14 }} />
        </div>

        <h1
          id="pepv-age-gate-title"
          className="brand"
          style={{
            fontSize: "clamp(17px, 4.2vw, 20px)",
            fontWeight: 700,
            color: "#dde4ef",
            lineHeight: 1.35,
            marginBottom: 14,
            letterSpacing: "0.02em",
          }}
        >
          Age verification required
        </h1>

        <p
          id="pepv-age-gate-desc"
          className="mono"
          style={{
            fontSize: "clamp(13px, 3.5vw, 14px)",
            color: "#8fa5bf",
            lineHeight: 1.55,
            marginBottom: 28,
            maxWidth: 380,
          }}
        >
          This platform contains information about research compounds. You must be 18 or older to continue.
        </p>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
            width: "100%",
            maxWidth: 320,
          }}
        >
          <button
            type="button"
            className="btn-teal"
            onClick={onConfirm}
            style={{
              width: "100%",
              background: "#00d4aa",
              border: "1px solid #00d4aa",
              color: "#07090e",
              fontWeight: 700,
              letterSpacing: "0.06em",
            }}
          >
            I am 18 or older — Enter
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
              border: "1px solid #2a4055",
              color: "#8fa5bf",
              transition: "border-color 0.2s, color 0.2s, background 0.2s",
            }}
          >
            I am under 18 — Exit
          </button>
        </div>

        <p
          className="mono"
          style={{
            marginTop: "auto",
            paddingTop: 32,
            fontSize: 11,
            color: "#5c6d82",
            lineHeight: 1.5,
            maxWidth: 360,
          }}
        >
          By entering you confirm you are 18+ and agree to our{" "}
          <a
            href="/legal"
            style={{
              color: "#00d4aa",
              textDecoration: "underline",
              textUnderlineOffset: 3,
            }}
          >
            Terms of Service
          </a>
        </p>
      </div>
    </div>
  );
}
