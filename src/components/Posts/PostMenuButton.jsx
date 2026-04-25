import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Owner-only kebab menu for a post.
 *
 * Rendered on the feed `MediaPostCard` and inside the `PublicProfilePhotoGrid`
 * lightbox header. Returns `null` unless the current viewer owns the post
 * (`currentUserId && currentUserId === ownerUserId`). Non-owners never see
 * the kebab, so RLS-blocked deletes are impossible from this UI path.
 *
 * The menu currently has a single action — Delete — but renders as a popover
 * so additional owner actions (Report/Hide/Edit) can slot in without
 * restructuring callers.
 *
 * Delete is deferred-commit via `DeleteUndoToast`: tapping "Delete post"
 * closes the popover and invokes `onDeferredDelete()`. The caller owns the
 * optimistic-remove + `dispatchDeferredDelete` wiring; this component does
 * NOT touch supabase directly.
 *
 * @param {{
 *   postId: string,
 *   ownerUserId: string | null,
 *   currentUserId: string | null,
 *   onDeferredDelete: () => void,
 *   size?: number,
 * }} props
 */
export default function PostMenuButton({
  postId,
  ownerUserId,
  currentUserId,
  onDeferredDelete,
  size = 28,
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

  if (!postId || !currentUserId || currentUserId !== ownerUserId) return null;

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
        aria-label="Post options"
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
          borderRadius: 6,
          fontSize: Math.round(size * 0.7),
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
            Delete post
          </button>
        </div>
      ) : null}
    </div>
  );
}
