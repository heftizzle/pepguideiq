import CommentItem from "./CommentItem.jsx";

/**
 * Renders the scrollable top-level comment list for a post.
 *
 * Not responsible for the composer or toggle button — that's the parent
 * `CommentsSection`. This component shows:
 *   - error + loading states surfaced by `useComments`
 *   - an empty-state line when there are zero real rows (rare: the parent
 *     usually hides the section when totalKnownCount === 0)
 *   - one `CommentItem` per top-level row (newest first)
 *   - a `Load more comments` button when `hook.hasMore`
 *
 * Replies are rendered inside `CommentItem` and fetched lazily via
 * `hook.loadReplies(parentId)`.
 *
 * @param {{
 *   hook: ReturnType<typeof import("../../hooks/useComments.js").useComments>,
 *   postId: string,
 *   currentUserId: string | null,
 *   currentProfileId: string | null,
 *   currentProfile: any,
 *   currentProfileGoals: unknown,
 *   highlightCommentId?: string | null,
 * }} props
 */
export default function CommentThread({
  hook,
  postId,
  currentUserId,
  currentProfileId,
  currentProfile,
  currentProfileGoals,
  highlightCommentId = null,
}) {
  const {
    topLevel,
    repliesByParent,
    repliesLoading,
    hasMore,
    status,
    error,
    loadMore,
    loadReplies,
    post,
    deleteComment,
  } = hook;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {status === "loading" && topLevel.length === 0 ? (
        <div
          className="mono"
          style={{ fontSize: 12, color: "var(--color-text-secondary)", padding: "4px 0" }}
        >
          Loading comments…
        </div>
      ) : null}

      {status === "error" ? (
        <div style={{ fontSize: 13, color: "var(--color-warning)", padding: "4px 0" }}>
          {error || "Could not load comments."}
        </div>
      ) : null}

      {status !== "loading" && topLevel.length === 0 ? (
        <div
          className="mono"
          style={{ fontSize: 12, color: "var(--color-text-secondary)", padding: "4px 0" }}
        >
          // No comments yet
        </div>
      ) : null}

      {topLevel.map((c) => (
        <CommentItem
          key={c.id}
          comment={c}
          postId={postId}
          currentUserId={currentUserId}
          currentProfileId={currentProfileId}
          currentProfile={currentProfile}
          currentProfileGoals={currentProfileGoals}
          canReply
          replies={repliesByParent[c.id] || null}
          repliesLoading={repliesLoading.has(c.id)}
          onLoadReplies={() => loadReplies(c.id)}
          onPostReply={(body, parentCommentId) => post({ body, parentCommentId })}
          onDeleteComment={deleteComment}
          highlightCommentId={highlightCommentId}
        />
      ))}

      {hasMore ? (
        <button
          type="button"
          onClick={() => loadMore()}
          style={{
            alignSelf: "flex-start",
            background: "none",
            border: "none",
            padding: "4px 0",
            cursor: "pointer",
            color: "var(--color-text-secondary)",
            fontSize: 13,
            font: "inherit",
          }}
        >
          Load more comments
        </button>
      ) : null}
    </div>
  );
}
