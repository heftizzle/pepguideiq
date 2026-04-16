import { useCallback, useEffect, useRef, useState } from "react";
import { ensureUserStackShareId, updateStack } from "../lib/supabase.js";
import { DEMO_TARGET, demoHighlightProps, useDemoTourOptional } from "../context/DemoTourContext.jsx";
import { buildStackShareSmsUrl, buildStackShareUrl } from "../lib/stackShare.js";

function canUseWebShare() {
  return typeof navigator !== "undefined" && typeof navigator.share === "function";
}

/**
 * Share button + inline sheet for the current saved stack (one row per user in user_stacks).
 * @param {{
 *   userId: string | undefined,
 *   profileId: string | undefined,
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
  stackName = "",
  initialShareId,
  onShareIdChange,
  feedVisible = false,
  onFeedVisibleChange,
  disabled = false,
}) {
  const demo = useDemoTourOptional();
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
    if (disabled || !userId || !profileId || feedBusy) return;
    const sid = shareId ?? initialShareId ?? null;
    if (!sid || !String(sid).trim()) return;
    const next = !feedVisible;
    setFeedBusy(true);
    setErr(null);
    try {
      const { error } = await updateStack(userId, profileId, { feed_visible: next });
      if (error) {
        setErr(typeof error.message === "string" ? error.message : "Could not update Network");
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
      data-demo-target={DEMO_TARGET.stack_share}
      {...demoHighlightProps(Boolean(demo?.isHighlighted(DEMO_TARGET.stack_share)))}
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
            color: feedVisible ? "#00d4aa" : undefined,
            border: feedVisible ? "1px solid rgba(0, 212, 170, 0.45)" : undefined,
            background: feedVisible ? "rgba(0, 212, 170, 0.1)" : undefined,
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
            border: "1px solid #1e2a38",
            background: "#0b0f17",
            maxWidth: 400,
            boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
          }}
        >
          <div
            className="mono"
            style={{ fontSize: 12, color: "#00d4aa", letterSpacing: "0.1em", marginBottom: 10 }}
          >
            SHARE STACK
          </div>
          {busy && (
            <div className="mono" style={{ fontSize: 12, color: "#a0a0b0", marginBottom: 8 }}>
              Preparing link…
            </div>
          )}
          {displayUrl && (
            <div
              className="mono"
              style={{
                fontSize: 12,
                color: "#b0bec5",
                wordBreak: "break-all",
                lineHeight: 1.45,
                marginBottom: 12,
                padding: "8px 10px",
                borderRadius: 10,
                background: "#07090e",
                border: "1px solid #14202e",
              }}
              title={fullUrl}
            >
              {displayUrl}
            </div>
          )}
          {err && (
            <div className="mono" style={{ fontSize: 12, color: "#f59e0b", marginBottom: 10 }}>
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
