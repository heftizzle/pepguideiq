import { useEffect, useRef } from "react";
import { useFocusTrap } from "./useFocusTrap.js";

/**
 * @param {{ onClose: () => void; children: import("react").ReactNode; maxWidth?: number; label?: string; variant?: "default" | "sheet" }} props
 */
export function Modal({ onClose, children, maxWidth = 580, label = "Dialog", variant = "default" }) {
  const ref = useRef(null);
  useFocusTrap(ref, true);

  useEffect(() => {
    const prev = document.activeElement;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      prev?.focus();
    };
  }, [onClose]);

  const isSheet = variant === "sheet";

  return (
    <div
      onClick={onClose}
      className={isSheet ? "modal-backdrop modal-backdrop--sheet" : "modal-backdrop"}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.88)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 200,
        padding: 16,
      }}
      role="presentation"
    >
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        onClick={(e) => e.stopPropagation()}
        className={isSheet ? "modal-panel modal-panel--sheet" : "modal-panel"}
        style={{
          background: "var(--color-bg-sunken)",
          border: "1px solid var(--color-border-strong)",
          borderRadius: 12,
          padding: 28,
          maxWidth,
          width: "100%",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        {children}
      </div>
    </div>
  );
}
