import { useEffect } from "react";
import { createPortal } from "react-dom";

/**
 * Global post–dose confirmation (fixed below top chrome, clears header + notch).
 * @param {{ message: string | null; onDismiss: () => void }} props
 */
export function DoseToast({ message, onDismiss }) {
  useEffect(() => {
    if (!message) return;
    const t = window.setTimeout(() => onDismiss(), 4500);
    return () => window.clearTimeout(t);
  }, [message, onDismiss]);

  if (typeof document === "undefined" || !message) return null;

  return createPortal(
    <div className="pepv-dose-toast-wrap" role="status" aria-live="polite">
      <div key={message} className="pepv-dose-toast-inner">
        {message}
      </div>
    </div>,
    document.body
  );
}
