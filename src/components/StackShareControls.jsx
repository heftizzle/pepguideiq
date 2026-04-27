import { useCallback, useEffect, useRef, useState } from "react";
import { ensureUserStackShareId, supabase } from "../lib/supabase.js";
import { TUTORIAL_TARGET, tutorialHighlightProps, useTutorialOptional } from "../context/TutorialContext.jsx";
import { buildStackShareSmsUrl, buildStackShareUrl } from "../lib/stackShare.js";

function canUseWebShare() {
  return typeof navigator !== "undefined" && typeof navigator.share === "function";
}

/**
 * Share button + inline sheet for the current saved stack (one row per user in user_stacks).
 * @param {{
 *   userId: string | undefined,
 *   profileId: string | undefined,
 *   stackId: string | undefined,
 *   stackName?: string,
 *   initialShareId: string | null,
 *   onShareIdChange: (shareId: string) => void,
 *   feedVisible?: boolean,
 *   onFeedVisibleChange?: (visible: boolean) => void,
 *   disabled?: boolean,
 * }} props
 */
export function StackShareControls({
  userId,
  profileId,
  stackId,
  stackName = "",
  initialShareId,
  onShareIdChange,
  feedVisible = false,
  onFeedVisibleChange,
  disabled = false,
}) {
  const tutorial = useTutorialOptional();
  const [open, setOpen] = useState(false);
  const [shareId, setShareId] = useState(initialShareId ?? null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [showCopied, setShowCopied] = useState(false);
  const [feedBusy, setFeedBusy] = useState(false);
  const copyResetTimer = useRef(null);

  useEffect(() => {
    setShareId(initialShareId ?? null);
  }, [initialShareId]);

  useEffect(() => {
    return () => {
      if (copyResetTimer.current) clearTimeout(copyResetTimer.current);
    };
  }, []);

  const resolveShareId = useCallback(async () => {
    if (!userId || !profileId) return null;
    if (shareId) return shareId;
    setBusy(true);
    setErr(null);
    try {
      const { shareId: sid, error } = await ensureUserStackShareId(userId, profileId);
      if (error) {
        setErr(typeof error.message === "string" ? error.message : "Could not create share link");
        return null;
      }
      if (sid) {
        setShareId(sid);
        onShareIdChange(sid);
        return sid;
      }
      return null;
    } finally {
      setBusy(false);
    }
  }, [userId, profileId, shareId, onShareIdChange]);

  async function handleShareTap() {
    if (disabled || !userId || !profileId) return;
    setOpen(true);
    setErr(null);
    if (!shareId) await resolveShareId();
  }

  async function copyLink() {
    const sid = shareId ?? (await resolveShareId());
    if (!sid) return;
    const url = buildStackShareUrl(sid);
    try {
      await navigator.clipboard.writeText(url);
      setShowCopied(true);
      if (copyResetTimer.current) clearTimeout(copyResetTimer.current);
      copyResetTimer.current = setTimeout(() => setShowCopied(false), 2000);
    } catch {
      setErr("Could not copy to clipboard");
    }
  }

  async function sendSms() {
    const sid = shareId ?? (await resolveShareId());
    if (!sid) return;
    const url = buildStackShareUrl(sid);
    window.location.href = buildStackShareSmsUrl(url);
  }

  async function toggleNetworkFeed() {
    if (disabled || !userId || !profileId || !stackId || feedBusy) return;
    if (!supabase) return;
    const sid = shareId ?? initialShareId ?? null;
    if (!sid || !String(sid).trim()) return;
    const next = !feedVisible;
    setFeedBusy(true);
    setErr(null);
    try {
      const { error } = await supabase.rpc("set_stack_feed_visible", {
        p_stack_id: stackId,
        p_visible: next,
      });
      if (error) {
        const code = error.code ?? "";
        if (code === "42501") {
          setErr("You don't own this stack.");
          console.error("[set_stack_feed_visible] 42501 — caller is not stack owner", error);
        } else if (code === "P0002") {
          setErr("Stack not found. Try refreshing.");
        } else {
          setErr(typeof error.message === "string" ? error.message : "Could not update Network");
        }
        return;
      }
      onFeedVisibleChange?.(next);
    } finally {
      setFeedBusy(false);
    }
  }

  async function nativeShare() {
    const sid = shareId ?? (await resolveShareId());
    if (!sid) return;
    const shareUrl = buildStackShareUrl(sid);
    const name = String(stackName ?? "").trim() || "My stack";
    const title = `${name} — pepguideIQ`;
    const text = "Check out my stack on pepguideIQ:";
    const payload = { title, text, url: shareUrl };
    try {
      await navigator.share(payload);
    } catch (e) {
      if (e && typeof e === "object" && "name" in e && e.name === "AbortError") return;
      const msg = e instanceof Error ? e.message : null;
      setErr(typeof msg === "string" && msg ? msg : "Could not open share sheet");
    }
  }

  const fullUrl = shareId ? buildStackShareUrl(shareId) : "";
  const displayUrl =
    fullUrl.length > 56 ? `${fullUrl.slice(0, 28)}…${fullUrl.slice(-22)}` : fullUrl;
  const hasShareId = Boolean((shareId ?? initialShareId ?? "").toString().trim());

  return (
    <div
      style={{ marginTop: 10, display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}
      data-tutorial-target={TUTORIAL_TARGET.stack_share}
      {...tutorialHighlightProps(Boolean(tutorial?.isHighlighted(TUTORIAL_TARGET.stack_share)))}
    >
      {hasShareId ? (
        <button
          type="button"
          className="btn-teal"
          disabled={disabled || !userId || !profileId || feedBusy}
          onClick={() => void toggleNetworkFeed()}
          style={{
            fontSize: 13,
            padding: "5px 12px",
            borderRadius: 12,
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            color: feedVisible ? "var(--color-accent)" : undefined,
            border: feedVisible ? "1px solid var(--color-bell-border-unread)" : undefined,
            background: feedVisible ? "var(--color-accent-dim)" : undefined,
          }}
        >
          {feedBusy ? "…" : feedVisible ? "Shared to Network ✓" : "Post to Network"}
        </button>
      ) : null}
      <button
        type="button"
        className="btn-teal"
        disabled={disabled || !userId || busy}
        onClick={() => void handleShareTap()}
        style={{
          fontSize: 13,
          padding: "5px 12px",
          borderRadius: 12,
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <span aria-hidden>🔗</span>
        Share
      </button>

      {open && (
        <div
          style={{
            marginTop: 12,
            padding: 14,
            borderRadius: 12,
            border: "1px solid var(--color-border-tab)",
            background: "var(--color-bg-sunken)",
            maxWidth: 400,
            boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
          }}
        >
          <div
            className="mono"
            style={{ fontSize: 12, color: "var(--color-accent)", letterSpacing: "0.1em", marginBottom: 10 }}
          >
            SHARE STACK
          </div>
          {busy && (
            <div className="mono" style={{ fontSize: 12, color: "var(--color-text-placeholder)", marginBottom: 8 }}>
              Preparing link…
            </div>
          )}
          {displayUrl && (
            <div
              className="mono"
              style={{
                fontSize: 12,
                color: "var(--color-text-secondary)",
                wordBreak: "break-all",
                lineHeight: 1.45,
                marginBottom: 12,
                padding: "8px 10px",
                borderRadius: 10,
                background: "var(--color-bg-page)",
                border: "1px solid var(--color-border-default)",
              }}
              title={fullUrl}
            >
              {displayUrl}
            </div>
          )}
          {err && (
            <div className="mono" style={{ fontSize: 12, color: "var(--color-warning)", marginBottom: 10 }}>
              {err}
            </div>
          )}
          {canUseWebShare() ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <button
                type="button"
                className="btn-teal"
                style={{ fontSize: 13, padding: "8px 12px", borderRadius: 12, width: "100%", justifyContent: "center" }}
                disabled={busy || !userId}
                onClick={() => void nativeShare()}
              >
                Share…
              </button>
              <button
                type="button"
                className="btn-teal"
                style={{ fontSize: 13, padding: "5px 12px", borderRadius: 12, opacity: 0.95, width: "100%", justifyContent: "center" }}
                disabled={busy || !userId}
                onClick={() => void copyLink()}
              >
                {showCopied ? "Copied!" : "Copy Link"}
              </button>
              <button
                type="button"
                className="btn-teal"
                style={{ fontSize: 13, padding: "5px 12px", borderRadius: 12, opacity: 0.85, alignSelf: "flex-start" }}
                onClick={() => setOpen(false)}
              >
                Close
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              <button
                type="button"
                className="btn-teal"
                style={{ fontSize: 13, padding: "5px 12px", borderRadius: 12 }}
                disabled={busy || !userId}
                onClick={() => void copyLink()}
              >
                {showCopied ? "Copied!" : "Copy Link"}
              </button>
              <button
                type="button"
                className="btn-teal"
                style={{ fontSize: 13, padding: "5px 12px", borderRadius: 12 }}
                disabled={busy || !userId}
                onClick={() => void sendSms()}
              >
                Send via SMS
              </button>
              <button
                type="button"
                className="btn-teal"
                style={{ fontSize: 13, padding: "5px 12px", borderRadius: 12, opacity: 0.85 }}
                onClick={() => setOpen(false)}
              >
                Close
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
