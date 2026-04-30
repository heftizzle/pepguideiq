import { useEffect } from "react";
import { createPortal } from "react-dom";
import { TOAST_DURATION_MS } from "../lib/toastConstants.js";

/** Enter/exit fades beyond {@link TOAST_DURATION_MS} — keep in sync with `pepv-dose-toast-anim` keyframes. */
const TOAST_FADE_PAD_MS = 500;

/**
 * Global post–dose confirmation (fixed above bottom nav, clears home indicator + notch).
 * @param {{ message: string | null; onDismiss: () => void }} props
 */
export function DoseToast({ message, onDismiss }) {
  const animSeconds = (TOAST_DURATION_MS + TOAST_FADE_PAD_MS) / 1000;

  useEffect(() => {
    if (!message) return;
    const t = window.setTimeout(() => onDismiss(), TOAST_DURATION_MS + TOAST_FADE_PAD_MS);
    return () => window.clearTimeout(t);
  }, [message, onDismiss]);

  if (typeof document === "undefined" || !message) return null;

  return createPortal(
    <div className="pepv-dose-toast-wrap" role="status" aria-live="polite">
      <div
        key={message}
        className="pepv-dose-toast-inner"
        style={{ animationDuration: `${animSeconds}s` }}
      >
        {message}
      </div>
    </div>,
    document.body
  );
}
