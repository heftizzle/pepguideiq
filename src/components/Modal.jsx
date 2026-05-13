import { useEffect, useRef } from "react";
import { CloseButton } from "./ui/CloseButton.jsx";
import { useFocusTrap } from "./useFocusTrap.js";

/**
 * @param {{
 *   onClose: () => void;
 *   children: import("react").ReactNode;
 *   header?: import("react").ReactNode;
 *   maxWidth?: number;
 *   label?: string;
 *   variant?: "default" | "sheet";
 *   showCloseButton?: boolean;
 * }} props
 */
export function Modal({
  onClose,
  children,
  header,
  maxWidth = 580,
  label = "Dialog",
  variant = "default",
  showCloseButton = true,
}) {
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
          position: "relative",
          background: "var(--color-bg-card)",
          border: "1px solid var(--color-border-strong)",
          borderRadius: 12,
          maxWidth,
          width: "100%",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          boxShadow: "0 20px 60px rgba(0,0,0,0.55)",
        }}
      >
        {showCloseButton ? (
          <CloseButton
            onClose={onClose}
            ariaLabel="Close"
            variant="modal-accent"
            style={{ position: "absolute", top: 6, right: 6, zIndex: 2 }}
          />
        ) : null}
        {header ? (
          <div style={{
            padding: "14px 64px 10px 20px",
            background: "var(--color-bg-card)",
            borderBottom: "1px solid var(--color-border-hairline)",
            flexShrink: 0,
          }}>
            {header}
          </div>
        ) : null}
        <div style={{
          padding: header ? "10px 20px 20px 20px" : 28,
          overflowY: "auto",
          flex: 1,
        }}>
          {children}
        </div>
      </div>
    </div>
  );
}
