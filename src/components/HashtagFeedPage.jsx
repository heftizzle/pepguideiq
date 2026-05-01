import { useCallback, useEffect, useState } from "react";
import { GlobalStyles } from "./GlobalStyles.jsx";
import { MediaPostCard } from "./NetworkTab.jsx";
import { API_WORKER_URL, isApiWorkerConfigured } from "../lib/config.js";
import { getSessionAccessToken } from "../lib/supabase.js";

/**
 * Standalone feed for `/explore/hashtag/:tag` (signed-in users).
 *
 * @param {{ tag: string }} props
 */
export function HashtagFeedPage({ tag }) {
  const [posts, setPosts] = useState(/** @type {object[]} */ ([]));
  const [postCount, setPostCount] = useState(/** @type {number | null} */ (null));
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(/** @type {string | null} */ (null));

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    if (!isApiWorkerConfigured() || !String(API_WORKER_URL || "").trim()) {
      setErr("API worker is not configured.");
      setPosts([]);
      setLoading(false);
      return;
    }
    const token = await getSessionAccessToken();
    if (!token) {
      setErr("Sign in on pepguideiq.com to browse hashtag feeds.");
      setPosts([]);
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(
        `${String(API_WORKER_URL).replace(/\/$/, "")}/hashtags/${encodeURIComponent(tag)}/posts`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg =
          data && typeof data.message === "string" && data.message.trim()
            ? data.message.trim()
            : data && typeof data.error === "string" && data.error.trim()
              ? data.error.trim()
              : "Could not load posts.";
        setErr(msg);
        setPosts([]);
        setPostCount(null);
        return;
      }
      const rows = Array.isArray(data.posts) ? data.posts : [];
      const hc = data?.hashtag?.post_count;
      const n = typeof hc === "number" ? hc : Number(hc);
      setPostCount(Number.isFinite(n) ? n : rows.length);
      setPosts(rows);
    } catch {
      setErr("Could not load posts.");
      setPosts([]);
      setPostCount(null);
    } finally {
      setLoading(false);
    }
  }, [tag]);

  useEffect(() => {
    void load();
  }, [load]);

  const back = useCallback(() => {
    try {
      if (window.history.length > 1) window.history.back();
      else window.location.assign("/");
    } catch {
      try {
        window.location.assign("/");
      } catch {
        /* ignore */
      }
    }
  }, []);

  return (
    <>
      <GlobalStyles />
      <div
        style={{
          minHeight: "100vh",
          background: "var(--color-bg-page)",
          color: "var(--color-text-primary)",
          padding: "max(12px, env(safe-area-inset-top)) max(12px, env(safe-area-inset-right)) 24px max(12px, env(safe-area-inset-left))",
          boxSizing: "border-box",
          maxWidth: 560,
          margin: "0 auto",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <button
            type="button"
            onClick={back}
            className="mono"
            style={{
              fontSize: 13,
              padding: "8px 12px",
              borderRadius: 8,
              border: "1px solid var(--color-border-default)",
              background: "var(--color-bg-elevated)",
              color: "var(--color-text-secondary)",
              cursor: "pointer",
            }}
          >
            ← Back
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="brand" style={{ fontSize: 18, fontWeight: 700 }}>
              #{tag}
            </div>
            {postCount != null ? (
              <div className="mono" style={{ fontSize: 11, color: "var(--color-text-muted)", marginTop: 4 }}>
                {postCount} post{postCount === 1 ? "" : "s"}
              </div>
            ) : null}
          </div>
        </div>

        {loading ? (
          <div className="mono" style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>Loading…</div>
        ) : err ? (
          <div className="mono" style={{ fontSize: 13, color: "var(--color-warning)", lineHeight: 1.5 }}>
            {err}{" "}
            <button type="button" className="btn-teal" style={{ marginTop: 10 }} onClick={() => void load()}>
              Retry
            </button>
          </div>
        ) : posts.length === 0 ? (
          <div className="mono" style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>
            No public network posts with this tag yet.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {posts.map((row) => (
              <MediaPostCard key={String(row?.id ?? Math.random())} row={row} onDeferredDelete={() => {}} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
