import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

/**
 * Shared deferred-delete toast.
 *
 * Anywhere in the app that wants a destructive action to feel safe:
 *   1. Snapshot state for undo.
 *   2. Optimistically remove the row from UI.
 *   3. Call `dispatchDeferredDelete({ label, onCommit, onUndo })`.
 *
 * A single toast renders a "{label} · Undo" strip. After `timeoutMs`
 * (default 5000ms) the toast calls `onCommit()` — typically the actual
 * supabase delete. Tapping Undo cancels the timer and calls `onUndo()`.
 *
 * Queue policy: one toast at a time. If a second event arrives while one
 * is pending, the pending one commits immediately and the new one starts
 * its own countdown. Component unmount / page unload also commits any
 * pending delete — the user's intent was already expressed by the tap.
 *
 * Mount once at the App root. Do NOT double-mount inside overlays — two
 * listeners would both commit and double-fire the supabase delete.
 */

const EVENT_NAME = "pepguide:deferred-delete";
const Z_INDEX = 9500;

/**
 * @param {{
 *   label: string,
 *   onCommit: () => Promise<void> | void,
 *   onUndo?: () => void,
 *   timeoutMs?: number,
 * }} detail
 */
export function dispatchDeferredDelete(detail) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail }));
}

export default function DeleteUndoToast() {
  const [activeLabel, setActiveLabel] = useState(/** @type {string | null} */ (null));
  const pendingRef = useRef(
    /** @type {null | {
     *   label: string,
     *   onCommit: () => Promise<void> | void,
     *   onUndo?: () => void,
     *   timer: number | null,
     *   committed: boolean,
     * }} */ (null)
  );

  /** Commit the currently pending toast, if any. Safe to call multiple times. */
  const commitPending = useCallback(() => {
    const p = pendingRef.current;
    if (!p || p.committed) return;
    p.committed = true;
    if (p.timer != null) {
      window.clearTimeout(p.timer);
      p.timer = null;
    }
    try {
      const maybe = p.onCommit?.();
      if (maybe && typeof /** @type {any} */ (maybe).catch === "function") {
        /** @type {Promise<void>} */ (maybe).catch(() => {
          /* swallow — caller optimistically updated UI; server is source of truth on next refetch */
        });
      }
    } catch {
      /* ignore */
    }
    pendingRef.current = null;
    setActiveLabel(null);
  }, []);

  /** Undo the currently pending toast. Cancels the commit timer and restores caller state. */
  const undoPending = useCallback(() => {
    const p = pendingRef.current;
    if (!p || p.committed) return;
    if (p.timer != null) {
      window.clearTimeout(p.timer);
      p.timer = null;
    }
    try {
      p.onUndo?.();
    } catch {
      /* ignore */
    }
    pendingRef.current = null;
    setActiveLabel(null);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const onEvent = (/** @type {CustomEvent<any>} */ event) => {
      const detail = event?.detail ?? {};
      const label = typeof detail.label === "string" && detail.label ? detail.label : "Deleted";
      const onCommit = typeof detail.onCommit === "function" ? detail.onCommit : () => {};
      const onUndo = typeof detail.onUndo === "function" ? detail.onUndo : undefined;
      const timeoutMs =
        typeof detail.timeoutMs === "number" && detail.timeoutMs > 0
          ? Math.min(30_000, detail.timeoutMs)
          : 5000;

      if (pendingRef.current && !pendingRef.current.committed) {
        commitPending();
      }

      const entry = {
        label,
        onCommit,
        onUndo,
        timer: /** @type {number | null} */ (null),
        committed: false,
      };
      pendingRef.current = entry;
      entry.timer = window.setTimeout(() => commitPending(), timeoutMs);
      setActiveLabel(label);
    };
    window.addEventListener(EVENT_NAME, onEvent);
    return () => window.removeEventListener(EVENT_NAME, onEvent);
  }, [commitPending]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const onBeforeUnload = () => commitPending();
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [commitPending]);

  useEffect(() => {
    return () => {
      if (pendingRef.current && !pendingRef.current.committed) {
        commitPending();
      }
    };
  }, [commitPending]);

  if (!activeLabel || typeof document === "undefined") return null;

  const toast = (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: "fixed",
        left: "max(16px, env(safe-area-inset-left))",
        right: "max(16px, env(safe-area-inset-right))",
        bottom: "max(20px, calc(env(safe-area-inset-bottom) + 20px))",
        display: "flex",
        justifyContent: "center",
        pointerEvents: "none",
        zIndex: Z_INDEX,
      }}
    >
      <div
        style={{
          pointerEvents: "auto",
          minWidth: 220,
          maxWidth: 420,
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "10px 12px 10px 14px",
          background: "var(--color-bg-elevated)",
          color: "var(--color-text-primary)",
          border: "1px solid var(--color-border-emphasis)",
          borderRadius: 10,
          boxShadow: "0 12px 36px rgba(0,0,0,0.45)",
          fontSize: 14,
          lineHeight: 1.4,
        }}
      >
        <span style={{ flex: 1, minWidth: 0 }}>{activeLabel}</span>
        <button
          type="button"
          onClick={undoPending}
          className="mono"
          style={{
            background: "none",
            border: "none",
            padding: "4px 8px",
            fontSize: 12,
            color: "var(--color-accent)",
            cursor: "pointer",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            fontWeight: 700,
          }}
        >
          Undo
        </button>
      </div>
    </div>
  );

  return createPortal(toast, document.body);
}
