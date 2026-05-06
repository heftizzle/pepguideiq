import { useEffect, useRef, useState } from "react";
import { shouldShowCharProximityCounter } from "../../lib/charCounterProximity.js";

const SOFT_MAX = 1000;
const HARD_MAX = 2000;

/** @param {{ count: number }} p */
function CounterFooterSlot({ count }) {
  const show = shouldShowCharProximityCounter(count, SOFT_MAX);
  if (!show) return null;
  return <span className="mono" style={{ color: "var(--color-text-danger)" }}>{count}/{SOFT_MAX}</span>;
}

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
 *   layout?: "default" | "feed",
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
  layout = "default",
}) {
  const [value, setValue] = useState(initialValue);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [feedExpanded, setFeedExpanded] = useState(false);
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

  useEffect(() => {
    if (layout === "feed" && feedExpanded && taRef.current) {
      try {
        taRef.current.focus();
      } catch {
        /* ignore */
      }
    }
  }, [layout, feedExpanded]);

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
    if (layout === "feed") setFeedExpanded(false);
  };

  const handleKeyDown = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      void submit();
    }
  };

  const footerRow = (
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
      <CounterFooterSlot count={count} />
    </div>
  );

  if (compact) {
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
            padding: "6px 8px",
          }}
        >
          <textarea
            ref={taRef}
            value={value}
            onChange={(e) => setValue(e.target.value.slice(0, HARD_MAX))}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            rows={1}
            maxLength={HARD_MAX}
            style={{
              flex: 1,
              minHeight: 28,
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
        {footerRow}
      </div>
    );
  }

  if (layout === "feed") {
    const sendActive = !disabled;
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {!feedExpanded ? (
          <button
            type="button"
            onClick={() => setFeedExpanded(true)}
            style={{
              width: "100%",
              textAlign: "left",
              borderRadius: 20,
              border: "1px solid var(--color-border-default)",
              background: "var(--color-bg-card)",
              color: "var(--color-text-placeholder)",
              fontSize: 14,
              fontFamily: "inherit",
              padding: "10px 14px",
              cursor: "text",
              lineHeight: 1.35,
            }}
          >
            Add a comment...
          </button>
        ) : (
          <div
            style={{
              position: "relative",
              display: "flex",
              alignItems: "stretch",
              background: "var(--color-bg-card)",
              border: "1px solid var(--color-border-default)",
              borderRadius: 20,
              padding: "6px 44px 6px 12px",
              minHeight: 44,
            }}
          >
            <textarea
              ref={taRef}
              value={value}
              onChange={(e) => setValue(e.target.value.slice(0, HARD_MAX))}
              onKeyDown={handleKeyDown}
              onBlur={() => {
                window.setTimeout(() => {
                  const raw = taRef.current?.value ?? "";
                  if (!raw.trim()) setFeedExpanded(false);
                }, 180);
              }}
              placeholder={placeholder}
              rows={2}
              maxLength={HARD_MAX}
              aria-label={placeholder}
              style={{
                flex: 1,
                minHeight: 40,
                maxHeight: 140,
                resize: "none",
                border: "none",
                outline: "none",
                background: "transparent",
                color: "var(--color-text-primary)",
                fontSize: 14,
                lineHeight: 1.4,
                fontFamily: "inherit",
                padding: 0,
                boxSizing: "border-box",
              }}
            />
            <button
              type="button"
              disabled={disabled}
              aria-busy={submitting}
              aria-label={submitting ? "Posting comment" : "Post comment"}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => void submit()}
              style={{
                position: "absolute",
                right: 8,
                top: "50%",
                transform: "translateY(-50%)",
                width: 36,
                height: 36,
                borderRadius: 999,
                border: "none",
                cursor: disabled ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "transparent",
                color: sendActive ? "var(--color-accent)" : "var(--color-text-muted)",
                opacity: disabled ? 0.85 : 1,
                padding: 0,
              }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                <line x1="4" y1="12" x2="18" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <polyline
                  points="13 7 18 12 13 17"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        )}
        {footerRow}
      </div>
    );
  }

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
          padding: "8px 10px",
        }}
      >
        <textarea
          ref={taRef}
          value={value}
          onChange={(e) => setValue(e.target.value.slice(0, HARD_MAX))}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={2}
          maxLength={HARD_MAX}
          style={{
            flex: 1,
            minHeight: 40,
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
      {footerRow}
    </div>
  );
}
