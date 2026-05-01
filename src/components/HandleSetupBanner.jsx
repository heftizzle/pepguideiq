import { useCallback, useMemo, useState } from "react";
import { normalizeHandleInput } from "../lib/memberProfileHandle.js";

function dismissedKey(userId) {
  return `pepv_handle_prompt_dismissed.${userId}`;
}

/**
 * Soft prompt when active profile has no @handle yet.
 *
 * @param {{
 *   userId: string,
 *   handle: string | null | undefined,
 *   onGoSetHandle?: () => void,
 * }} props
 */
export function HandleSetupBanner({ userId, handle, onGoSetHandle }) {
  const hasHandle = Boolean(normalizeHandleInput(handle ?? ""));
  const [hidden, setHidden] = useState(() => {
    try {
      if (typeof sessionStorage === "undefined" || !userId) return false;
      return sessionStorage.getItem(dismissedKey(userId)) === "1";
    } catch {
      return false;
    }
  });

  const dismiss = useCallback(() => {
    try {
      if (userId && typeof sessionStorage !== "undefined") {
        sessionStorage.setItem(dismissedKey(userId), "1");
      }
    } catch {
      /* ignore */
    }
    setHidden(true);
  }, [userId]);

  const onPrimary = useCallback(() => {
    if (typeof onGoSetHandle === "function") {
      try {
        onGoSetHandle();
      } catch {
        /* ignore */
      }
    }
  }, [onGoSetHandle]);

  const show = useMemo(() => !hasHandle && !hidden && Boolean(userId), [hasHandle, hidden, userId]);

  if (!show) return null;

  return (
    <div
      role="region"
      aria-label="Set your handle"
      style={{
        marginBottom: 16,
        padding: "12px 14px",
        borderRadius: 10,
        border: "1px solid var(--color-border-default)",
        background: "var(--color-bg-elevated)",
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      <div className="mono" style={{ fontSize: 12, color: "var(--color-text-secondary)", lineHeight: 1.45 }}>
        Set your @handle so others can find and tag you.
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
        <button type="button" className="btn-teal" onClick={onPrimary}>
          Set handle
        </button>
        <button
          type="button"
          className="mono"
          onClick={dismiss}
          style={{
            fontSize: 12,
            padding: "6px 10px",
            borderRadius: 8,
            border: "1px solid var(--color-border-default)",
            background: "transparent",
            color: "var(--color-text-secondary)",
            cursor: "pointer",
          }}
        >
          Not now
        </button>
      </div>
    </div>
  );
}
