import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Owner-only kebab menu for a comment row.
 *
 * Mirrors `PostMenuButton` — same affordance (3-dot button + popover), same
 * deferred-commit behavior, but with "Delete comment" copy. Returns `null`
 * unless the viewer owns the comment (`currentUserId === commentUserId`).
 *
 * The caller owns the optimistic-remove + `dispatchDeferredDelete` wiring
 * (typically via `useComments.deleteComment(id, parentId)`). This component
 * does NOT touch supabase directly.
 *
 * @param {{
 *   commentId: string,
 *   commentUserId: string | null,
 *   currentUserId: string | null,
 *   onDeferredDelete: () => void,
 *   size?: number,
 * }} props
 */
export default function CommentMenuButton({
  commentId,
  commentUserId,
  currentUserId,
  onDeferredDelete,
  size = 22,
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(/** @type {HTMLDivElement | null} */ (null));

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e) => {
      const t = e.target;
      if (!(t instanceof Node)) return;
      if (wrapRef.current?.contains(t)) return;
      close();
    };
    const onKey = (e) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  if (!commentId || !currentUserId || currentUserId !== commentUserId) return null;

  const onDeleteClick = () => {
    close();
    try {
      onDeferredDelete?.();
    } catch {
      /* ignore — caller handles */
    }
  };

  return (
    <div ref={wrapRef} style={{ position: "relative", flexShrink: 0 }}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        aria-label="Comment options"
        aria-haspopup="menu"
        aria-expanded={open}
        style={{
          width: size,
          height: size,
          padding: 0,
          border: "none",
          background: "transparent",
          color: "var(--color-text-secondary)",
          cursor: "pointer",
          borderRadius: 4,
          fontSize: Math.round(size * 0.85),
          lineHeight: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span aria-hidden>⋯</span>
      </button>
      {open ? (
        <div
          role="menu"
          onClick={(e) => e.stopPropagation()}
          style={{
            position: "absolute",
            top: size + 4,
            right: 0,
            minWidth: 160,
            background: "var(--color-bg-elevated)",
            border: "1px solid var(--color-border-emphasis)",
            borderRadius: 8,
            boxShadow: "0 12px 32px rgba(0,0,0,0.4)",
            padding: "4px 0",
            zIndex: 9200,
          }}
        >
          <button
            type="button"
            role="menuitem"
            onClick={onDeleteClick}
            style={{
              width: "100%",
              textAlign: "left",
              padding: "10px 14px",
              border: "none",
              background: "transparent",
              color: "var(--color-danger)",
              fontSize: 14,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Delete comment
          </button>
        </div>
      ) : null}
    </div>
  );
}
