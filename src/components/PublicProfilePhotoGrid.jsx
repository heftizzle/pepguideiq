import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useThemeContext } from "../context/ThemeContext.jsx";
import { ProfileCtx } from "../context/ProfileContext.jsx";
import { supabase } from "../lib/supabase.js";
import { formatRelativeTime } from "../lib/formatTime.js";
import LikeButton from "./Likes/LikeButton.jsx";
import LikersRow from "./Likes/LikersRow.jsx";
import LikersModal from "./Likes/LikersModal.jsx";
import CommentsSection from "./Comments/CommentsSection.jsx";
import PostMenuButton from "./Posts/PostMenuButton.jsx";
import { dispatchDeferredDelete } from "./DeleteUndoToast.jsx";
import { HashtagText } from "./HashtagText.jsx";

/**
 * Instagram-style photo wall of `public.posts` rows where `visible_profile = true`.
 * Anonymous-safe: reads through the anon Supabase client (RLS policy 070) and streams
 * images from `GET /public-post-media?key=…` which re-validates `visible_profile`
 * server-side via service role.
 *
 * Grid cells show photos only. Tap a cell to open a full-screen lightbox which
 * surfaces likes (goal-emoji LikeButton + LikersRow), the post's caption, and
 * a relative timestamp below the image. Close via backdrop tap, × button, or Escape.
 *
 * Active-profile context is null-safe: `/profile/:handle` does NOT mount a
 * ProfileProvider (only ThemeProvider), so anon viewers see LikersRow read-only
 * with the LikeButton hidden. Signed-in viewers on this route (rare but valid)
 * see the full interactive controls.
 *
 * @param {{
 *   profileId: string,
 *   workerBaseUrl: string,
 *   ownerUserId?: string | null,
 *   initialPostId?: string | null,
 *   initialCommentId?: string | null,
 * }} props
 */
export default function PublicProfilePhotoGrid({
  profileId,
  workerBaseUrl,
  ownerUserId = null,
  initialPostId = null,
  initialCommentId = null,
}) {
  const { isDark } = useThemeContext();
  const profileCtx = useContext(ProfileCtx);
  const activeProfileId = profileCtx?.activeProfileId ?? null;
  const activeProfile = profileCtx?.activeProfile ?? null;
  const currentUserId = typeof activeProfile?.user_id === "string" ? activeProfile.user_id : null;
  const currentProfileGoals = activeProfile?.goals ?? null;
  const [likersOpen, setLikersOpen] = useState(false);
  const [rows, setRows] = useState(
    /** @type {Array<{ id: string, media_url: string, media_type: string | null, content: string | null, created_at: string, comment_count: number }> | null} */ (
      null
    )
  );
  const [lightboxRow, setLightboxRow] = useState(
    /** @type {{ id: string, media_url: string, media_type: string | null, content: string | null, created_at: string, comment_count: number } | null} */ (
      null
    )
  );
  /** Freeze the comment deep-link target at lightbox open-time so later URL changes don't retrigger. */
  const [lightboxHighlightCommentId, setLightboxHighlightCommentId] = useState(
    /** @type {string | null} */ (null)
  );
  /** One-shot guard so the deep-link only auto-opens once per mount even if props churn. */
  const autoOpenedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    setRows(null);
    if (!profileId || !supabase) {
      if (!cancelled) setRows([]);
      return () => {
        cancelled = true;
      };
    }
    void (async () => {
      try {
        const { data, error } = await supabase
          .from("posts")
          .select("id, media_url, media_type, content, created_at, comment_count")
          .eq("profile_id", profileId)
          .eq("visible_profile", true)
          .not("media_url", "is", null)
          .order("created_at", { ascending: false })
          .limit(60);
        if (cancelled) return;
        if (error) {
          setRows([]);
          return;
        }
        const cleaned = Array.isArray(data)
          ? data
              .map((row) => {
                const id = typeof row?.id === "string" ? row.id : "";
                const mediaUrl =
                  typeof row?.media_url === "string" ? row.media_url.trim() : "";
                const mediaType =
                  typeof row?.media_type === "string" ? row.media_type : null;
                const content =
                  typeof row?.content === "string" ? row.content : null;
                const createdAt =
                  typeof row?.created_at === "string" ? row.created_at : "";
                const commentCount =
                  typeof row?.comment_count === "number" ? row.comment_count : 0;
                if (!id || !mediaUrl) return null;
                return {
                  id,
                  media_url: mediaUrl,
                  media_type: mediaType,
                  content,
                  created_at: createdAt,
                  comment_count: commentCount,
                };
              })
              .filter(Boolean)
          : [];
        setRows(/** @type {any} */ (cleaned));
      } catch {
        if (!cancelled) setRows([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [profileId]);

  const closeLightbox = useCallback(() => {
    setLightboxRow(null);
    setLightboxHighlightCommentId(null);
    try {
      if (typeof window !== "undefined") {
        const path = window.location.pathname || "/";
        if (/^\/profile\/[^/]+$/i.test(path)) {
          const qs = new URLSearchParams(window.location.search);
          if (qs.has("post") || qs.has("comment")) {
            qs.delete("post");
            qs.delete("comment");
            const next = qs.toString();
            window.history.replaceState({}, "", next ? `${path}?${next}` : path);
          }
        }
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (!lightboxRow) return;
    const onKey = (e) => {
      if (e.key === "Escape") closeLightbox();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
    };
  }, [lightboxRow, closeLightbox]);

  useEffect(() => {
    if (!initialPostId || !Array.isArray(rows) || rows.length === 0) return;
    if (autoOpenedRef.current || lightboxRow) return;
    const match = rows.find((r) => r && r.id === initialPostId);
    if (!match) return;
    autoOpenedRef.current = true;
    setLightboxHighlightCommentId(initialCommentId || null);
    setLightboxRow(match);
  }, [initialPostId, initialCommentId, rows, lightboxRow]);

  const onDeferredDeletePost = useCallback(
    (postId) => {
      if (!postId || !supabase) return;
      let removedRow = null;
      let removedIndex = -1;
      setRows((prev) => {
        if (!Array.isArray(prev)) return prev;
        const idx = prev.findIndex((r) => r && r.id === postId);
        if (idx < 0) return prev;
        removedRow = prev[idx];
        removedIndex = idx;
        return prev.filter((_, i) => i !== idx);
      });
      setLightboxRow(null);
      setLightboxHighlightCommentId(null);
      if (!removedRow || removedIndex < 0) return;
      dispatchDeferredDelete({
        label: "Post deleted",
        onCommit: async () => {
          try {
            await supabase.from("posts").delete().eq("id", postId);
          } catch {
            /* ignore — refetch on next grid mount reconciles */
          }
        },
        onUndo: () => {
          const restoreRow = removedRow;
          const restoreIdx = removedIndex;
          setRows((prev) => {
            if (!Array.isArray(prev)) return prev;
            if (prev.some((r) => r && r.id === postId)) return prev;
            const next = prev.slice();
            const at = Math.max(0, Math.min(restoreIdx, next.length));
            next.splice(at, 0, restoreRow);
            return next;
          });
        },
      });
    },
    []
  );

  const base = typeof workerBaseUrl === "string" ? workerBaseUrl.replace(/\/$/, "") : "";
  const srcFor = (key) => `${base}/public-post-media?key=${encodeURIComponent(key)}`;

  const gridStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 2,
  };
  const cellBase = {
    aspectRatio: "1 / 1",
    padding: 0,
    margin: 0,
    border: "none",
    background: "var(--color-bg-input)",
    overflow: "hidden",
    display: "block",
    width: "100%",
  };

  let body;
  if (rows === null) {
    body = (
      <>
        <style>{`@keyframes pepguide-photo-pulse{0%,100%{opacity:.55}50%{opacity:.85}}`}</style>
        <div style={gridStyle} aria-hidden>
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              style={{
                ...cellBase,
                cursor: "default",
                animation: "pepguide-photo-pulse 1.4s ease-in-out infinite",
              }}
            />
          ))}
        </div>
      </>
    );
  } else if (rows.length === 0) {
    body = (
      <div
        className="mono"
        style={{
          fontSize: 13,
          color: "var(--color-text-secondary)",
          padding: "24px 0",
          textAlign: "center",
        }}
      >
        // No posts yet
      </div>
    );
  } else {
    body = (
      <div style={gridStyle}>
        {rows.map((row) => (
          <button
            key={row.id}
            type="button"
            onClick={() => setLightboxRow(row)}
            style={{ ...cellBase, cursor: "pointer" }}
            aria-label="Open post photo"
          >
            <img
              loading="lazy"
              alt=""
              src={srcFor(row.media_url)}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
              }}
            />
          </button>
        ))}
      </div>
    );
  }

  const lightbox =
    lightboxRow && typeof document !== "undefined"
      ? createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Post photo"
            onClick={() => closeLightbox()}
            style={{
              position: "fixed",
              inset: 0,
              background: isDark ? "rgba(0, 0, 0, 0.92)" : "rgba(255, 255, 255, 0.94)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 9000,
              padding: 16,
            }}
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                closeLightbox();
              }}
              aria-label="Close"
              style={{
                position: "fixed",
                top: "max(16px, env(safe-area-inset-top))",
                right: 16,
                width: 40,
                height: 40,
                borderRadius: "50%",
                border: `1px solid ${isDark ? "rgba(255, 255, 255, 0.35)" : "rgba(0, 0, 0, 0.25)"}`,
                background: isDark ? "rgba(0, 0, 0, 0.55)" : "rgba(255, 255, 255, 0.85)",
                color: "var(--color-text-primary)",
                fontSize: 22,
                lineHeight: 1,
                cursor: "pointer",
                zIndex: 9001,
              }}
            >
              ×
            </button>
            {currentUserId && ownerUserId && currentUserId === ownerUserId ? (
              <div
                onClick={(e) => e.stopPropagation()}
                style={{
                  position: "fixed",
                  top: "max(16px, env(safe-area-inset-top))",
                  right: 64,
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  border: `1px solid ${isDark ? "rgba(255, 255, 255, 0.35)" : "rgba(0, 0, 0, 0.25)"}`,
                  background: isDark ? "rgba(0, 0, 0, 0.55)" : "rgba(255, 255, 255, 0.85)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 9001,
                }}
              >
                <PostMenuButton
                  postId={lightboxRow.id}
                  ownerUserId={ownerUserId}
                  currentUserId={currentUserId}
                  size={32}
                  onDeferredDelete={() => onDeferredDeletePost(lightboxRow.id)}
                />
              </div>
            ) : null}
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 16,
                maxHeight: "96vh",
                overflowY: "auto",
              }}
            >
              <img
                alt=""
                src={srcFor(lightboxRow.media_url)}
                style={{
                  maxWidth: "96vw",
                  maxHeight: "92vh",
                  objectFit: "contain",
                  display: "block",
                  borderRadius: 4,
                }}
              />
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  width: "min(640px, 96vw)",
                  padding: "0 4px",
                  flexWrap: "wrap",
                }}
              >
                <LikeButton
                  entityType="post"
                  entityId={lightboxRow.id}
                  currentUserId={currentUserId}
                  currentProfileId={activeProfileId}
                  currentProfileGoals={currentProfileGoals}
                  ownerUserId={ownerUserId}
                />
                <LikersRow
                  entityType="post"
                  entityId={lightboxRow.id}
                  currentUserId={currentUserId}
                  currentProfileId={activeProfileId}
                  currentProfileGoals={currentProfileGoals}
                  onOpenModal={() => setLikersOpen(true)}
                />
              </div>
              {(lightboxRow.content || lightboxRow.created_at) && (
                <div
                  style={{
                    width: "min(640px, 96vw)",
                    padding: "12px 16px",
                    background: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)",
                    border: `1px solid ${isDark ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.08)"}`,
                    color: "var(--color-text-primary)",
                    fontSize: 14,
                    lineHeight: 1.5,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    borderRadius: 4,
                  }}
                >
                  {lightboxRow.content && (
                    <div>
                      <HashtagText text={String(lightboxRow.content)} />
                    </div>
                  )}
                  {lightboxRow.created_at && (
                    <div
                      className="mono"
                      style={{
                        marginTop: lightboxRow.content ? 8 : 0,
                        fontSize: 11,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        color: "var(--color-text-secondary)",
                      }}
                    >
                      {formatRelativeTime(lightboxRow.created_at)}
                    </div>
                  )}
                </div>
              )}
              <div
                style={{
                  width: "min(640px, 96vw)",
                  background: isDark ? "rgba(255, 255, 255, 0.04)" : "rgba(255, 255, 255, 0.85)",
                  border: `1px solid ${isDark ? "rgba(255, 255, 255, 0.10)" : "rgba(0, 0, 0, 0.08)"}`,
                  borderRadius: 4,
                  color: "var(--color-text-primary)",
                }}
              >
                <CommentsSection
                  postId={lightboxRow.id}
                  postCommentCount={lightboxRow.comment_count}
                  currentUserId={currentUserId}
                  currentProfileId={activeProfileId}
                  currentProfile={activeProfile}
                  currentProfileGoals={currentProfileGoals}
                  autoOpenThread={Boolean(lightboxHighlightCommentId)}
                  highlightCommentId={lightboxHighlightCommentId}
                />
              </div>
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <>
      {body}
      {lightbox}
      {lightboxRow ? (
        <LikersModal
          isOpen={likersOpen}
          onClose={() => setLikersOpen(false)}
          entityType="post"
          entityId={lightboxRow.id}
        />
      ) : null}
    </>
  );
}
