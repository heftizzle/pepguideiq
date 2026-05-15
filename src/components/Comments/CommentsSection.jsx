import { useEffect, useMemo, useRef, useState } from "react";
import { useComments } from "../../hooks/useComments.js";
import CommentThread from "./CommentThread.jsx";
import CommentComposer from "./CommentComposer.jsx";
import CommentPreview from "./CommentPreview.jsx";

/**
 * Top-level entry for a post's comments UI.
 *
 * Layout is Instagram-true:
 *   - Composer is ALWAYS rendered in its slot (live for signed-in viewers,
 *     "Sign in to comment" stub for anon). It is NOT gated on whether the
 *     thread is open.
 *   - Default (`composerLayout !== "feed"`): "View all N comments" toggles
 *     `CommentThread`. Label flips to "Hide comments" when open.
 *   - Feed (`composerLayout === "feed"`): inline CommentPreview (0–2 rows),
 *     "View all X comments" when collapsed with 3+, full CommentThread when
 *     expanded — composer stays below (Network cards).
 *
 * The badge count uses `totalKnownCount = max(postCommentCount, knownLive)`
 * where `knownLive = topLevel.length + sum(repliesByParent[*])`.
 *
 * @param {{
 *   postId: string,
 *   postCommentCount?: number,
 *   currentUserId?: string | null,
 *   currentProfileId?: string | null,
 *   currentProfile?: any,
 *   currentProfileGoals?: unknown,
 *   autoOpenThread?: boolean,
 *   highlightCommentId?: string | null,
 *   composerLayout?: "default" | "feed",
 * }} props
 */
export default function CommentsSection({
  postId,
  postCommentCount = 0,
  currentUserId = null,
  currentProfileId = null,
  currentProfile = null,
  currentProfileGoals = null,
  autoOpenThread = false,
  highlightCommentId = null,
  composerLayout = "default",
}) {
  const [threadOpen, setThreadOpen] = useState(false);
  const [feedThreadExpanded, setFeedThreadExpanded] = useState(false);
  const autoOpenedDefaultRef = useRef(false);
  const autoOpenedFeedRef = useRef(false);

  useEffect(() => {
    if (composerLayout !== "default") return;
    if (!autoOpenThread) return;
    if (autoOpenedDefaultRef.current) return;
    autoOpenedDefaultRef.current = true;
    setThreadOpen(true);
  }, [composerLayout, autoOpenThread]);

  const hook = useComments({
    postId,
    currentUserId,
    currentProfileId,
    currentProfile,
  });

  const knownLive = useMemo(() => {
    const replies = Object.values(hook.repliesByParent || {}).reduce(
      (n, arr) => n + (Array.isArray(arr) ? arr.length : 0),
      0
    );
    return hook.topLevel.length + replies;
  }, [hook.topLevel, hook.repliesByParent]);

  const totalKnownCount = Math.max(
    typeof postCommentCount === "number" && postCommentCount >= 0 ? postCommentCount : 0,
    knownLive
  );

  useEffect(() => {
    if (composerLayout !== "feed") return;
    if (!autoOpenThread) return;
    if (autoOpenedFeedRef.current) return;
    autoOpenedFeedRef.current = true;
    setFeedThreadExpanded(true);
  }, [composerLayout, autoOpenThread, totalKnownCount]);

  const toggleLabel = threadOpen
    ? "Hide comments"
    : totalKnownCount === 1
      ? "View 1 comment"
      : `View all ${totalKnownCount} comments`;

  /** Top two newest top-level rows for inline preview (feed layout only). */
  const previewComments =
    composerLayout === "feed" && !feedThreadExpanded ? hook.topLevel.slice(0, 2) : [];

  const showFeedPreview =
    composerLayout === "feed" && !feedThreadExpanded && previewComments.length > 0;

  const showFeedViewAll =
    composerLayout === "feed" && totalKnownCount >= 1 && !feedThreadExpanded;

  const showFeedExpandedThread =
    composerLayout === "feed" && totalKnownCount >= 1 && feedThreadExpanded;

  if (composerLayout === "feed") {
    return (
      <div style={{ padding: "6px 14px 10px", display: "flex", flexDirection: "column", gap: 8 }}>
        {showFeedExpandedThread ? (
          <>
            <CommentThread
              hook={hook}
              postId={postId}
              currentUserId={currentUserId}
              currentProfileId={currentProfileId}
              currentProfile={currentProfile}
              currentProfileGoals={currentProfileGoals}
              highlightCommentId={highlightCommentId}
            />
            <button
              type="button"
              onClick={() => setFeedThreadExpanded(false)}
              style={{
                alignSelf: "flex-start",
                background: "none",
                border: "none",
                padding: "2px 0",
                margin: 0,
                cursor: "pointer",
                font: "inherit",
                color: "var(--color-text-muted)",
                fontSize: 13,
                textAlign: "left",
                textDecoration: "none",
              }}
            >
              Hide comments
            </button>
          </>
        ) : (
          <>
            {showFeedPreview ? (
              <CommentPreview
                comments={previewComments}
                currentUserId={currentUserId}
                onDeleteComment={hook.deleteComment}
              />
            ) : null}
            {showFeedViewAll ? (
              <button
                type="button"
                onClick={() => setFeedThreadExpanded(true)}
                aria-expanded={false}
                style={{
                  alignSelf: "flex-start",
                  background: "none",
                  border: "none",
                  padding: "2px 0",
                  margin: 0,
                  cursor: "pointer",
                  font: "inherit",
                  color: "var(--color-text-muted)",
                  fontSize: 13,
                  textAlign: "left",
                  textDecoration: "none",
                }}
              >
                {totalKnownCount === 1 ? "View 1 comment" : `View all ${totalKnownCount} comments`}
              </button>
            ) : null}
          </>
        )}

        <CommentComposer
          hook={hook}
          currentUserId={currentUserId}
          currentProfileId={currentProfileId}
          layout="feed"
        />
      </div>
    );
  }

  return (
    <div style={{ padding: "6px 14px 10px", display: "flex", flexDirection: "column", gap: 8 }}>
      {totalKnownCount > 0 ? (
        <button
          type="button"
          onClick={() => setThreadOpen((v) => !v)}
          aria-expanded={threadOpen}
          style={{
            alignSelf: "flex-start",
            background: "none",
            border: "none",
            padding: "2px 0",
            margin: 0,
            cursor: "pointer",
            font: "inherit",
            color: "var(--color-text-secondary)",
            fontSize: 13,
            textAlign: "left",
          }}
        >
          {toggleLabel}
        </button>
      ) : null}

      {threadOpen ? (
        <CommentThread
          hook={hook}
          postId={postId}
          currentUserId={currentUserId}
          currentProfileId={currentProfileId}
          currentProfile={currentProfile}
          currentProfileGoals={currentProfileGoals}
          highlightCommentId={highlightCommentId}
        />
      ) : null}

      <CommentComposer
        hook={hook}
        currentUserId={currentUserId}
        currentProfileId={currentProfileId}
        layout="default"
      />
    </div>
  );
}
