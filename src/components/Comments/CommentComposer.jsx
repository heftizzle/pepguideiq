import { useCallback, useEffect, useRef, useState } from "react";
import { shouldShowCharProximityCounter } from "../../lib/charCounterProximity.js";
import { API_WORKER_URL } from "../../lib/config.js";
import { getSessionAccessToken } from "../../lib/supabase.js";
import { searchMemberProfiles } from "../../lib/follows.js";

const SOFT_MAX = 1000;
const HARD_MAX = 2000;

/** @param {{ count: number }} p */
function CounterFooterSlot({ count }) {
  const show = shouldShowCharProximityCounter(count, SOFT_MAX);
  if (!show) return null;
  return (
    <span className="mono" style={{ color: "var(--color-text-danger)" }}>
      {count}/{SOFT_MAX}
    </span>
  );
}

/**
 * @mention autocomplete dropdown.
 * onMouseDown + e.preventDefault() keeps the textarea focused so the
 * feed layout's onBlur collapse never fires during a pick.
 *
 * Only renders when open=true AND (loading OR results.length > 0).
 */
function MentionDropdown({ open, results, activeIndex, onPick, loading }) {
  if (!open) return null;
  if (!loading && results.length === 0) return null;
  return (
    <div
      style={{
        position: "absolute",
        bottom: "calc(100% + 6px)",
        left: 0,
        right: 0,
        background: "var(--color-bg-card)",
        border: "1px solid var(--color-border-default)",
        borderRadius: 10,
        overflow: "hidden",
        zIndex: 200,
        boxShadow: "0 -4px 20px rgba(0,0,0,0.35)",
        maxHeight: 224,
        overflowY: "auto",
      }}
    >
      {loading && results.length === 0 ? (
        <div style={{ padding: "10px 14px", fontSize: 13, color: "var(--color-text-muted)" }}>
          Searching…
        </div>
      ) : (
        results.map((p, i) => {
          const displayHandle = p.display_handle || p.handle || "";
          const displayName = p.display_name || "";
          const active = i === activeIndex;
          return (
            <button
              key={p.user_id || p.handle || i}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                onPick(p);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                width: "100%",
                padding: "9px 14px",
                background: active
                  ? "var(--color-bg-hover, rgba(255,255,255,0.06))"
                  : "transparent",
                border: "none",
                borderBottom: "1px solid var(--color-border-subtle, rgba(255,255,255,0.04))",
                cursor: "pointer",
                textAlign: "left",
                color: "var(--color-text-primary)",
                fontSize: 14,
                fontFamily: "inherit",
              }}
            >
              <span style={{ fontWeight: 600, color: "var(--color-accent)", flexShrink: 0 }}>
                @{displayHandle}
              </span>
              {displayName ? (
                <span
                  style={{
                    color: "var(--color-text-muted)",
                    fontSize: 12,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {displayName}
                </span>
              ) : null}
            </button>
          );
        })
      )}
    </div>
  );
}

/**
 * Textarea + Post button composer used both as the post-level composer
 * in `CommentsSection` and as the inline reply composer inside a
 * `CommentItem`.
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
  workerUrl,
}) {
  const [value, setValue] = useState(initialValue);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [feedExpanded, setFeedExpanded] = useState(false);
  const taRef = useRef(/** @type {HTMLTextAreaElement | null} */ (null));

  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionResults, setMentionResults] = useState(/** @type {any[]} */ ([]));
  const [mentionOpen, setMentionOpen] = useState(false);
  const [mentionLoading, setMentionLoading] = useState(false);
  const [mentionIndex, setMentionIndex] = useState(0);
  const mentionTriggerIdx = useRef(-1);

  useEffect(() => {
    if (!mentionQuery) {
      setMentionResults([]);
      setMentionOpen(false);
      setMentionLoading(false);
      return;
    }
    let cancelled = false;
    setMentionLoading(true);
    const timer = setTimeout(async () => {
      try {
        const wUrl = workerUrl || API_WORKER_URL;
        if (!wUrl) return;
        const token = await getSessionAccessToken();
        if (!token || cancelled) return;
        const results = await searchMemberProfiles(mentionQuery, wUrl, token, {
          handleOnly: true,
        });
        if (!cancelled) {
          const capped = results.slice(0, 6);
          setMentionResults(capped);
          setMentionOpen(capped.length > 0);
          setMentionIndex(0);
        }
      } catch {
        if (!cancelled) setMentionOpen(false);
      } finally {
        if (!cancelled) setMentionLoading(false);
      }
    }, 220);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [mentionQuery, workerUrl]);

  const closeMention = useCallback(() => {
    setMentionOpen(false);
    setMentionQuery("");
    setMentionLoading(false);
    mentionTriggerIdx.current = -1;
  }, []);

  const pickMention = useCallback(
    (profile) => {
      if (!profile) return;
      const handle = profile.display_handle || profile.handle || "";
      if (!handle) return;
      const trigIdx = mentionTriggerIdx.current;
      if (trigIdx < 0) return;
      const cursorPos = taRef.current?.selectionStart ?? value.length;
      const before = value.slice(0, trigIdx);
      const after = value.slice(cursorPos);
      const insert = `@${handle} `;
      const next = (before + insert + after).slice(0, HARD_MAX);
      setValue(next);
      closeMention();
      requestAnimationFrame(() => {
        if (!taRef.current) return;
        taRef.current.focus();
        const pos = before.length + insert.length;
        taRef.current.setSelectionRange(pos, pos);
      });
    },
    [value, closeMention]
  );

  const handleChange = useCallback((e) => {
    const raw = e.target.value.slice(0, HARD_MAX);
    setValue(raw);
    const cursor = e.target.selectionStart ?? raw.length;
    const before = raw.slice(0, cursor);
    const match = before.match(/@([a-zA-Z0-9_-]*)$/);
    if (match) {
      mentionTriggerIdx.current = cursor - match[0].length;
      const q = match[1];
      setMentionQuery(q);
      if (!q) {
        setMentionOpen(false);
        setMentionLoading(true);
      }
    } else {
      mentionTriggerIdx.current = -1;
      setMentionQuery("");
      setMentionOpen(false);
      setMentionLoading(false);
    }
  }, []);

  const submit = useCallback(async () => {
    const trimmed = value.trim();
    if (submitting || !trimmed) return;
    setSubmitting(true);
    setError("");
    const result = await hook.post({ body: trimmed });
    setSubmitting(false);
    if (!result || !result.ok) {
      setError(result?.error || "Could not post comment.");
      return;
    }
    setValue("");
    closeMention();
    if (layout === "feed") setFeedExpanded(false);
  }, [value, submitting, hook, closeMention, layout]);

  const handleKeyDown = useCallback(
    (e) => {
      if (mentionOpen && mentionResults.length > 0) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setMentionIndex((i) => Math.min(i + 1, mentionResults.length - 1));
          return;
        }
        if (e.key === "ArrowUp") {
          e.preventDefault();
          setMentionIndex((i) => Math.max(i - 1, 0));
          return;
        }
        if (e.key === "Enter" && !e.metaKey && !e.ctrlKey) {
          e.preventDefault();
          pickMention(mentionResults[mentionIndex]);
          return;
        }
        if (e.key === "Escape") {
          e.preventDefault();
          closeMention();
          return;
        }
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        void submit();
      }
    },
    [mentionOpen, mentionResults, mentionIndex, pickMention, closeMention, submit]
  );

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
      <span>{error || ""}</span>
      <CounterFooterSlot count={count} />
    </div>
  );

  if (compact) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <div
          style={{
            position: "relative",
            display: "flex",
            alignItems: "flex-start",
            gap: 8,
            background: "var(--color-bg-card)",
            border: "1px solid var(--color-border-default)",
            borderRadius: 10,
            padding: "6px 8px",
          }}
        >
          <MentionDropdown
            open={mentionOpen}
            results={mentionResults}
            activeIndex={mentionIndex}
            onPick={pickMention}
            loading={mentionLoading}
          />
          <textarea
            ref={taRef}
            value={value}
            onChange={handleChange}
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
            <MentionDropdown
              open={mentionOpen}
              results={mentionResults}
              activeIndex={mentionIndex}
              onPick={pickMention}
              loading={mentionLoading}
            />
            <textarea
              ref={taRef}
              value={value}
              onChange={handleChange}
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
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden
              >
                <line
                  x1="4"
                  y1="12"
                  x2="18"
                  y2="12"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
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
        {error ? (
          <div style={{ fontSize: 11, color: "var(--color-warning)", padding: "0 2px" }}>
            {error}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "flex-start",
          gap: 8,
          background: "var(--color-bg-card)",
          border: "1px solid var(--color-border-default)",
          borderRadius: 10,
          padding: "8px 10px",
        }}
      >
        <MentionDropdown
          open={mentionOpen}
          results={mentionResults}
          activeIndex={mentionIndex}
          onPick={pickMention}
          loading={mentionLoading}
        />
        <textarea
          ref={taRef}
          value={value}
          onChange={handleChange}
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
