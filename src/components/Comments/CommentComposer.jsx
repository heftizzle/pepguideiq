import { useEffect, useRef, useState } from "react";

const SOFT_MAX = 1000;
const HARD_MAX = 2000;

/**
 * Textarea + Post button composer used both as the post-level composer
 * in `CommentsSection` and as the inline reply composer inside a
 * `CommentItem`.
 *
 * Always-visible slot: when `!currentUserId || !currentProfileId`,
 * renders a "Sign in to comment" stub that dispatches a click event —
 * the host page shows the auth flow via existing `/` route.
 *
 * Submits via `hook.post({ body, parentCommentId? })`. For the
 * top-level post composer, the hook is the full `useComments` return.
 * For the reply composer in `CommentItem`, the parent passes a
 * lightweight `{ post }` shim that injects `parentCommentId`.
 *
 * @param {{
 *   hook: { post: (args: { body: string, parentCommentId?: string | null }) => Promise<{ ok: boolean, error?: string }> },
 *   currentUserId: string | null,
 *   currentProfileId: string | null,
 *   placeholder?: string,
 *   initialValue?: string,
 *   autoFocus?: boolean,
 *   compact?: boolean,
 * }} props
 */
export default function CommentComposer({
  hook,
  currentUserId,
  currentProfileId,
  placeholder = "Add a comment…",
  initialValue = "",
  autoFocus = false,
  compact = false,
}) {
  const [value, setValue] = useState(initialValue);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const taRef = useRef(/** @type {HTMLTextAreaElement | null} */ (null));

  useEffect(() => {
    if (autoFocus && taRef.current) {
      try {
        taRef.current.focus();
        const n = taRef.current.value.length;
        taRef.current.setSelectionRange(n, n);
      } catch {
        /* ignore */
      }
    }
  }, [autoFocus]);

  const isAnon = !currentUserId || !currentProfileId;

  if (isAnon) {
    return (
      <a
        href="/"
        className="btn-teal"
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          alignSelf: "flex-start",
          padding: "8px 14px",
          fontSize: 13,
          textDecoration: "none",
          cursor: "pointer",
          borderRadius: 10,
        }}
      >
        Sign in to comment
      </a>
    );
  }

  const trimmed = value.trim();
  const disabled = submitting || trimmed.length === 0;
  const over = value.length > SOFT_MAX;
  const count = value.length;

  const submit = async () => {
    if (disabled) return;
    setSubmitting(true);
    setError("");
    const result = await hook.post({ body: trimmed });
    setSubmitting(false);
    if (!result || !result.ok) {
      setError(result?.error || "Could not post comment.");
      return;
    }
    setValue("");
  };

  const handleKeyDown = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      void submit();
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 8,
          background: "var(--color-bg-card)",
          border: "1px solid var(--color-border-default)",
          borderRadius: 10,
          padding: compact ? "6px 8px" : "8px 10px",
        }}
      >
        <textarea
          ref={taRef}
          value={value}
          onChange={(e) => setValue(e.target.value.slice(0, HARD_MAX))}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={compact ? 1 : 2}
          maxLength={HARD_MAX}
          style={{
            flex: 1,
            minHeight: compact ? 28 : 40,
            maxHeight: 140,
            resize: "vertical",
            border: "none",
            outline: "none",
            background: "transparent",
            color: "var(--color-text-primary)",
            fontSize: 14,
            lineHeight: 1.4,
            fontFamily: "inherit",
            padding: 0,
          }}
        />
        <button
          type="button"
          className="btn-teal"
          disabled={disabled}
          onClick={() => void submit()}
          style={{
            flexShrink: 0,
            padding: "6px 12px",
            fontSize: 13,
            borderRadius: 8,
            opacity: disabled ? 0.5 : 1,
            cursor: disabled ? "not-allowed" : "pointer",
          }}
        >
          {submitting ? "Posting…" : "Post"}
        </button>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0 2px",
          fontSize: 11,
          color: over ? "var(--color-warning)" : "var(--color-text-muted)",
        }}
      >
        <span>{error ? error : ""}</span>
        <span className="mono">{count}/{SOFT_MAX}</span>
      </div>
    </div>
  );
}
