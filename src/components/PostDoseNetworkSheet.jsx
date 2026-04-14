import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

/**
 * Light bottom action sheet after a dose log: post to network or keep private.
 * @param {{
 *   open: boolean,
 *   compoundName: string,
 *   previewLine: string,
 *   busy: boolean,
 *   postError: string | null,
 *   onPost: () => void | Promise<void>,
 *   onKeepPrivate: () => void,
 * }} props
 */
export function PostDoseNetworkSheet({ open, compoundName, previewLine, busy, postError, onPost, onKeepPrivate }) {
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    if (!open) {
      setEntered(false);
      return;
    }
    const id = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(id);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onKeepPrivate();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onKeepPrivate]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      role="presentation"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 205,
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        pointerEvents: "auto",
      }}
    >
      <button
        type="button"
        aria-label="Dismiss"
        onClick={() => onKeepPrivate()}
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 0,
          border: "none",
          margin: 0,
          padding: 0,
          cursor: "pointer",
          background: entered ? "rgba(0,0,0,0.42)" : "rgba(0,0,0,0)",
          transition: "background 0.22s ease",
        }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="pepv-post-dose-title"
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "relative",
          zIndex: 1,
          margin: "0 auto",
          width: "100%",
          maxWidth: 480,
          padding: "0 12px calc(12px + env(safe-area-inset-bottom, 0px))",
          transform: entered ? "translateY(0)" : "translateY(110%)",
          transition: "transform 0.28s cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
        <div
          style={{
            borderRadius: "16px 16px 12px 12px",
            border: "1px solid rgba(0, 212, 170, 0.28)",
            background: "rgba(11, 15, 23, 0.98)",
            boxShadow: "0 -12px 40px rgba(0,0,0,0.55)",
            padding: "16px 16px 14px",
          }}
        >
          <div
            id="pepv-post-dose-title"
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: 17,
              fontWeight: 600,
              color: "#dde4ef",
              marginBottom: 8,
              textAlign: "center",
            }}
          >
            Post to Network?
          </div>
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 12,
              color: "#8fa5bf",
              lineHeight: 1.45,
              textAlign: "center",
              marginBottom: 6,
              letterSpacing: "0.04em",
            }}
          >
            {compoundName}
          </div>
          <div
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: 13,
              color: "#00d4aa",
              lineHeight: 1.45,
              textAlign: "center",
              marginBottom: 16,
              padding: "10px 12px",
              borderRadius: 10,
              background: "rgba(0, 212, 170, 0.08)",
              border: "1px solid rgba(0, 212, 170, 0.2)",
            }}
          >
            {previewLine}
          </div>
          {postError ? (
            <div
              style={{
                fontSize: 12,
                color: "#f87171",
                textAlign: "center",
                marginBottom: 12,
              }}
            >
              {postError}
            </div>
          ) : null}
          <div style={{ display: "flex", gap: 10 }}>
            <button
              type="button"
              className="form-input"
              disabled={busy}
              onClick={() => onKeepPrivate()}
              style={{
                flex: 1,
                minHeight: 48,
                fontSize: 14,
                fontFamily: "'Outfit', sans-serif",
                fontWeight: 500,
                cursor: busy ? "default" : "pointer",
                border: "1px solid #243040",
                background: "rgba(255,255,255,0.04)",
                color: "#8fa5bf",
                borderRadius: 10,
              }}
            >
              Keep Private
            </button>
            <button
              type="button"
              className="btn-teal"
              disabled={busy}
              onClick={() => void onPost()}
              style={{
                flex: 1,
                minHeight: 48,
                fontSize: 14,
                fontFamily: "'Outfit', sans-serif",
                fontWeight: 600,
                borderRadius: 10,
                opacity: busy ? 0.65 : 1,
              }}
            >
              {busy ? "Posting…" : "Post It"}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
