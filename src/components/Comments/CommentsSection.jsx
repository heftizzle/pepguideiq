import { useEffect, useMemo, useRef, useState } from "react";
import { useComments } from "../../hooks/useComments.js";
import CommentThread from "./CommentThread.jsx";
import CommentComposer from "./CommentComposer.jsx";

/**
 * Top-level entry for a post's comments UI.
 *
 * Layout is Instagram-true:
 *   - Composer is ALWAYS rendered in its slot (live for signed-in viewers,
 *     "Sign in to comment" stub for anon). It is NOT gated on whether the
 *     thread is open.
 *   - The "View all N comments" button toggles ONLY the `CommentThread`
 *     visibility. Label flips to "Hide comments" when open. Hidden entirely
 *     when `totalKnownCount === 0`.
 *
 * The badge count uses `totalKnownCount = max(postCommentCount, knownLive)`
 * where `knownLive = topLevel.length + sum(repliesByParent[*])`. This keeps
 * the badge in sync with optimistic inserts without waiting for a parent
 * `fetchNetworkMediaPosts` refetch.
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
  const autoOpenedRef = useRef(false);

  useEffect(() => {
    if (!autoOpenThread) return;
    if (autoOpenedRef.current) return;
    autoOpenedRef.current = true;
    setThreadOpen(true);
  }, [autoOpenThread]);

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

  const toggleLabel = threadOpen
    ? "Hide comments"
    : totalKnownCount === 1
      ? "View 1 comment"
      : `View all ${totalKnownCount} comments`;

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
        layout={composerLayout}
      />
    </div>
  );
}
